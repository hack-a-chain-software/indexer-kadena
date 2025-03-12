import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { resolvers } from './resolvers';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createGraphqlContext,
  publishSubscribe,
  ResolverContext,
} from './config/apollo-server-config';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ArgumentNode, ASTNode, GraphQLError, Kind } from 'graphql';
import {
  EVENTS_EVENT,
  NEW_BLOCKS_EVENT,
  NEW_BLOCKS_FROM_DEPTH_EVENT,
  TRANSACTION_EVENT,
} from './resolvers/subscription/consts';
import { dispatchInfoSchema } from '../jobs/publisher-job';
import initCache from '../cache/init';
import { getRequiredEnvString } from '../utils/helpers';
import ipRangeCheck from 'ip-range-check';
import {
  directiveEstimator,
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import { depthLimit } from '@graphile/depth-limit';

// Maximum allowed complexity
const MAX_COMPLEXITY = 1000;

const typeDefs = readFileSync(join(__dirname, './config/schema.graphql'), 'utf-8');

const KADENA_GRAPHQL_API_PORT = getRequiredEnvString('KADENA_GRAPHQL_API_PORT');

const ALLOWED_ORIGINS = [
  getRequiredEnvString('API_GATEWAY_URL'),
  getRequiredEnvString('API_KADENA_URL'),
  `http://localhost:${KADENA_GRAPHQL_API_PORT}`,
];

const validatePaginationParamsPlugin: ApolloServerPlugin = {
  requestDidStart: async () => ({
    didResolveOperation: async ({ request, document }) => {
      const variables = { ...request.variables }; // External variables
      // prettier-ignore
      const inlineArguments: Record<string, any> = {};

      // Helper function to extract inline arguments
      const extractArguments = (node: ASTNode) => {
        if (node.kind === Kind.FIELD && node.arguments) {
          node.arguments.forEach((arg: ArgumentNode) => {
            if (arg.value.kind === Kind.STRING) {
              inlineArguments[arg.name.value] = arg.value.value;
            } else if (arg.value.kind === Kind.INT) {
              inlineArguments[arg.name.value] = parseInt(arg.value.value, 10);
            } else if (arg.value.kind === Kind.FLOAT) {
              inlineArguments[arg.name.value] = parseFloat(arg.value.value);
            } else if (arg.value.kind === Kind.BOOLEAN) {
              inlineArguments[arg.name.value] = arg.value.value === true;
            }
          });
        }
        if (node.kind === Kind.SELECTION_SET) {
          node.selections.forEach(selection => extractArguments(selection));
        }
      };

      // Traverse the query AST to extract inline arguments
      if (document) {
        document.definitions.forEach(definition => {
          if (definition.kind === Kind.OPERATION_DEFINITION && definition.selectionSet) {
            extractArguments(definition.selectionSet);
          }
        });
      }

      // Combine variables and inline arguments
      const combinedVariables = { ...inlineArguments, ...variables };
      const { after, before, first, last } = combinedVariables;

      // Validation logic
      if (after && before) {
        throw new GraphQLError(
          'You cannot use both "after" and "before" at the same time. Please use only one or none.',
        );
      }

      if (first && last) {
        throw new GraphQLError(
          'You cannot use both "first" and "last" at the same time. Please use only one or none.',
        );
      }

      if (before && first) {
        throw new GraphQLError(
          'You cannot use both "before" and "first" at the same time. Use before with last or after with first instead.',
        );
      }

      if (after && last) {
        throw new GraphQLError(
          'You cannot use both "after" and "last" at the same time. Use before with last or after with first instead.',
        );
      }
    },
  }),
};
const allowedCIDRs = ['10.0.2.0/24', '10.0.3.0/24'];

const ipFilterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.ip && ipRangeCheck(req.ip, allowedCIDRs)) {
    next(); // Allow access
  } else {
    res.status(403).json({ message: 'Access denied: IP not allowed' });
  }
};

const isAllowedOrigin = (origin: string): boolean => {
  try {
    const originUrl = new URL(origin);
    return ALLOWED_ORIGINS.some(allowed => {
      const allowedUrl = new URL(allowed);
      // Check if it's an exact match
      if (originUrl.origin === allowedUrl.origin) return true;
      // Check if it's a subdomain (only for kadena.io)
      if (allowedUrl.hostname === 'kadena.io' && originUrl.hostname.endsWith('.kadena.io'))
        return true;
      return false;
    });
  } catch {
    return false;
  }
};

