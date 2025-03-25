import { GraphQLClient, gql } from 'graphql-request';
const API_URL = 'http://localhost:3001/graphql';

const client = new GraphQLClient(API_URL);

const resOne = {
  data: {
    events: {
      edges: [
        {
          cursor: 'MzA2',
          node: {
            id: 'RXZlbnQ6WyJ6NWw0S3VuaDRtNXp6allZMGxkZGp5eFppdGh6VzE0TlZXeWtMdENnNzhrIiwiMyIsIm9DNWtvY2RwWkpyRTFET1M0WWMzUVhSX0ZRcURuNVZmbElUeG9JZElqQ0UiXQ==',
            chainId: 10,
            height: 5360932,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3","antpoolkda",{"keys":["9b96f423e74914c5d4126cf47be4ffba2ec5b813e76f34d110e47729b33d5602","c86cc931441dd53cc9efb83b1a8144fd2e684647b8d670da376d4d937e5998af"],"pred":"keys-all"},"0",14064]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'oC5kocdpZJrE1DOS4Yc3QXR_FQqDn5VflITxoIdIjCE',
          },
        },
        {
          cursor: 'Mjg2',
          node: {
            id: 'RXZlbnQ6WyJQNVVPNUItRXpZTUlGMi1icF81d1BoLUNZTWhYbUNOZ2JLU0JYX3lGcUl3IiwiMyIsIkhSNmI1cWsxSmMwQmhDSTRxQlVvaWU4Z1d4SEVqSkxYM0hIbkdmblhQZ0EiXQ==',
            chainId: 10,
            height: 5361265,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",351.6923599]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'HR6b5qk1Jc0BhCI4qBUoie8gWxHEjJLX3HHnGfnXPgA',
          },
        },
        {
          cursor: 'MjQy',
          node: {
            id: 'RXZlbnQ6WyJDaG9zdVNGX2h5R25odk52bnhuNElPU2VPSVJrWDA0Z19LLXkxay1DY0VjIiwiMyIsIlIwQ3Z6RDN0dDlRaUphWWhrMHUyRS1wRWEtWnBQX3pOaVBqWVgxMXdraEEiXQ==',
            chainId: 10,
            height: 5362705,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",346.8493799]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'R0CvzD3tt9QiJaYhk0u2E-pEa-ZpP_zNiPjYX11wkhA',
          },
        },
        {
          cursor: 'MjAy',
          node: {
            id: 'RXZlbnQ6WyI1VGRNSUd5cGdYeUhCeERxTDJFWFNOclpVRTJjZVFKNXQ5N0I1bXBJQXlzIiwiMyIsIlMyVm5FcjQtbkJ4VlZBMENXQ3kzdS1Bc3BTaTAyVUdOVy0wdEcyOEpHSU0iXQ==',
            chainId: 10,
            height: 5364143,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",398.0497699]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'S2VnEr4-nBxVVA0CWCy3u-AspSi02UGNW-0tG28JGIM',
          },
        },
        {
          cursor: 'MTUz',
          node: {
            id: 'RXZlbnQ6WyJzQjVuNVduanAwelZSZmpESURBZExTcnlTY3Z1OC1fdlRtLS1iUWJyUnBnIiwiMyIsInhuaVBEM0RjZVc5blc0RC1Id2RfOGZGVUJIaUg2LVZ5dTgtb0F3d3BtQ0kiXQ==',
            chainId: 10,
            height: 5365581,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",374.8684599]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'xniPD3DceW9nW4D-Hwd_8fFUBHiH6-Vyu8-oAwwpmCI',
          },
        },
        {
          cursor: 'MTE4',
          node: {
            id: 'RXZlbnQ6WyJWalF1MVV3by04XzhaT0FFRjNISmxFbkd2R3JhWTgwcWE5WnIyQnBIbmVJIiwiMyIsInZoWkx3MjllMWZoYWpZOGEzWndia2tfRGR6LVRaRThDaHJZSWNUcnFyWGciXQ==',
            chainId: 10,
            height: 5366862,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["1","coin.transfer-crosschain",["k:4c65e9b761ae74dd68baa0cf652f61222292a08f1c505d6fd092867b6572f8f9","k:4c65e9b761ae74dd68baa0cf652f61222292a08f1c505d6fd092867b6572f8f9",{"keys":["4c65e9b761ae74dd68baa0cf652f61222292a08f1c505d6fd092867b6572f8f9"],"pred":"keys-all"},"1",0.034779]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'vhZLw29e1fhajY8a3Zwbkk_Ddz-TZE8ChrYIcTrqrXg',
          },
        },
        {
          cursor: 'MTA5',
          node: {
            id: 'RXZlbnQ6WyJwRGxzcnRzU1BWaVNrei1XOUVGb1VEdFU4RzRZTk9yek53dVN1bl90Yk5FIiwiMyIsIi13c2U5UGM4ZkVRd2NuaFpqZzZ4ZWl1eTlpLXhtLTl5YjFySFdzc0R3OTAiXQ==',
            chainId: 10,
            height: 5367016,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",359.4035599]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: '-wse9Pc8fEQwcnhZjg6xeiuy9i-xm-9yb1rHWssDw90',
          },
        },
        {
          cursor: 'NjY=',
          node: {
            id: 'RXZlbnQ6WyJPSFFUN1BpVmxyV2FhTmlsWktNWF9RUnRrazZDczVheVB4YmpuNVFMRHVrIiwiMyIsIlFkN1V4RnFSMmZlamxQVDYtblB5MnFicVNRRS1uY3hUaS1Ic0NfRHIwakEiXQ==',
            chainId: 10,
            height: 5368317,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["2","coin.transfer-crosschain",["k:e3c89f0b944b11a4491d83b1303abfa7c7c7332cc86eba38a8aabb3ab5d7fecd","k:e3c89f0b944b11a4491d83b1303abfa7c7c7332cc86eba38a8aabb3ab5d7fecd",{"keys":["e3c89f0b944b11a4491d83b1303abfa7c7c7332cc86eba38a8aabb3ab5d7fecd"],"pred":"keys-all"},"2",0.39934589]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'Qd7UxFqR2fejlPT6-nPy2qbqSQE-ncxTi-HsC_Dr0jA',
          },
        },
        {
          cursor: 'NTc=',
          node: {
            id: 'RXZlbnQ6WyIzSkg1bUJTdnB3azVhYzdjdFFrWDYwd2ExRHlvb055RHIxTnFzc01BVnMwIiwiMyIsImxwWURRN2llRDNvcmVVMlU2ZkhXUTdJYVotV3V2M2pLMHUySGZkc01wMzgiXQ==',
            chainId: 10,
            height: 5368456,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",372.9301399]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'lpYDQ7ieD3oreU2U6fHWQ7IaZ-Wuv3jK0u2HfdsMp38',
          },
        },
        {
          cursor: 'MjE=',
          node: {
            id: 'RXZlbnQ6WyJRemk1OHZjcFc5N2R1MDFzckl3eHB3U1FVUERSTkJubDJFS3l1YlAtSVd3IiwiMyIsIkxJYkp4djJfU0xtdXlWT1dhd0hBdmFkMm9nNFFBaklnZUhRUFNyejh3Mk0iXQ==',
            chainId: 10,
            height: 5369899,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",337.1879699]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'LIbJxv2_SLmuyVOWawHAvad2og4QAjIgeHQPSrz8w2M',
          },
        },
      ],
    },
  },
};

const resTwo = {
  data: {
    events: {
      edges: [
        {
          cursor: 'MjE=',
          node: {
            id: 'RXZlbnQ6WyJRemk1OHZjcFc5N2R1MDFzckl3eHB3U1FVUERSTkJubDJFS3l1YlAtSVd3IiwiMyIsIkxJYkp4djJfU0xtdXlWT1dhd0hBdmFkMm9nNFFBaklnZUhRUFNyejh3Mk0iXQ==',
            chainId: 10,
            height: 5369899,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",337.1879699]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'LIbJxv2_SLmuyVOWawHAvad2og4QAjIgeHQPSrz8w2M',
          },
        },
        {
          cursor: 'NTc=',
          node: {
            id: 'RXZlbnQ6WyIzSkg1bUJTdnB3azVhYzdjdFFrWDYwd2ExRHlvb055RHIxTnFzc01BVnMwIiwiMyIsImxwWURRN2llRDNvcmVVMlU2ZkhXUTdJYVotV3V2M2pLMHUySGZkc01wMzgiXQ==',
            chainId: 10,
            height: 5368456,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",372.9301399]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'lpYDQ7ieD3oreU2U6fHWQ7IaZ-Wuv3jK0u2HfdsMp38',
          },
        },
        {
          cursor: 'NjY=',
          node: {
            id: 'RXZlbnQ6WyJPSFFUN1BpVmxyV2FhTmlsWktNWF9RUnRrazZDczVheVB4YmpuNVFMRHVrIiwiMyIsIlFkN1V4RnFSMmZlamxQVDYtblB5MnFicVNRRS1uY3hUaS1Ic0NfRHIwakEiXQ==',
            chainId: 10,
            height: 5368317,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["2","coin.transfer-crosschain",["k:e3c89f0b944b11a4491d83b1303abfa7c7c7332cc86eba38a8aabb3ab5d7fecd","k:e3c89f0b944b11a4491d83b1303abfa7c7c7332cc86eba38a8aabb3ab5d7fecd",{"keys":["e3c89f0b944b11a4491d83b1303abfa7c7c7332cc86eba38a8aabb3ab5d7fecd"],"pred":"keys-all"},"2",0.39934589]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'Qd7UxFqR2fejlPT6-nPy2qbqSQE-ncxTi-HsC_Dr0jA',
          },
        },
        {
          cursor: 'MTA5',
          node: {
            id: 'RXZlbnQ6WyJwRGxzcnRzU1BWaVNrei1XOUVGb1VEdFU4RzRZTk9yek53dVN1bl90Yk5FIiwiMyIsIi13c2U5UGM4ZkVRd2NuaFpqZzZ4ZWl1eTlpLXhtLTl5YjFySFdzc0R3OTAiXQ==',
            chainId: 10,
            height: 5367016,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",359.4035599]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: '-wse9Pc8fEQwcnhZjg6xeiuy9i-xm-9yb1rHWssDw90',
          },
        },
        {
          cursor: 'MTE4',
          node: {
            id: 'RXZlbnQ6WyJWalF1MVV3by04XzhaT0FFRjNISmxFbkd2R3JhWTgwcWE5WnIyQnBIbmVJIiwiMyIsInZoWkx3MjllMWZoYWpZOGEzWndia2tfRGR6LVRaRThDaHJZSWNUcnFyWGciXQ==',
            chainId: 10,
            height: 5366862,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["1","coin.transfer-crosschain",["k:4c65e9b761ae74dd68baa0cf652f61222292a08f1c505d6fd092867b6572f8f9","k:4c65e9b761ae74dd68baa0cf652f61222292a08f1c505d6fd092867b6572f8f9",{"keys":["4c65e9b761ae74dd68baa0cf652f61222292a08f1c505d6fd092867b6572f8f9"],"pred":"keys-all"},"1",0.034779]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'vhZLw29e1fhajY8a3Zwbkk_Ddz-TZE8ChrYIcTrqrXg',
          },
        },
        {
          cursor: 'MTUz',
          node: {
            id: 'RXZlbnQ6WyJzQjVuNVduanAwelZSZmpESURBZExTcnlTY3Z1OC1fdlRtLS1iUWJyUnBnIiwiMyIsInhuaVBEM0RjZVc5blc0RC1Id2RfOGZGVUJIaUg2LVZ5dTgtb0F3d3BtQ0kiXQ==',
            chainId: 10,
            height: 5365581,
            moduleName: 'pact',
            name: 'X_YIELD',
            orderIndex: 3,
            parameters:
              '["0","coin.transfer-crosschain",["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",374.8684599]]',
            qualifiedName: 'pact.X_YIELD',
            requestKey: 'xniPD3DceW9nW4D-Hwd_8fFUBHiH6-Vyu8-oAwwpmCI',
          },
        },
      ],
    },
  },
};

const resThree = {
  data: {
    events: {
      edges: [
        {
          cursor: 'MTY4Mzg3ODA=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsImhIRk1TSmY1aTlrZHN6MGFFeGtpQWxROWhvMVJPbkR2aDc3dkJtVW9RR1kiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:46a7054882aeb28a09babc0a403b9df3df09b13f30efb8cff6da3597793c8232","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000905]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'hHFMSJf5i9kdsz0aExkiAlQ9ho1ROnDvh77vBmUoQGY',
          },
        },
        {
          cursor: 'MTY4Mzg3Nzk=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsIkhzN1VHZlhzb2hocTR6XzZyRXBKUWZtR2tCcUxEYVRlNm5ubXFRaFBtdVkiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:3049c5a6fc434dc7a951c18ac4d09a81fb6794802e9655ca552d945fdbf41ba1","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000256]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'Hs7UGfXsohhq4z_6rEpJQfmGkBqLDaTe6nnmqQhPmuY',
          },
        },
        {
          cursor: 'MTY4Mzg3ODE=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsIkZUaFpXM3FvMU95bWJfYmpsQU9zRkN2VUtScG8zN2x0OTZpMDJrUXFITkUiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:1a7297dd4cf2e8db12cf0ccff244dac20fb174b8a4922ce3cd992faa807a2229","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000756]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'FThZW3qo1Oymb_bjlAOsFCvUKRpo37lt96i02kQqHNE',
          },
        },
        {
          cursor: 'MTY4Mzg3ODI=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsInJLXzR3SmNQVTVwbEFVbU1DcXVBSDRxcFhxUWVNX1RNN0NJNGtYSV9lelkiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:d5171f7ca725d5fc9a195348439dc3e0f2b22fd76eff64a84a7c886eb5e38b7c","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000256]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'rK_4wJcPU5plAUmMCquAH4qpXqQeM_TM7CI4kXI_ezY',
          },
        },
        {
          cursor: 'MTY4Mzg3ODM=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsIi0xcm1xWlh6dXZVcDQ1RURERGFYMVVtRGtWa19Ha3o0MTVLVXZfZTRqUGsiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:87a2abaf7d0ee38d29eb8a83d2675ce48f6c19ee3f4ec717058a84f163cc8bce","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000523]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: '-1rmqZXzuvUp45EDDDaX1UmDkVk_Gkz415KUv_e4jPk',
          },
        },
        {
          cursor: 'MTY4Mzg3ODQ=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsIngxaDRXYkRJclJPS3hnanhvRnd4Tmt5cWdFcVRqOWcxNHBWVV8yR0JVQWsiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:e8d0de9cd295f9be6b85be9e306523bab87fc11c9517909f19c1cf0b7641a584","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000905]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'x1h4WbDIrROKxgjxoFwxNkyqgEqTj9g14pVU_2GBUAk',
          },
        },
        {
          cursor: 'MTY4Mzg3ODU=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsIjZ6cXdkYnVJVm9KR3BTcnV0a2ZybGU3aVFlNVB1UDhWM0hzVWt3OUhaVTQiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:473362f449bf4be6be8e79d8097b249206e233b47c3c7b4e11d7fa9fb338c11c","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000523]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: '6zqwdbuIVoJGpSrutkfrle7iQe5PuP8V3HsUkw9HZU4',
          },
        },
        {
          cursor: 'MTY4Mzg3ODY=',
          node: {
            id: 'RXZlbnQ6WyJPTmQ3c3RJakpidXdNcVJtbHlRNzFYaFQteFZ2eVZ5LUEwWDJEQm9tdzFnIiwiMCIsInhPTzAwX1V5TkVyVXFUYkkzd3NxRUw0c3VjNm1RNC1OLVo3RmhXWjV0ODgiXQ==',
            chainId: 0,
            height: 5372843,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["k:12d8fdcaac1eb04a94aaf38644272541522da276d9eaec91412d21592018ba21","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.000256]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'xOO00_UyNErUqTbI3wsqEL4suc6mQ4-N-Z7FhWZ5t88',
          },
        },
      ],
    },
  },
};

