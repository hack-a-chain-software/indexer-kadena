/**
 * GraphQL server initialization and configuration for the Kadena Indexer
 *
 * This file sets up and configures the Apollo GraphQL server that serves as the primary
 * API interface for the Kadena Indexer. It includes:
 *
 * - Apollo Server setup with schema and resolvers
 * - WebSocket subscription support
 * - Express middleware configuration
 * - CORS security controls
 * - Query complexity analysis to prevent DoS attacks
 * - Pagination parameter validation
 * - IP filtering for sensitive endpoints
 * - Event dispatch for real-time updates
 *
 * The server implements both HTTP (for queries and mutations) and WebSocket (for
 * subscriptions) protocols, allowing for real-time data updates and efficient
 * data fetching with advanced filtering and pagination.
 */

import './plugins/instrument';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { resolvers } from './resolvers';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createGraphqlContext, ResolverContext } from './config/apollo-server-config';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ArgumentNode, ASTNode, GraphQLError, Kind } from 'graphql';

import initCache from '../cache/init';
import { getRequiredEnvString, getRequiredArrayEnvString } from '../utils/helpers';
import {
  directiveEstimator,
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import { depthLimit } from '@graphile/depth-limit';
import { createSentryPlugin } from './plugins/sentry-plugin';

/**
 * Maximum allowed complexity for GraphQL queries
 *
 * This value (2500) sets the upper bound for allowed query complexity.
 * It serves as a protection mechanism against resource-intensive queries that could
 * potentially overload the server or deplete resources. The complexity value is determined
 * by the query depth, breadth, and field-specific complexity values defined through
 * directives or extensions.
 *
 * If a query exceeds this complexity, it will be rejected before execution.
 */
const MAX_COMPLEXITY = 2500;

/**
 * GraphQL schema definition
 *
 * Loads the GraphQL schema from a file, which defines all available:
 * - Types (objects, inputs, interfaces, unions, enums)
 * - Queries (data retrieval operations)
 * - Mutations (data modification operations)
 * - Subscriptions (real-time update channels)
 *
 * This schema is the contract between the API and its clients.
 */
const typeDefs = readFileSync(join(__dirname, './config/schema.graphql'), 'utf-8');

/**
 * The port on which the GraphQL API will listen
 */
const KADENA_GRAPHQL_API_PORT = getRequiredEnvString('KADENA_GRAPHQL_API_PORT');

/**
 * Array of domains allowed to access the GraphQL API
 */
const ALLOWED_ORIGINS = getRequiredArrayEnvString('ALLOWED_ORIGINS');

/**
 * Apollo Server plugin that validates pagination parameters in GraphQL requests
 *
 * This plugin enforces the Relay Connection Specification for cursor-based pagination
 * by validating that clients aren't using incompatible pagination parameters together.
 *
 * It validates four key rules:
 * 1. `after` and `before` cursors cannot be used together (can't paginate forward and
 *    backward simultaneously)
 * 2. `first` and `last` count limiters cannot be used together (can't request both the
 *    first N and last N items)
 * 3. `before` cursor cannot be used with `first` count (incompatible pagination directions)
 * 4. `after` cursor cannot be used with `last` count (incompatible pagination directions)
 *
 * The plugin works by:
 * - Extracting inline arguments from the query AST (Abstract Syntax Tree)
 * - Handling different argument types (string, int, float, boolean)
 * - Combining these with explicitly provided variables
 * - Checking for prohibited combinations and throwing helpful error messages
 *
 * This ensures consistent pagination behavior across the API and prevents clients
 * from making logically contradictory requests.
 */
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

      // Validation logic - enforcing Relay pagination rules
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

/**
 * Apollo Server plugin that ensures all error responses are sanitized
 *
 * This plugin provides an additional layer of security by ensuring that
 * no sensitive information like stack traces or file paths are included
 * in GraphQL error responses, regardless of where they're generated.
 *
 * While the formatError function handles most cases, this plugin acts
 * as a final safeguard to catch any errors that might bypass that function.
 */
const securitySanitizationPlugin: ApolloServerPlugin = {
  requestDidStart: async () => ({
    willSendResponse: async ({ response }) => {
      // If there are errors in the response, ensure they don't contain sensitive data
      if (response.body.kind === 'single' && response.body.singleResult.errors) {
        response.body.singleResult.errors = response.body.singleResult.errors.map(error => {
          // Create a sanitized copy without extensions that might contain sensitive data
          if (error.extensions) {
            return {
              ...error,
              locations: undefined,
              path: undefined,
              code: error.extensions.code,
              extensions: undefined,
            };
          }
          return error;
        });
      }
    },
  }),
};

/**
 * Checks if an origin is allowed to access the GraphQL API
 *
 * Implements CORS policy by validating origin domains against the allowed list.
 * Permits localhost for development and allows both exact matches and subdomains
 * of kadena.io.
 *
 * @param origin - The origin domain requesting access
 * @returns Boolean indicating if the origin is allowed
 */
const isAllowedOrigin = (origin: string): boolean => {
  try {
    const originUrl = new URL(origin);
    if (originUrl.hostname === 'localhost') return true;

    return ALLOWED_ORIGINS.some(allowed => {
      const allowedUrl = new URL(allowed);
      // Check if it's an exact match
      if (originUrl.origin === allowedUrl.origin) return true;
      // Check if it's a subdomain (only for kadena.io)
      if (allowedUrl.hostname === 'kadena.io' && originUrl.hostname.endsWith('.kadena.io')) {
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
};

/**
 * Initializes and starts the GraphQL server
 *
 * Sets up the Apollo Server with:
 * - GraphQL schema and resolvers
 * - Express middleware for HTTP requests
 * - WebSocket server for subscriptions
 * - Security plugins including query complexity analysis and depth limiting
 * - Custom endpoints for blockchain event notifications
 * - CORS configuration to restrict access to allowed origins
 *
 * This function bootstraps the entire GraphQL API service and begins listening
 * for requests on the configured port.
 */
export async function startGraphqlServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<ResolverContext>({
    typeDefs,
    resolvers,
    introspection: true,
    validationRules: [
      depthLimit({
        maxDepth: 15, // Reasonable depth for most queries
        maxListDepth: 8, // Prevent deeply nested array queries
        maxSelfReferentialDepth: 3, // Limit recursive queries
        maxIntrospectionDepth: 15, // Limit introspection query depth
        maxIntrospectionListDepth: 8, // Limit introspection array depth
        maxIntrospectionSelfReferentialDepth: 3,
        revealDetails: false, // Don't expose limits to clients
      }),
    ],
    plugins: [
      createSentryPlugin(),
      validatePaginationParamsPlugin,
      securitySanitizationPlugin,
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
          /**
           * Query complexity analysis middleware
           *
           * Calculates the complexity of incoming GraphQL queries to prevent
           * resource exhaustion attacks. Rejects queries that exceed the
           * maximum allowed complexity threshold.
           */
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
                `Sorry, too complicated query! Exceeded the maximum allowed complexity.`,
              );
            }
          },
        }),
      },
    ],
  });
  await server.start();

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const context = await createGraphqlContext();

  // Set up WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Track active connections
  let activeConnections = 0;

  /**
   * Configure WebSocket server for GraphQL subscriptions with cleanup handling
   *
   * This setup integrates the WebSocket server with the GraphQL schema to support
   * real-time subscriptions. Key features include:
   *
   * 1. Context initialization for each subscription with:
   *    - An AbortController to manage subscription lifecycle
   *    - Event listener that automatically aborts when connection closes
   *    - Signal passing for clean termination of long-running operations
   *
   * 2. Resource cleanup handling:
   *    - The serverCleanup object provides a dispose() method
   *    - This method is called during server shutdown in the drainServer function
   *    - Ensures all subscriptions are properly terminated when server stops
   *
   * This mechanism prevents memory leaks by ensuring subscription resources
   * are released when clients disconnect or when the server shuts down.
   */
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
      // Add connection lifecycle hooks for tracking
      onConnect: ctx => {
        const ip = ctx.extra.request.socket.remoteAddress || 'unknown';
        activeConnections++;
        console.log('New connection -> ', ip, 'Total connections opened:', activeConnections);
        return true; // Allow the connection
      },
      onDisconnect: (ctx, code, reason) => {
        const ip = ctx.extra.request.socket.remoteAddress || 'unknown';
        activeConnections--;
        console.log('Closed connection -> ', ip, 'Total connections opened:', activeConnections);
      },
    },
    wsServer,
  );
  app.use(express.json());

  /**
   * Simple health check endpoint
   *
   * Returns a 200 OK response to indicate the service is running properly.
   * This endpoint can be used by load balancers, monitoring tools, and
   * container orchestration platforms to verify service availability.
   */
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK' });
  });

  // Configure CORS and Express middleware for GraphQL endpoint
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: (origin, callback) => {
        if (!origin || origin === 'null') {
          return callback(null, false);
        }

        try {
          if (isAllowedOrigin(origin)) {
            return callback(null, true);
          }
          return callback(new Error(`[ERROR][CORS][ORIGIN] Origin ${origin} not allowed by CORS`));
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
      maxAge: 86400, // 24 hours
    }),
    expressMiddleware(server, {
      context: createGraphqlContext,
    }),
  );

  /**
   * Handle CORS preflight OPTIONS requests explicitly
   *
   * This endpoint manages the CORS preflight requests that browsers send before making
   * actual API requests. It's a critical security component that:
   *
   * 1. Validates the origin against the allowed domains list
   * 2. Sets appropriate CORS headers when origins are allowed:
   *    - Access-Control-Allow-Origin: Reflects the allowed origin
   *    - Access-Control-Allow-Credentials: Enables authenticated requests
   *    - Access-Control-Allow-Methods: Limits to POST and OPTIONS methods
   *    - Access-Control-Allow-Headers: Specifies allowed request headers
   *    - Access-Control-Max-Age: Caches preflight result for 24 hours (86400s)
   * 3. Returns 204 No Content for allowed origins or 403 Forbidden for disallowed ones
   *
   * This explicit handling ensures precise control over cross-origin security,
   * preventing unauthorized domains from accessing the API while allowing
   * legitimate client applications to function properly.
   */
  app.options('*', (req: Request, res: Response) => {
    const origin = req.headers.origin;
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

  // Initialize cache and start the server
  await initCache(context);
  await new Promise<void>(resolve => httpServer.listen({ port: KADENA_GRAPHQL_API_PORT }, resolve));
  console.info(`[INFO][API][BIZ_FLOW] GraphQL server started on port ${KADENA_GRAPHQL_API_PORT}.`);
}
