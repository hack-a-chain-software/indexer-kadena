import { gql } from 'graphql-request';

export const blockFragment = `
... on Block {
  chainId
  creationTime
  difficulty
  epoch
  events {
    edges {
      node {
        id
      }
    }
  }
  flags
  hash
  height
  id
  minerAccount {
    accountName
    balance
  }
  neighbors {
    chainId
    hash
  }
  nonce
  parent {
    id
  }
  payloadHash
  powHash
  target
  transactions {
    edges {
      node {
        id
      }
    }
  }
  weight
}
`;

const eventFragment = `
... on Event {
  block {
    id
  }
  chainId
  height
  id
  moduleName
  name
  orderIndex
  parameters
  parameterText
  qualifiedName
  requestKey
  transaction {
    id
  }
}
`;

const fungibleAccountFragment = `
... on FungibleAccount {
  accountName
  chainAccounts {
    accountName
    chainId
    fungibleName
    guard {
      raw
    }
    id
  }
  fungibleName
  id
}
`;

const fungibleChainAccountFragment = `
... on FungibleChainAccount {
  accountName
  chainId
  fungibleName
  guard {
    raw
  }
  id
}
`;

const nonFungibleAccountFragment = `
... on NonFungibleAccount {
  id
  accountName
  nonFungibleTokenBalances {
    id
    accountName
    chainId
    guard {
      ... on KeysetGuard {
        keys
        predicate
      }
    }
    info {
      precision
      supply
      uri
    }
    tokenId
    version
  }
}
`;

const nonFungibleChainAccountFragment = `
... on NonFungibleChainAccount {
  accountName
  chainId
  id
  nonFungibleTokenBalances {
    accountName
    chainId
    guard {
      ... on KeysetGuard {
        keys
        predicate
      }
    }
    id
    info {
      precision
      supply
      uri
    }
    tokenId
    version
  }
}
`;

const nonFungibleTokenBalanceFragment = `
... on NonFungibleTokenBalance {
  accountName
  balance
  chainId
  guard {
    ... on KeysetGuard {
      keys
      predicate
    }
  }
  id
  info {
    precision
    supply
    uri
  }
  tokenId
  version
}
`;

const signerFragment = `
... on Signer {
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
`;

export const transactionFragment = `
... on Transaction {
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
      id
    }
  }
  hash
  id
  result {
    ... on TransactionResult {
      badResult
      block {
        id
      }
      continuation
      eventCount
      events {
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
`;

const transferFragment = `
... on Transfer {
  amount
  block {
    id
  }
  creationTime
  crossChainTransfer {
    id
  }
  id
  moduleHash
  moduleName
  orderIndex
  receiverAccount
  requestKey
  senderAccount
  transaction {
    id
  }
}
`;

export const getNodeQuery = (type: string, params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getNodeQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      node(${query}) {
        ${type === 'Block' ? blockFragment : ''}
        ${type === 'Event' ? eventFragment : ''}
        ${type === 'FungibleAccount' ? fungibleAccountFragment : ''}
        ${type === 'FungibleChainAccount' ? fungibleChainAccountFragment : ''}
        ${type === 'NonFungibleAccount' ? nonFungibleAccountFragment : ''}
        ${type === 'NonFungibleChainAccount' ? nonFungibleChainAccountFragment : ''}
        ${type === 'NonFungibleTokenBalance' ? nonFungibleTokenBalanceFragment : ''}
        ${type === 'Signer' ? signerFragment : ''}
        ${type === 'Transaction' ? transactionFragment : ''}
        ${type === 'Transfer' ? transferFragment : ''}
      }
    }
  `;

  return queryGql;
};