const resFour = {
  data: {
    events: {
      edges: [
        {
          cursor: 'NzUzMDkzMg==',
          node: {
            id: 'RXZlbnQ6WyJ3M2VTQm13TVM5dGVMam5URDVqRVNDSEtwMFRmTUEwdk4ydktxQmREbUhZIiwiMCIsImZuenN6YW4yRk5HUlFqUTRCcjBKcWpackw0YjZTMEthR0huS0dsNVowU00iXQ==',
            chainId: 14,
            height: 2000184,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["acc28032a1bb725b7ba0a3593ab86f393894fa6659281f3dfdfee0afe48559a2","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",0.0000216]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'fnzszan2FNGRQjQ4Br0JqjZrL4b6S0KaGHnKGl5Z0SM',
          },
        },
        {
          cursor: 'NzUzMDkzNQ==',
          node: {
            id: 'RXZlbnQ6WyJnTGlndUdVeVJXemI3TEZjN1puLVItSy1la2pWaFdzTS1KMHpobExHZFZVIiwiMCIsIl9YTFVTbFBZMGJ1NnpWYjMwdXlMazF5S3VUc01NVWhoUHI4Y2RlUTFfbjQiXQ==',
            chainId: 17,
            height: 2000153,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["acc28032a1bb725b7ba0a3593ab86f393894fa6659281f3dfdfee0afe48559a2","c50b9acb49ca25f59193b95b4e08e52e2ec89fa1bf308e6436f39a40ac2dc4f3",0.0000216]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: '_XLUSlPY0bu6zVb30uyLk1yKuTsMMUhhPr8cdeQ1_n4',
          },
        },
        {
          cursor: 'NzUzMDk0OA==',
          node: {
            id: 'RXZlbnQ6WyJhNjBhX1IwWHhFV0ZqUmp6Z19tVEFGd2lrcEU5V19sY3dKWldpc2cxMTN3IiwiMCIsIkhHVnNOM0VaTDNwT0NPUVBTa21vUjdNbDNfSDhocHo4bnp5cWlWNGFmdzAiXQ==',
            chainId: 14,
            height: 2000079,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["acc28032a1bb725b7ba0a3593ab86f393894fa6659281f3dfdfee0afe48559a2","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",0.0000216]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'HGVsN3EZL3pOCOQPSkmoR7Ml3_H8hpz8nzyqiV4afw0',
          },
        },
        {
          cursor: 'NzUzMDk0NQ==',
          node: {
            id: 'RXZlbnQ6WyJYZVVsaHlmZm1GcFFreTFiWnBzbE95bm5feDd0RDhrOE1fSlE4SFFSTzlNIiwiMCIsIlpQc2hoWmJlclBnVldnSkQtZTRkbDMzdmZ2LWVFZ2JSc1h1WnNFeHpnUFUiXQ==',
            chainId: 17,
            height: 2000061,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["74617692759045b80c903e2d2c633344c8c1163150de27d35b63f474b9e4e1e9","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",0.00393]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'ZPshhZberPgVWgJD-e4dl33vfv-eEgbRsXuZsExzgPU',
          },
        },
        {
          cursor: 'NzUzMDk0Ng==',
          node: {
            id: 'RXZlbnQ6WyJYZVVsaHlmZm1GcFFreTFiWnBzbE95bm5feDd0RDhrOE1fSlE4SFFSTzlNIiwiMSIsIlpQc2hoWmJlclBnVldnSkQtZTRkbDMzdmZ2LWVFZ2JSc1h1WnNFeHpnUFUiXQ==',
            chainId: 17,
            height: 2000061,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 1,
            parameters: '["74617692759045b80c903e2d2c633344c8c1163150de27d35b63f474b9e4e1e9","",8]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'ZPshhZberPgVWgJD-e4dl33vfv-eEgbRsXuZsExzgPU',
          },
        },
        {
          cursor: 'NzUzMDk0OQ==',
          node: {
            id: 'RXZlbnQ6WyI5dTUyQkFjVG9LWHNlaDhXNlZvdjMyR2E5MWQ4ZTJiWnFPNHJvM1BqNHM0IiwiMCIsIlZZOEVfbEdQemZoT3RuRjM3cnVJTHFiOEdCajFZMkV2UWhlZ1B5WGJXUHciXQ==',
            chainId: 14,
            height: 2000016,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 0,
            parameters:
              '["74617692759045b80c903e2d2c633344c8c1163150de27d35b63f474b9e4e1e9","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",0.00393]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'VY8E_lGPzfhOtnF37ruILqb8GBj1Y2EvQhegPyXbWPw',
          },
        },
        {
          cursor: 'NzUzMDk1MA==',
          node: {
            id: 'RXZlbnQ6WyI5dTUyQkFjVG9LWHNlaDhXNlZvdjMyR2E5MWQ4ZTJiWnFPNHJvM1BqNHM0IiwiMSIsIlZZOEVfbEdQemZoT3RuRjM3cnVJTHFiOEdCajFZMkV2UWhlZ1B5WGJXUHciXQ==',
            chainId: 14,
            height: 2000016,
            moduleName: 'coin',
            name: 'TRANSFER',
            orderIndex: 1,
            parameters: '["74617692759045b80c903e2d2c633344c8c1163150de27d35b63f474b9e4e1e9","",6]',
            qualifiedName: 'coin.TRANSFER',
            requestKey: 'VY8E_lGPzfhOtnF37ruILqb8GBj1Y2EvQhegPyXbWPw',
          },
        },
      ],
    },
  },
};

