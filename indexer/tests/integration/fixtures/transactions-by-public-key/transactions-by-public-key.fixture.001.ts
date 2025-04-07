export const transactionsByPublicKeyFixture001 = {
  data: {
    transactionsByPublicKey: {
      pageInfo: {
        endCursor: 'MTY3NTc3MDMyNw==',
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: 'MTcyNzk2MjY1NQ==',
      },
      edges: [
        {
          cursor: 'MTcyNzk2MjY1NQ==',
          node: {
            cmd: {
              meta: {
                chainId: 2,
                creationTime: '2024-10-03T13:37:35.000Z',
                gasLimit: '10000',
                gasPrice: 1e-7,
                sender: 'kaddex-free-gas',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2024-10-03T13:38:34.578Z',
              payload: {
                code: '"(kaddex.exchange.swap-exact-in\\n          (read-decimal \'token0Amount)\\n          (read-decimal \'token1AmountWithSlippage)\\n          [kaddex.kdx coin]\\n          \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\"\\n          \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\"\\n          (read-keyset \'user-ks)\\n        )"',
                data: '{"user-ks":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"},"token0Amount":264365,"token1Amount":126.644273569002,"token0AmountWithSlippage":277583.25,"token1AmountWithSlippage":120.312059890551}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '["kaddex-free-gas",{"int":1},1]',
                      name: 'kaddex.gas-station.GAS_PAYER',
                    },
                    {
                      args: '["k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","4iBIX0hsSprc7sYvUKLLlMd7_1uVEb6eheF33VBv1p0",264365]',
                      name: 'kaddex.kdx.TRANSFER',
                    },
                  ],
                  id: 'U2lnbmVyOlsiNW1OQzJwUXhJdzk5eWdPQ05uazg2anQwNnNpQVhGWE5zRUhNczBrd1hISSIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: '5mNC2pQxIw99ygOCNnk86jt06siAXFXNsEHMs0kwXHI',
            id: 'VHJhbnNhY3Rpb246WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiNW1OQzJwUXhJdzk5eWdPQ05uazg2anQwNnNpQVhGWE5zRUhNczBrd1hISSJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6dFdoOUZrTUJJVDd6dklLLW1LbmVQTDBFaDhrTFk5ZXFSbWQyVjloUG5haw==',
              },
              continuation: null,
              eventCount: 5,
              events: {
                pageInfo: {
                  endCursor: 'OTk0NzY1Mw==',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'OTk0NzY1Nw==',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiNCIsIjVtTkMycFF4SXc5OXlnT0NObms4Nmp0MDZzaUFYRlhOc0VITXMwa3dYSEkiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMyIsIjVtTkMycFF4SXc5OXlnT0NObms4Nmp0MDZzaUFYRlhOc0VITXMwa3dYSEkiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMiIsIjVtTkMycFF4SXc5OXlnT0NObms4Nmp0MDZzaUFYRlhOc0VITXMwa3dYSEkiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMSIsIjVtTkMycFF4SXc5OXlnT0NObms4Nmp0MDZzaUFYRlhOc0VITXMwa3dYSEkiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMCIsIjVtTkMycFF4SXc5OXlnT0NObms4Nmp0MDZzaUFYRlhOc0VITXMwa3dYSEkiXQ==',
                    },
                  },
                ],
              },
              gas: '6266',
              goodResult:
                '[{"token":"kaddex.kdx","amount":264365},{"token":"coin","amount":126.644273569002}]',
              logs: 'L8s6lHf4FetY6Jet3xP8HHn02splaW0xF3gO70LOcoE',
              transactionId: '11684492',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMiIsIjIiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwiNW1OQzJwUXhJdzk5eWdPQ05uazg2anQwNnNpQVhGWE5zRUhNczBrd1hISSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMiIsIjEiLCJVYkFqMlJZdXBhVC14NHZyQnY4VmNTelk5Vk43RVZlNXlqTFhpZmxxcWRzIiwiNW1OQzJwUXhJdzk5eWdPQ05uazg2anQwNnNpQVhGWE5zRUhNczBrd1hISSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJ0V2g5RmtNQklUN3p2SUstbUtuZVBMMEVoOGtMWTllcVJtZDJWOWhQbmFrIiwiMiIsIjAiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwiNW1OQzJwUXhJdzk5eWdPQ05uazg2anQwNnNpQVhGWE5zRUhNczBrd1hISSJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: '9465de0bc31cdf7e5dfb1f6b8820a996c6cd133628f2f3d3de81a488519a0d997040398f68e4ed636f7c311b53caf2f40797c1d1fb0262a7f3d8ec0fe221a40f',
              },
            ],
          },
        },
        {
          cursor: 'MTcyNzk2MjM4Ng==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2024-10-03T13:33:06.000Z',
                gasLimit: '2500',
                gasPrice: 1e-8,
                sender: 'k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '900',
              },
              networkId: 'mainnet01',
              nonce: '2024-10-03T13:34:06.144Z',
              payload: {
                code: '"(kaddex.kdx.transfer-crosschain \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" (read-keyset \\"receiver-guard\\") \\"2\\" 84225.0)"',
                data: '{"receiver-guard":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '["k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf",84225,"2"]',
                      name: 'kaddex.kdx.TRANSFER_XCHAIN',
                    },
                    {
                      args: '[]',
                      name: 'coin.GAS',
                    },
                  ],
                  id: 'U2lnbmVyOlsiMjMtU2hjbl8wMTJzRTVKUnl1RGVDZFlrWTBIRFMxWHlOSkdKTHRJd3RwQSIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: '23-Shcn_012sE5JRyuDeCdYkY0HDS1XyNJGJLtIwtpA',
            id: 'VHJhbnNhY3Rpb246WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMjMtU2hjbl8wMTJzRTVKUnl1RGVDZFlrWTBIRFMxWHlOSkdKTHRJd3RwQSJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6cXIxaHlSbVc1RnRhRnh0NXhSWjNMLUF6ZG9Bc0ZxQ0xPM3pVMHB3QWFOMA==',
              },
              continuation:
                '{"step":0,"yield":{"data":{"amount":84225,"receiver":"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","source-chain":"0","receiver-guard":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}},"source":"0","provenance":{"moduleHash":"UbAj2RYupaT-x4vrBv8VcSzY9VN7EVe5yjLXiflqqds","targetChainId":"2"}},"pactId":"23-Shcn_012sE5JRyuDeCdYkY0HDS1XyNJGJLtIwtpA","executed":null,"stepCount":2,"continuation":{"def":"kaddex.kdx.transfer-crosschain","args":["k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf",{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"},"2",84225]},"stepHasRollback":false}',
              eventCount: 4,
              events: {
                pageInfo: {
                  endCursor: 'MzI5MjgxMjM=',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MzI5MjgxMjY=',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMyIsIjIzLVNoY25fMDEyc0U1SlJ5dURlQ2RZa1kwSERTMVh5TkpHSkx0SXd0cEEiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMiIsIjIzLVNoY25fMDEyc0U1SlJ5dURlQ2RZa1kwSERTMVh5TkpHSkx0SXd0cEEiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMSIsIjIzLVNoY25fMDEyc0U1SlJ5dURlQ2RZa1kwSERTMVh5TkpHSkx0SXd0cEEiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMCIsIjIzLVNoY25fMDEyc0U1SlJ5dURlQ2RZa1kwSERTMVh5TkpHSkx0SXd0cEEiXQ==',
                    },
                  },
                ],
              },
              gas: '667',
              goodResult:
                '{"amount":84225,"receiver":"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","source-chain":"0","receiver-guard":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}}',
              logs: 'SjxbftPUD7O-DSAvwrJKCQz1Peu0zb43KJu1C0019O4',
              transactionId: '393183992',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMCIsIjEiLCJVYkFqMlJZdXBhVC14NHZyQnY4VmNTelk5Vk43RVZlNXlqTFhpZmxxcWRzIiwiMjMtU2hjbl8wMTJzRTVKUnl1RGVDZFlrWTBIRFMxWHlOSkdKTHRJd3RwQSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJxcjFoeVJtVzVGdGFGeHQ1eFJaM0wtQXpkb0FzRnFDTE8zelUwcHdBYU4wIiwiMCIsIjAiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwiMjMtU2hjbl8wMTJzRTVKUnl1RGVDZFlrWTBIRFMxWHlOSkdKTHRJd3RwQSJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'd95b00809f9bf794f35332741348096a7517ed5bd5be50e5d41e4b12fd7ceae428a95198b69bc14b9e158a4245ece2f9c4825e818278410261af2cf686711306',
              },
            ],
          },
        },
        {
          cursor: 'MTcyNzk0NTU1Ng==',
          node: {
            cmd: {
              meta: {
                chainId: 2,
                creationTime: '2024-10-03T08:52:36.000Z',
                gasLimit: '17000',
                gasPrice: 1e-7,
                sender: 'kaddex-free-gas',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2024-10-03T08:53:36.122Z',
              payload: {
                code: '"\\n  (kaddex.staking.rollup \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\")\\n  (kaddex.staking.claim \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\")\\n  (kaddex.staking.unstake \\"k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" (read-decimal \'amount))\\n  "',
                data: '{"amount":178254.8273,"user-ks":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '["kaddex-free-gas",{"int":1},1]',
                      name: 'kaddex.gas-station.GAS_PAYER',
                    },
                    {
                      args: '["k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'kaddex.staking.ROLLUP',
                    },
                    {
                      args: '["k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'kaddex.staking.CLAIM',
                    },
                    {
                      args: '["kaddex.skdx","k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf",178254.8273]',
                      name: 'kaddex.kdx.UNWRAP',
                    },
                    {
                      args: '["kaddex.skdx","k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","kdx-staking",178254.8273]',
                      name: 'kaddex.kdx.UNWRAP',
                    },
                    {
                      args: '["k:1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'kaddex.staking.UNSTAKE',
                    },
                  ],
                  id: 'U2lnbmVyOlsiMGc2enU1RHFqcmFhX3Y4VnhtcEtjdXlpNXlpR004STdHUnp4MFhpZF9ocyIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: '0g6zu5Dqjraa_v8VxmpKcuyi5yiGM8I7GRzx0Xid_hs',
            id: 'VHJhbnNhY3Rpb246WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiMGc2enU1RHFqcmFhX3Y4VnhtcEtjdXlpNXlpR004STdHUnp4MFhpZF9ocyJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6NENkN3VvUnQ5RTRRblFDbVJwRjVadEpsNUsxMW1XQW9Da2pFUkw4QWNJMA==',
              },
              continuation: null,
              eventCount: 6,
              events: {
                pageInfo: {
                  endCursor: 'OTk0OTAzMA==',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'OTk0OTAzNw==',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiNSIsIjBnNnp1NURxanJhYV92OFZ4bXBLY3V5aTV5aUdNOEk3R1J6eDBYaWRfaHMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiNCIsIjBnNnp1NURxanJhYV92OFZ4bXBLY3V5aTV5aUdNOEk3R1J6eDBYaWRfaHMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiMyIsIjBnNnp1NURxanJhYV92OFZ4bXBLY3V5aTV5aUdNOEk3R1J6eDBYaWRfaHMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiMiIsIjBnNnp1NURxanJhYV92OFZ4bXBLY3V5aTV5aUdNOEk3R1J6eDBYaWRfaHMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiMSIsIjBnNnp1NURxanJhYV92OFZ4bXBLY3V5aTV5aUdNOEk3R1J6eDBYaWRfaHMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiMCIsIjBnNnp1NURxanJhYV92OFZ4bXBLY3V5aTV5aUdNOEk3R1J6eDBYaWRfaHMiXQ==',
                    },
                  },
                ],
              },
              gas: '4837',
              goodResult: 'true',
              logs: 'qiiTj2ewrB3V-CBTHTpx-0sNumil5EPqQpe68mKhOH8',
              transactionId: '11683157',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyI0Q2Q3dW9SdDlFNFFuUUNtUnBGNVp0Smw1SzExbVdBb0NrakVSTDhBY0kwIiwiMiIsIjAiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwiMGc2enU1RHFqcmFhX3Y4VnhtcEtjdXlpNXlpR004STdHUnp4MFhpZF9ocyJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'c3a1091ec05783af447c09aea10758fc342fa1079bbf8e258423e49bf7db8e4a2dcf8159e34ebdec408ebe9cf95357ed11d8a186f090dfd3756be94018e29c07',
              },
            ],
          },
        },
        {
          cursor: 'MTcyNDQ5NTk0NA==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2024-08-24T10:39:04.000Z',
                gasLimit: '20000',
                gasPrice: 1e-7,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2024-08-24T10:40:04.250Z',
              payload: {
                code: '"(kaddex.time-lock.claim-return \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" )"',
                data: '{}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '[]',
                      name: 'coin.GAS',
                    },
                    {
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'kaddex.time-lock.CLAIM',
                    },
                  ],
                  id: 'U2lnbmVyOlsiWGdYdS1TVTk2SlQxR25IbGNCeERuNTdfWURkLUNJZXk2R1hEZEs1TUNUZyIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'XgXu-SU96JT1GnHlcBxDn57_YDd-CIey6GXDdK5MCTg',
            id: 'VHJhbnNhY3Rpb246WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiWGdYdS1TVTk2SlQxR25IbGNCeERuNTdfWURkLUNJZXk2R1hEZEs1TUNUZyJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6LXVsOFFWTFcyeTB0ZGRiTVJLT2ItWGFnUWNYVDE1U0ExQzJjWkpkb1NTNA==',
              },
              continuation: null,
              eventCount: 3,
              events: {
                pageInfo: {
                  endCursor: 'NDMzMjkxNzk=',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'NDMzMjkxODE=',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiMiIsIlhnWHUtU1U5NkpUMUduSGxjQnhEbjU3X1lEZC1DSWV5NkdYRGRLNU1DVGciXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiMSIsIlhnWHUtU1U5NkpUMUduSGxjQnhEbjU3X1lEZC1DSWV5NkdYRGRLNU1DVGciXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiMCIsIlhnWHUtU1U5NkpUMUduSGxjQnhEbjU3X1lEZC1DSWV5NkdYRGRLNU1DVGciXQ==',
                    },
                  },
                ],
              },
              gas: '1560',
              goodResult: '{"kda":334.2278011875,"kdx":{"decimal":"60161.004213750000"}}',
              logs: 'SlTMvp5_pCui-SrQhrluLxlcgFFlG-KisOtUHa1tnrk',
              transactionId: '371588124',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiMCIsIjIiLCJVYkFqMlJZdXBhVC14NHZyQnY4VmNTelk5Vk43RVZlNXlqTFhpZmxxcWRzIiwiWGdYdS1TVTk2SlQxR25IbGNCeERuNTdfWURkLUNJZXk2R1hEZEs1TUNUZyJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiMCIsIjEiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwiWGdYdS1TVTk2SlQxR25IbGNCeERuNTdfWURkLUNJZXk2R1hEZEs1TUNUZyJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItdWw4UVZMVzJ5MHRkZGJNUktPYi1YYWdRY1hUMTVTQTFDMmNaSmRvU1M0IiwiMCIsIjAiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwiWGdYdS1TVTk2SlQxR25IbGNCeERuNTdfWURkLUNJZXk2R1hEZEs1TUNUZyJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'bcade0ba44429aa071ea76675e7ac4ab3b2281c9ef42e95382e1b5c75d3772e2ef580363cc8db1c72f9fa315730da8660c071469257587e195107238e260ff0f',
              },
            ],
          },
        },
        {
          cursor: 'MTY4ODAzNDU4MA==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2023-06-29T10:29:40.000Z',
                gasLimit: '20000',
                gasPrice: 1e-7,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2023-06-29T10:30:40.450Z',
              payload: {
                code: '"(kaddex.time-lock.claim-return \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" )"',
                data: '{}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '[]',
                      name: 'coin.GAS',
                    },
                    {
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'kaddex.time-lock.CLAIM',
                    },
                  ],
                  id: 'U2lnbmVyOlsiQVR6WlMwbDFLS3JQOXBacFVGZWVHb00wQWM5cVdqMFgxU3dUZl9XOGhVTSIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'ATzZS0l1KKrP9pZpUFeeGoM0Ac9qWj0X1SwTf_W8hUM',
            id: 'VHJhbnNhY3Rpb246WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiQVR6WlMwbDFLS3JQOXBacFVGZWVHb00wQWM5cVdqMFgxU3dUZl9XOGhVTSJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6akhKYjFoa1RPT1VUZ1l1VERfdXlvbFYwREFEMXlEcUhvcEJSa1BnM1ByTQ==',
              },
              continuation: null,
              eventCount: 3,
              events: {
                pageInfo: {
                  endCursor: 'MTg3MTkxMDY2',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MTg3MTkxMDY4',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiMiIsIkFUelpTMGwxS0tyUDlwWnBVRmVlR29NMEFjOXFXajBYMVN3VGZfVzhoVU0iXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiMSIsIkFUelpTMGwxS0tyUDlwWnBVRmVlR29NMEFjOXFXajBYMVN3VGZfVzhoVU0iXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiMCIsIkFUelpTMGwxS0tyUDlwWnBVRmVlR29NMEFjOXFXajBYMVN3VGZfVzhoVU0iXQ==',
                    },
                  },
                ],
              },
              gas: '1598',
              goodResult: '{"kda":66.8455602375,"kdx":{"decimal":"12032.200842750000"}}',
              logs: 'nqKUTtmMbndD5UrCoO207kVAgiLIq07kquRskAj7RYU',
              transactionId: '64344988',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiMCIsIjIiLCJVYkFqMlJZdXBhVC14NHZyQnY4VmNTelk5Vk43RVZlNXlqTFhpZmxxcWRzIiwiQVR6WlMwbDFLS3JQOXBacFVGZWVHb00wQWM5cVdqMFgxU3dUZl9XOGhVTSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiMCIsIjEiLCJyRTdEVThqbFFMOXhfTVBZdW5pWkpmNUlDQlRBRUhBSUZRQ0I0YmxvZlA0IiwiQVR6WlMwbDFLS3JQOXBacFVGZWVHb00wQWM5cVdqMFgxU3dUZl9XOGhVTSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJqSEpiMWhrVE9PVVRnWXVURF91eW9sVjBEQUQxeURxSG9wQlJrUGczUHJNIiwiMCIsIjAiLCJyRTdEVThqbFFMOXhfTVBZdW5pWkpmNUlDQlRBRUhBSUZRQ0I0YmxvZlA0IiwiQVR6WlMwbDFLS3JQOXBacFVGZWVHb00wQWM5cVdqMFgxU3dUZl9XOGhVTSJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'fac67a5025abc3da9b29612f8be514fa0d9e1a5448b7efb86e91a663b92ec1e64a5a3bc3299abeac24f96ddab7962ee32c4ff6e8ca204e2c3bcf2a3137c0fc0a',
              },
            ],
          },
        },
        {
          cursor: 'MTY3NTc3MDMyNw==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2023-02-07T11:45:27.000Z',
                gasLimit: '20000',
                gasPrice: 1e-7,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2023-02-07T11:46:26.796Z',
              payload: {
                code: '"(kaddex.time-lock.claim-return \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" )"',
                data: '{}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '[]',
                      name: 'coin.GAS',
                    },
                    {
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'kaddex.time-lock.CLAIM',
                    },
                  ],
                  id: 'U2lnbmVyOlsiRHlWZnJSdXFPUF94Nk16MHp0emFiN0RrNGFXWURfU1lucXRwMHQzdkZaNCIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'DyVfrRuqOP_x6Mz0ztzab7Dk4aWYD_SYnqtp0t3vFZ4',
            id: 'VHJhbnNhY3Rpb246WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiRHlWZnJSdXFPUF94Nk16MHp0emFiN0RrNGFXWURfU1lucXRwMHQzdkZaNCJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6YWVEekJETmVkTXFEekhHSWhhSmFCdktPamhpUTNHbUJZdDNYbWtWd1hIaw==',
              },
              continuation: null,
              eventCount: 3,
              events: {
                pageInfo: {
                  endCursor: 'MjA5MzgwNDAw',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjA5MzgwNDAy',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiMiIsIkR5VmZyUnVxT1BfeDZNejB6dHphYjdEazRhV1lEX1NZbnF0cDB0M3ZGWjQiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiMSIsIkR5VmZyUnVxT1BfeDZNejB6dHphYjdEazRhV1lEX1NZbnF0cDB0M3ZGWjQiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiMCIsIkR5VmZyUnVxT1BfeDZNejB6dHphYjdEazRhV1lEX1NZbnF0cDB0M3ZGWjQiXQ==',
                    },
                  },
                ],
              },
              gas: '1598',
              goodResult: '{"kda":66.8455602375,"kdx":{"decimal":"12032.200842750000"}}',
              logs: 'Xh84W7SY6Jc3911WZLJi-szr6ecOBguenCTLN70zO10',
              transactionId: '24525208',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiMCIsIjIiLCJVYkFqMlJZdXBhVC14NHZyQnY4VmNTelk5Vk43RVZlNXlqTFhpZmxxcWRzIiwiRHlWZnJSdXFPUF94Nk16MHp0emFiN0RrNGFXWURfU1lucXRwMHQzdkZaNCJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiMCIsIjEiLCJyRTdEVThqbFFMOXhfTVBZdW5pWkpmNUlDQlRBRUhBSUZRQ0I0YmxvZlA0IiwiRHlWZnJSdXFPUF94Nk16MHp0emFiN0RrNGFXWURfU1lucXRwMHQzdkZaNCJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJhZUR6QkROZWRNcUR6SEdJaGFKYUJ2S09qaGlRM0dtQll0M1hta1Z3WEhrIiwiMCIsIjAiLCJyRTdEVThqbFFMOXhfTVBZdW5pWkpmNUlDQlRBRUhBSUZRQ0I0YmxvZlA0IiwiRHlWZnJSdXFPUF94Nk16MHp0emFiN0RrNGFXWURfU1lucXRwMHQzdkZaNCJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: '566ba414c2dda568a92c62f7a96e1360d758e8f9feb7916c2cff03ec3697fbdaaebc37cb7846b306d8069b794c2430c44bf614c87a55a1940551f607dfaef60e',
              },
            ],
          },
        },
      ],
    },
  },
};
