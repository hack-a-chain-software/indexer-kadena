import { gql } from 'graphql-request';

interface PactData {
  key: string;
  value: string;
}

interface PactQueryItem {
  chainId: string;
  code: string;
  data?: PactData[];
}

interface PactQueryParams {
  pactQuery: PactQueryItem[];
}

export const getPactQueryBuilder = (params: PactQueryParams): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getPactQueryBuilder.');
  }

  if (Object.keys(params).length > 1 || !params.pactQuery) {
    throw new Error('Only pactQuery parameter is allowed in getPactQueryBuilder.');
  }

  const formattedParams = Object.entries(params)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const formattedArray = value.map(item => {
          const { chainId, code, data } = item;
          const dataString = data
            ? `, data: [${data.map((d: PactData) => `{ key: ${JSON.stringify(d.key)}, value: ${JSON.stringify(d.value)} }`).join(', ')}]`
            : '';
          return `{ chainId: ${JSON.stringify(chainId)}, code: ${JSON.stringify(code)}${dataString} }`;
        });
        return `${key}: [${formattedArray.join(', ')}]`;
      }

      throw new Error('Invalid parameter in getPactQueryBuilder.');
    })
    .join(', ');

  const queryGql = gql`
    query {
      pactQuery(${formattedParams}) {
        chainId
        code
        error
        result
        status
      }
    }
  `;

  return queryGql;
};