export async function useKadenaGraphqlServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<ResolverContext>({
    typeDefs,
    resolvers,
    introspection: true,
    validationRules: [
      depthLimit({
        maxDepth: 7, // Reasonable depth for most queries
        maxListDepth: 5, // Prevent deeply nested array queries
        maxSelfReferentialDepth: 2, // Limit recursive queries
        maxIntrospectionDepth: 15, // Limit introspection query depth
        maxIntrospectionListDepth: 8, // Limit introspection array depth
        maxIntrospectionSelfReferentialDepth: 2,
        revealDetails: false, // Don't expose limits to clients
      }),
    ],
    plugins: [
      validatePaginationParamsPlugin,
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      {
        requestDidStart: async () => ({
          async didResolveOperation({ request, document }) {
            // Skip complexity check for introspection or Apollo can't get the schemas
            if (request.operationName == 'IntrospectionQuery') return;
            /**
             * Provides GraphQL query analysis to be able to react on complex queries to the GraphQL server
             * It can be used to protect the GraphQL server against resource exhaustion and DoS attacks
             * More documentation can be found at https://github.com/ivome/graphql-query-complexity
             */
            const complexity = getComplexity({
              // GraphQL schema
              schema,
              // To calculate query complexity properly,
              // check only the requested operation
              // not the whole document that may contains multiple operations
              operationName: request.operationName,
              // GraphQL query document
              query: document,
              // GraphQL query variables
              variables: request.variables,
              // Add any number of estimators. The estimators are invoked in order, the first
              // numeric value that is being returned by an estimator is used as the field complexity
              // If no estimator returns a value, an exception is raised
              estimators: [
                // Using fieldExtensionsEstimator is mandatory to make it work with type-graphql
                fieldExtensionsEstimator(),
                // Add directive support
                directiveEstimator({
                  // Optionally change the name of the directive here... Default value is `complexity`
                  name: 'complexity',
                }),
                // Add more estimators here...
                // This will assign each field a complexity of 1
                // if no other estimator returned a value
                simpleEstimator({ defaultComplexity: 1 }),
              ],
            });

            // React to the calculated complexity,
            // like compare it with max and throw error when the threshold is reached
            if (complexity > MAX_COMPLEXITY) {
              throw new Error(
                `Sorry, too complicated query! ${complexity} exceeded the maximum allowed complexity of ${MAX_COMPLEXITY}`,
              );
            }
            console.log('Used query complexity points:', complexity);
          },
        }),
      },
    ],
  });
  await server.start();

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const context = await createGraphqlContext();

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
    verifyClient: ({ origin }, callback) => {
      if (!origin || origin === 'null') {
        return callback(false, 400, 'No origin');
      }
      if (isAllowedOrigin(origin)) {
        return callback(true);
      }
      return callback(false, 403, 'Forbidden');
    },
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async ctx => {
        const abortController = new AbortController();

        ctx.extra.socket.addEventListener('close', () => {
          abortController.abort(); // Only aborts this specific subscription
        });

        return {
          ...context,
          signal: abortController.signal, // Pass signal per subscription
        };
      },
    },
    wsServer,
  );
  app.use(express.json());

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: (origin, callback) => {
        console.log('Received Origin', origin);
        if (!origin || origin === 'null') {
          return callback(null, false);
        }

        console.log('Origin is not null');

        try {
          if (isAllowedOrigin(origin)) {
            console.log('Origin is allowed');
            return callback(null, true);
          }
          return callback(new Error(`Origin ${origin} not allowed by CORS`));
        } catch (error) {
          return callback(null, false);
        }
      },
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'Pragma',
      ],
      exposedHeaders: ['Access-Control-Allow-Origin'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // 24 hours
    }),
    expressMiddleware(server, {
      context: createGraphqlContext,
    }),
  );

  // Handle OPTIONS requests explicitly
  app.options('*', (req: Request, res: Response) => {
    const origin = req.headers.origin;
    console.log('Handling Received Origin in Options', origin);
    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control, Pragma',
      );
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      res.status(403).end();
    }
  });

  app.post('/new-block', ipFilterMiddleware, async (req, res) => {
    const payload = await dispatchInfoSchema.safeParseAsync(req.body);
    if (!payload.success) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const { hash, chainId, height, requestKeys, qualifiedEventNames } = payload.data;

    publishSubscribe.publish(NEW_BLOCKS_EVENT, {
      hash,
      chainId,
    });

    publishSubscribe.publish(NEW_BLOCKS_FROM_DEPTH_EVENT, {
      height,
      chainId,
      hash,
    });

    const eventPromises = qualifiedEventNames.map(qualifiedEventName => {
      return publishSubscribe.publish(EVENTS_EVENT, {
        qualifiedEventName,
        height,
        chainId,
        hash,
      });
    });

    const transactionPromises = requestKeys.map(requestKey => {
      return publishSubscribe.publish(TRANSACTION_EVENT, {
        chainId,
        requestKey,
      });
    });

    await Promise.all([...eventPromises, ...transactionPromises]);

    res.json({
      message: 'New block published.',
    });
  });

  await initCache(context);
  await new Promise<void>(resolve => httpServer.listen({ port: KADENA_GRAPHQL_API_PORT }, resolve));
  console.log(`Server running on port ${KADENA_GRAPHQL_API_PORT}.`);
}
