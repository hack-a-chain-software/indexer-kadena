import { gql } from 'graphql-request';

export const getTransactionsByPublicKeyQuery = (params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getTransactionsByPublicKeyQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      transactionsByPublicKey(${query}) {
        edges {
          cursor
          node {
            cmd {
              meta {
                chainId
                creationTime
                gasLimit
                gasPrice
                sender
                ttl
              }
              networkId
              nonce
              payload {
                ... on ExecutionPayload {
                  code
                  data
                }
              }
              signers {
                address
                clist {
                  args
                  name
                }
                id
                orderIndex
                pubkey
                scheme
              }
            }
            hash
            id
            orphanedTransactions {
              id
            }
            result {
              ... on TransactionResult {
                badResult
                block {
                  id
                }
                continuation
                eventCount
                events {
                  pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                  }
                  edges {
                    node {
                      id
                    }
                  }
                }
                gas
                goodResult
                logs
                transactionId
                transfers {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
            sigs {
              sig
            }
          }
        }
      }
    }
  `;

  return queryGql;
};
