import { GraphQLClient, gql } from 'graphql-request';
const API_URL = 'http://localhost:3001/graphql';

const client = new GraphQLClient(API_URL);

const resOne = {
  data: {
    transactions: {
      totalCount: 3,
      edges: [
        {
          cursor: 'MTczOTIyNTQ4',
          node: {
            hash: 'InEwNWRxb1l3WEVrdFBxQVNxOFZqVUR0b01vc2ZVUzJpQWJiU3FsejVweFUi',
            cmd: {
              networkId: 'mainnet01',
              nonce: '',
              payload: {},
            },
            result: {
              logs: '1HIDKWec3X385Rz4U_-JEbu5ul6wotB-vZGKeGtYXR0',
              continuation: 'null',
              goodResult: '"Write succeeded"',
            },
          },
        },
        {
          cursor: 'MTg=',
          node: {
            hash: 'LIbJxv2_SLmuyVOWawHAvad2og4QAjIgeHQPSrz8w2M',
            cmd: {
              networkId: 'mainnet01',
              nonce: '2024-12-07 10:31:13.728821 UTC',
              payload: {},
            },
            result: {
              logs: 'KuauAJsfwwyh9rftv8_sfxQ064wjr_MU_eNBpSCmgHs',
              continuation:
                '{"step":0,"yield":{"data":{"amount":337.1879699,"receiver":"99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","source-chain":"10","receiver-guard":{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"}},"source":"10","provenance":{"moduleHash":"klFkrLfpyLW-M3xjVPSdqXEMgxPPJibRt_D6qiBws6s","targetChainId":"0"}},"pactId":"LIbJxv2_SLmuyVOWawHAvad2og4QAjIgeHQPSrz8w2M","executed":null,"stepCount":2,"continuation":{"def":"coin.transfer-crosschain","args":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"},"0",337.1879699]},"stepHasRollback":false}',
              goodResult:
                '{"amount":337.1879699,"receiver":"99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","source-chain":"10","receiver-guard":{"keys":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a"],"pred":"keys-all"}}',
            },
          },
        },
        {
          cursor: 'MTc=',
          node: {
            hash: 'GPexixjsj9u7tFpTOzTqGGnMjF-GK51ealjUDyQcqTA',
            cmd: {
              networkId: 'mainnet01',
              nonce: '2024-12-07T10:30:54.914Z',
              payload: {},
            },
            result: {
              logs: 'sv0JVxMnf6Mpd3VwMFbYXgnklV8DwVc-F_Uyye1sO5g',
              continuation: null,
              goodResult: '"Write succeeded"',
            },
          },
        },
      ],
    },
  },
};

