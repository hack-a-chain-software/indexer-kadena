export const transactionsFixture001 = {
  data: {
    transactions: {
      pageInfo: {
        endCursor: 'MTczMzU2NzQ0MDo3NTQ2OTg2NQ==',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'MTczMzU2NzUzNTo3NTQ2OTg2Nw==',
      },
      edges: [
        {
          cursor: 'MTczMzU2NzUzNTo3NTQ2OTg2Nw==',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJRemk1OHZjcFc5N2R1MDFzckl3eHB3U1FVUERSTkJubDJFS3l1YlAtSVd3IiwiSW5Fd05XUnhiMWwzV0VWcmRGQnhRVk54T0ZacVZVUjBiMDF2YzJaVlV6SnBRV0ppVTNGc2VqVndlRlVpIl0=',
            hash: 'InEwNWRxb1l3WEVrdFBxQVNxOFZqVUR0b01vc2ZVUzJpQWJiU3FsejVweFUi',
            cmd: {
              meta: {
                sender: 'coinbase',
              },
              payload: {
                code: '{}',
              },
            },
            result: {
              badResult: null,
              goodResult: '"Write succeeded"',
              continuation: 'null',
            },
          },
        },
        {
          cursor: 'MTczMzU2NzQ1ODo3NTQ2OTg2Ng==',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJRemk1OHZjcFc5N2R1MDFzckl3eHB3U1FVUERSTkJubDJFS3l1YlAtSVd3IiwiTEliSnh2Ml9TTG11eVZPV2F3SEF2YWQyb2c0UUFqSWdlSFFQU3J6OHcyTSJd',
            hash: 'LIbJxv2_SLmuyVOWawHAvad2og4QAjIgeHQPSrz8w2M',
            cmd: {
              meta: {
                sender: '99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a',
              },
              payload: {
                code: '"(coin.transfer-crosschain \\"99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a\\" \\"99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a\\" (read-keyset \\"ks\\") \\"0\\" 337.1879699)"',
              },
            },
            result: {
              badResult: null,
              goodResult:
                '{"amount":337.1879699,"receiver":"99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","source-chain":"10","receiver-guard":{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"}}',
              continuation:
                '{"step":0,"yield":{"data":{"amount":337.1879699,"receiver":"99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","source-chain":"10","receiver-guard":{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"}},"source":"10","provenance":{"moduleHash":"klFkrLfpyLW-M3xjVPSdqXEMgxPPJibRt_D6qiBws6s","targetChainId":"0"}},"pactId":"LIbJxv2_SLmuyVOWawHAvad2og4QAjIgeHQPSrz8w2M","executed":null,"stepCount":2,"continuation":{"def":"coin.transfer-crosschain","args":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",337.1879699]},"stepHasRollback":false}',
            },
          },
        },
        {
          cursor: 'MTczMzU2NzQ0MDo3NTQ2OTg2NQ==',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJRemk1OHZjcFc5N2R1MDFzckl3eHB3U1FVUERSTkJubDJFS3l1YlAtSVd3IiwiR1BleGl4anNqOXU3dEZwVE96VHFHR25NakYtR0s1MWVhbGpVRHlRY3FUQSJd',
            hash: 'GPexixjsj9u7tFpTOzTqGGnMjF-GK51ealjUDyQcqTA',
            cmd: {
              meta: {
                sender: 'k:5adb16663073280acf63bc2a4bf477ad1391736dcd6217b094926862c72d15c9',
              },
              payload: {
                code: '"(coin.create-account \\"k:c49a4292ceeaa9f175f92b0882ba874392e290a28c8504832a7ca64fbf8f088c\\" (read-keyset \\"ks\\"))"',
              },
            },
            result: {
              badResult: null,
              goodResult: '"Write succeeded"',
              continuation: null,
            },
          },
        },
      ],
    },
  },
};