describe('Events Query', () => {
  it('qualifiedEventName: "pact.X_YIELD", last: 10', async () => {
    const query = gql`
      query {
        events(qualifiedEventName: "pact.X_YIELD", last: 10) {
          edges {
            cursor
            node {
              id
              chainId
              height
              moduleName
              moduleName
              name
              orderIndex
              parameters
              qualifiedName
              requestKey
            }
          }
        }
      }
    `;
    const data = await client.request(query);
    expect(resOne.data).toMatchObject(data);
  });

  it('qualifiedEventName: "pact.X_YIELD", after: "MjAy"', async () => {
    const query = gql`
      query {
        events(qualifiedEventName: "pact.X_YIELD", after: "MjAy") {
          edges {
            cursor
            node {
              id
              chainId
              height
              moduleName
              moduleName
              name
              orderIndex
              parameters
              qualifiedName
              requestKey
            }
          }
        }
      }
    `;
    const data = await client.request(query);
    expect(resTwo.data).toMatchObject(data);
  });

  it('qualifiedEventName: "coin.TRANSFER", blockHash: "ONd7stIjJbuwMqRmlyQ71XhT-xVvyVy-A0X2DBomw1g", first: 8', async () => {
    const query = gql`
      query {
        events(
          qualifiedEventName: "coin.TRANSFER"
          blockHash: "ONd7stIjJbuwMqRmlyQ71XhT-xVvyVy-A0X2DBomw1g"
          first: 8
        ) {
          edges {
            cursor
            node {
              id
              chainId
              height
              moduleName
              moduleName
              name
              orderIndex
              parameters
              qualifiedName
              requestKey
            }
          }
        }
      }
    `;
    const data = await client.request(query);
    expect(resThree.data).toMatchObject(data);
  });

  it.skip('qualifiedEventName: "coin.TRANSFER", minHeight: 2000000, maxHeight: 4500000, first: 7', async () => {
    const query = gql`
      query {
        events(
          qualifiedEventName: "coin.TRANSFER"
          minHeight: 2000000
          maxHeight: 4500000
          first: 7
        ) {
          edges {
            cursor
            node {
              id
              chainId
              height
              moduleName
              moduleName
              name
              orderIndex
              parameters
              qualifiedName
              requestKey
            }
          }
        }
      }
    `;
    const data = await client.request(query);
    expect(resFour.data).toMatchObject(data);
  });
});