const resTwo = {
  data: {
    transactions: {
      pageInfo: {
        endCursor: 'MTcyNDc2MTkx',
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: 'Mjc4MzA0NzU4',
      },
      totalCount: 22,
      edges: [
        {
          cursor: 'Mjc4MzA0NzU4',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiYVZnMVNFNHlXVXBQV1U5MFdIUlpNekZyYjIwemVUbFVhemxITWw5U1ZVRkZRVUV0UjJkTmVrdzFSUSJd',
            hash: 'aVg1SE4yWUpPWU90WHRZMzFrb20zeTlUazlHMl9SVUFFQUEtR2dNekw1RQ',
            cmd: {
              meta: {
                sender: 'coinbase',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjA5',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiWldGTXdBM3owVHVwNHNsUXlFRzJndFhIV1F0aEhUZjkzWEZDOXIwblRfQSJd',
            hash: 'ZWFMwA3z0Tup4slQyEG2gtXHWQthHTf93XFC9r0nT_A',
            cmd: {
              meta: {
                sender: 'k:0775bf1dff06f130fa19760e04be2012634060af7f4bccdd407229639b471f26',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjA4',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwicW9DbWhfS19hQTFRWkRMdDRNLXBrUzd1ZThMYzBZejRYV0RnbTBDenUtOCJd',
            hash: 'qoCmh_K_aA1QZDLt4M-pkS7ue8Lc0Yz4XWDgm0Czu-8',
            cmd: {
              meta: {
                sender: 'k:74ec8cfde5f8f997cd75cc18bb8adc4ab177c2dd1aa759db7bd1e05bf70fe69d',
              },
              payload: {
                code: 'null',
              },
            },
            result: {
              badResult: null,
              goodResult: '"Already directed...."',
              continuation: 'null',
            },
          },
        },
        {
          cursor: 'MTcyNDc2MjA3',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwib1hsV0NJMXNDUV9peV9aSGZiblZ3RXJRTThQbVNxUFIxN3I5SU9XNzNQYyJd',
            hash: 'oXlWCI1sCQ_iy_ZHfbnVwErQM8PmSqPR17r9IOW73Pc',
            cmd: {
              meta: {
                sender: 'k:483f068e31c4e30114d937dce7192ac4e2066eecbf714d97f91b994b6bda159c',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjA2',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiazlGU29CSlpjNVFwX3NIQ0VtXzJuR21TejFqNDJmZTJpcDV5am9Kb25EOCJd',
            hash: 'k9FSoBJZc5Qp_sHCEm_2nGmSz1j42fe2ip5yjoJonD8',
            cmd: {
              meta: {
                sender: 'k:7d3afc2c8436f4a47b03654d7b31180fbf1e1e9c3056d4fb6dc80fd3029c9169',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjA1',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiMTdTRUVnQlJyQTUtbUo0eXBhYVpxUjVLTExIZGtfT0YyLWZfNk9ua2IzWSJd',
            hash: '17SEEgBRrA5-mJ4ypaaZqR5KLLHdk_OF2-f_6Onkb3Y',
            cmd: {
              meta: {
                sender: 'k:739ccc22a7a65880719f3918334bca4c8e39f69e3ef00f1b46829f94faf6e2dc',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjA0',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiUC1na1NiVW1EY3RhU05uYmtxcnE5UlpaMmU1LTBha1BTaHFjY085QTNrYyJd',
            hash: 'P-gkSbUmDctaSNnbkqrq9RZZ2e5-0akPShqccO9A3kc',
            cmd: {
              meta: {
                sender: 'k:54057e541f3652e86530af9c46a04cf1ab216ea9866f5f31357f01d9a7d4d09d',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjAz',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiUEtMTlczamFtV1c3TXN6dWxXQUZpRE9ES3pjOWx5V3h1YXpWbTlxODFpMCJd',
            hash: 'PKLNW3jamWW7MszulWAFiDODKzc9lyWxuazVm9q81i0',
            cmd: {
              meta: {
                sender: 'k:54057e541f3652e86530af9c46a04cf1ab216ea9866f5f31357f01d9a7d4d09d',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjAy',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiUEdiYUJ0VUFtV2gyN2sxVVIzVnB0a3M3b2JnYVlsQU9jUEZId1o1dll2RSJd',
            hash: 'PGbaBtUAmWh27k1UR3Vptks7obgaYlAOcPFHwZ5vYvE',
            cmd: {
              meta: {
                sender: 'k:54057e541f3652e86530af9c46a04cf1ab216ea9866f5f31357f01d9a7d4d09d',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjAx',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiTDFhbURpRTFVRUhvXzdFRURFU3pFWmt2bmZ6c1RHTkkxbWlaMUF0bzcxUSJd',
            hash: 'L1amDiE1UEHo_7EEDESzEZkvnfzsTGNI1miZ1Ato71Q',
            cmd: {
              meta: {
                sender: 'k:2f434a14e4730be78cbf8080ec06707632ee5138ae193998b67f638906c47d0f',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MjAw',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiZ1NieV91S3QwaTlNaXljWHNER0NkMHBEVzRBV28yUkZQSWVWbFpKN2wtZyJd',
            hash: 'gSby_uKt0i9MiycXsDGCd0pDW4AWo2RFPIeVlZJ7l-g',
            cmd: {
              meta: {
                sender: 'k:2f0eded546d93ff86151b7ec433fe606fea026c393edf8df4e088ee8b5041185',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MTk5',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwic1dnQW84bkdYWUVzd3Z1Y2oyYkNtdGtoRXE4Z3d6Xy1sb1hia092b3RlMCJd',
            hash: 'sWgAo8nGXYEswvucj2bCmtkhEq8gwz_-loXbkOvote0',
            cmd: {
              meta: {
                sender: 'k:2f434a14e4730be78cbf8080ec06707632ee5138ae193998b67f638906c47d0f',
              },
              payload: {
                code: 'null',
              },
            },
            result: {
              badResult: null,
              goodResult: '""',
              continuation: 'null',
            },
          },
        },
        {
          cursor: 'MTcyNDc2MTk4',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiZ0o2eU8xdWktY3c1Zm9hdjhxaU02WXBOS2tSYTdRcGN3TVZaSTJtVm1iSSJd',
            hash: 'gJ6yO1ui-cw5foav8qiM6YpNKkRa7QpcwMVZI2mVmbI',
            cmd: {
              meta: {
                sender: 'k:ba43d73f05819192cf991357e6c677c59cd7c896261316cb5f576379fcf07591',
              },
              payload: {
                code: 'null',
              },
            },
            result: {
              badResult: null,
              goodResult: '"Maximum witnesses reached"',
              continuation: 'null',
            },
          },
        },
        {
          cursor: 'MTcyNDc2MTk3',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwib2dvcFpGNURQUEIwUXNlbjVFSFllemZXdkFmMGtRSzlsaldQdzdiS1BXcyJd',
            hash: 'ogopZF5DPPB0Qsen5EHYezfWvAf0kQK9ljWPw7bKPWs',
            cmd: {
              meta: {
                sender: 'k:f41954d6b85782c843d034b5336c12f094992c8c9c5f2c2fa2a725e680ee6e29',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MTk2',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiRWh0aWdfY0ctb056aFA4TkotcElsdWRlcXNxVnFXaU85S3htTUltMUZWVSJd',
            hash: 'Ehtig_cG-oNzhP8NJ-pIludeqsqVqWiO9KxmMIm1FVU',
            cmd: {
              meta: {
                sender: 'k:54057e541f3652e86530af9c46a04cf1ab216ea9866f5f31357f01d9a7d4d09d',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MTk1',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiSWQxdFU4UTRpaVRkVWtWZnhhT1BBRHpRQi1PenJFV2RxN1Z2U1RqTGNMZyJd',
            hash: 'Id1tU8Q4iiTdUkVfxaOPADzQB-OzrEWdq7VvSTjLcLg',
            cmd: {
              meta: {
                sender: 'k:54057e541f3652e86530af9c46a04cf1ab216ea9866f5f31357f01d9a7d4d09d',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MTk0',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiQ1FqeGVvUFludWRhaHZmbkhSbEtvbmFLMEYySzFab243LUZ2YVdYaDBsQSJd',
            hash: 'CQjxeoPYnudahvfnHRlKonaK0F2K1Zon7-FvaWXh0lA',
            cmd: {
              meta: {
                sender: 'k:62068cb8400a1ca310fd6ac984c1b80a5b1d16681c54ef44f31ae1c61bf9f4c7',
              },
              payload: {
                code: 'null',
              },
            },
            result: {
              badResult: null,
              goodResult: '"Maximum witnesses reached"',
              continuation: 'null',
            },
          },
        },
        {
          cursor: 'MTcyNDc2MTkz',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwidndNQWpsa290WGpFUXp3ZTBiWGNVbTVuTk4xdUhSTWFqTE1kemtCdHBmOCJd',
            hash: 'vwMAjlkotXjEQzwe0bXcUm5nNN1uHRMajLMdzkBtpf8',
            cmd: {
              meta: {
                sender: 'k:2bdf8f7b046f54a8d70d618ae6ba341c0e2047d1702135102b5201e3f507356d',
              },
              payload: {
                code: 'null',
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
          cursor: 'MTcyNDc2MTky',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwicVVFdEhUZnpfOXo5cWl2dDRmZXROdHF0MDVwei15RktMdTJ3TWlHNFdyRSJd',
            hash: 'qUEtHTfz_9z9qivt4fetNtqt05pz-yFKLu2wMiG4WrE',
            cmd: {
              meta: {
                sender: 'k:b95ea3559d0bdab751891523dab34f5f57f473fdd00cb9d79a23b9414e4f4e33',
              },
              payload: {
                code: '"(free.radio02.add-received-with-chain \\"cc4f5cfffe205d7b\\" \\"U2FsdGVkX19SVUSGOXLII21FEVYX3X+5eqsnPJcA1PA=;;;;;oQTiyaTIRTnokdQjDZ8e6MXQyqQ5WZmgcwRJa5QmM2GngbpJCs4oG4M2Iaf0CXPxkuMplG4llknLmOwkG1CPOCVXnjoSEE+95ut7zpNwaVYTw7HJ711DJPgc1LiZEclWcKaOFRQ/Fax5t0EPnqLE5WwpGjWZEwlrdDlvx/XuJBI=\\" \\"0\\" )"',
              },
            },
            result: {
              badResult: null,
              goodResult: '"Write succeeded"',
              continuation: null,
            },
          },
        },
        {
          cursor: 'MTcyNDc2MTkx',
          node: {
            id: 'VHJhbnNhY3Rpb246WyJGSEQyaEVwQlltUzdDUjhsMUI2YmhyVk0zZHZLX0wxeXo5dUtLWFBBRFVRIiwiU2MweDVnWHdYVHFGd1B2LTRyUUx4VWlfYWNOa1owN3psYURsbFBfNWFzMCJd',
            hash: 'Sc0x5gXwXTqFwPv-4rQLxUi_acNkZ07zlaDllP_5as0',
            cmd: {
              meta: {
                sender: 'k:e1e4a7064bffaf7dbbf5ef5f7f3c025e5d7fe48614aa2e4d6c44ccc9dcd3d56b',
              },
              payload: {
                code: '"(free.radio02.close-send-receive \\"k:48e0917d48785f68572bc6506e049a713979772fa341aeb14e9ecae47d951f8c\\" [] [] )"',
              },
            },
            result: {
              badResult: null,
              goodResult: '""',
              continuation: null,
            },
          },
        },
      ],
    },
  },
};

describe('Transactions Query', () => {
  it('blockHash: "Qzi58vcpW97du01srIwxpwSQUPDRNBnl2EKyubP-IWw"', async () => {
    const query = gql`
      query {
        transactions(blockHash: "Qzi58vcpW97du01srIwxpwSQUPDRNBnl2EKyubP-IWw") {
          edges {
            cursor
            node {
              hash
              cmd {
                networkId
                nonce
                payload {
                  ... on ContinuationPayload {
                    data
                    pactId
                    proof
                    rollback
                    step
                  }
                }
              }
              result {
                ... on TransactionResult {
                  logs
                  continuation
                  goodResult
                }
              }
            }
          }
        }
      }
    `;

    const data = await client.request(query);
    expect(resOne.data).toMatchObject(data);
  });

  it('first: "20", after: "MTcyNDc2MTkz", blockHash: "FHD2hEpBYmS7CR8l1B6bhrVM3dvK_L1yz9uKKXPADUQ"', async () => {
    const query = gql`
      query {
        transactions(
          first: 20
          after: "MTcyNDc2MTkz"
          blockHash: "FHD2hEpBYmS7CR8l1B6bhrVM3dvK_L1yz9uKKXPADUQ"
        ) {
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
          totalCount
          edges {
            cursor
            node {
              id
              hash
              cmd {
                meta {
                  sender
                }
                payload {
                  ... on ExecutionPayload {
                    code
                  }
                }
              }
              result {
                ... on TransactionResult {
                  badResult
                  goodResult
                  continuation
                }
              }
            }
          }
        }
      }
    `;

    const data = await client.request(query);
    expect(resTwo.data).toMatchObject(data);
  });
});
