export const transactionsByPublicKeyFixture002 = {
  data: {
    transactionsByPublicKey: {
      pageInfo: {
        endCursor: 'MTYyNDE5MjMxMg==',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: 'MTYzMDc1OTM3NQ==',
      },
      edges: [
        {
          cursor: 'MTYzMDc1OTM3NQ==',
          node: {
            cmd: {
              meta: {
                chainId: 2,
                creationTime: '2021-09-04T12:42:55.000Z',
                gasLimit: '3000',
                gasPrice: 1e-12,
                sender: 'kswap-free-gas',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2021-09-04T12:43:54.759Z',
              payload: {
                code: '"(kswap.exchange.swap-exact-out\\n          (read-decimal \'token1Amount)\\n          (read-decimal \'token0AmountWithSlippage)\\n          [runonflux.flux coin]\\n          \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\"\\n          \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\"\\n          (read-keyset \'user-ks)\\n        )"',
                data: '{"user-ks":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"},"token0Amount":49968.99999986,"token1Amount":16056.9363158,"token0AmountWithSlippage":57464.34999983,"token1AmountWithSlippage":13648.39586843}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '["free-gas",{"int":1},1]',
                      name: 'kswap.gas-station.GAS_PAYER',
                    },
                    {
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","6SMAbH1iWh-6aOtnACqhiGk9BxbGzvYAyDmjwmLBKGc",57464.34999983]',
                      name: 'runonflux.flux.TRANSFER',
                    },
                  ],
                  id: 'U2lnbmVyOlsidTlGRDJrcC1GNmZvc3VYMk8wUkstUnpKVy0yem5ORzBYWmxNVEo3bzdMVSIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'u9FD2kp-F6fosuX2O0RK-RzJW-2znNG0XZlMTJ7o7LU',
            id: 'VHJhbnNhY3Rpb246WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwidTlGRDJrcC1GNmZvc3VYMk8wUkstUnpKVy0yem5ORzBYWmxNVEo3bzdMVSJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6LU0xYk9EZ3pEaDV3MjVEWDkzWmZiaFV1RUdMQ2xqVS03Q0xfcF9VZzlkMA==',
              },
              continuation: null,
              eventCount: 5,
              events: {
                pageInfo: {
                  endCursor: 'MjE4ODU5OTY3',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjE4ODU5OTcx',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiNCIsInU5RkQya3AtRjZmb3N1WDJPMFJLLVJ6SlctMnpuTkcwWFpsTVRKN283TFUiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMyIsInU5RkQya3AtRjZmb3N1WDJPMFJLLVJ6SlctMnpuTkcwWFpsTVRKN283TFUiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMiIsInU5RkQya3AtRjZmb3N1WDJPMFJLLVJ6SlctMnpuTkcwWFpsTVRKN283TFUiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMSIsInU5RkQya3AtRjZmb3N1WDJPMFJLLVJ6SlctMnpuTkcwWFpsTVRKN283TFUiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMCIsInU5RkQya3AtRjZmb3N1WDJPMFJLLVJ6SlctMnpuTkcwWFpsTVRKN283TFUiXQ==',
                    },
                  },
                ],
              },
              gas: '1740',
              goodResult:
                '[{"token":"runonflux.flux","amount":49968.99999987},{"token":"coin","amount":16056.9363158}]',
              logs: 'Ce_Zn2qqJ1xmScpOWI-fHZdqsxB_WdIo68jzLuVSGUY',
              transactionId: '2040991',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMiIsIjIiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwidTlGRDJrcC1GNmZvc3VYMk8wUkstUnpKVy0yem5ORzBYWmxNVEo3bzdMVSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMiIsIjEiLCJYbFN3M1BFSVpnQ05LX2U4b0hpa2ZlMVVJQzFneVpuWVd0UHktT2QxOXVjIiwidTlGRDJrcC1GNmZvc3VYMk8wUkstUnpKVy0yem5ORzBYWmxNVEo3bzdMVSJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItTTFiT0RnekRoNXcyNURYOTNaZmJoVXVFR0xDbGpVLTdDTF9wX1VnOWQwIiwiMiIsIjAiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwidTlGRDJrcC1GNmZvc3VYMk8wUkstUnpKVy0yem5ORzBYWmxNVEo3bzdMVSJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: '368f0a2d16802e3b0855e11db6d4f09f4bef00af7fcdf3a8b4b669edf2ff3cfd939ae61473754f1aca9c60c262221d57710e4c9c16146d08ef1b8e936134000c',
              },
            ],
          },
        },
        {
          cursor: 'MTYzMDc1NzExOQ==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2021-09-04T12:05:19.000Z',
                gasLimit: '600',
                gasPrice: 1e-10,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '900',
              },
              networkId: 'mainnet01',
              nonce: '2021-09-04T12:06:19.278Z',
              payload: {
                code: '"(runonflux.flux.transfer-crosschain \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" (read-keyset \\"receiver-guard\\") \\"2\\" 99895.0)"',
                data: '{"receiver-guard":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"]',
                      name: 'runonflux.flux.DEBIT',
                    },
                    {
                      args: '[]',
                      name: 'coin.GAS',
                    },
                  ],
                  id: 'U2lnbmVyOlsiRk9UWEkxX3RDVTJaUjcwRDlOZ1pvXzU4MU9pcTRDWms2SW80ZENqZVdoWSIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'FOTXI1_tCU2ZR70D9NgZo_581Oiq4CZk6Io4dCjeWhY',
            id: 'VHJhbnNhY3Rpb246WyJEM2tRYXgwUkQwTkRaQzBkV2RSMkNSbG5hOWJuQXJUaTBzLV8zZGhBOUtVIiwiRk9UWEkxX3RDVTJaUjcwRDlOZ1pvXzU4MU9pcTRDWms2SW80ZENqZVdoWSJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6RDNrUWF4MFJEME5EWkMwZFdkUjJDUmxuYTlibkFyVGkwcy1fM2RoQTlLVQ==',
              },
              continuation:
                '{"step":0,"yield":{"data":{"amount":99895,"receiver":"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","receiver-guard":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}},"source":"0","provenance":{"moduleHash":"XlSw3PEIZgCNK_e8oHikfe1UIC1gyZnYWtPy-Od19uc","targetChainId":"2"}},"pactId":"FOTXI1_tCU2ZR70D9NgZo_581Oiq4CZk6Io4dCjeWhY","executed":null,"stepCount":2,"continuation":{"def":"runonflux.flux.transfer-crosschain","args":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf",{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"},"2",99895]},"stepHasRollback":false}',
              eventCount: 2,
              events: {
                pageInfo: {
                  endCursor: 'MjIyODcxODgz',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjIyODcxODg0',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJEM2tRYXgwUkQwTkRaQzBkV2RSMkNSbG5hOWJuQXJUaTBzLV8zZGhBOUtVIiwiMSIsIkZPVFhJMV90Q1UyWlI3MEQ5Tmdab181ODFPaXE0Q1prNklvNGRDamVXaFkiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJEM2tRYXgwUkQwTkRaQzBkV2RSMkNSbG5hOWJuQXJUaTBzLV8zZGhBOUtVIiwiMCIsIkZPVFhJMV90Q1UyWlI3MEQ5Tmdab181ODFPaXE0Q1prNklvNGRDamVXaFkiXQ==',
                    },
                  },
                ],
              },
              gas: '321',
              goodResult:
                '{"amount":99895,"receiver":"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","receiver-guard":{"keys":["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf"],"pred":"keys-all"}}',
              logs: 'Q8C88VHB6sXnyFm8ykxxpObnANkfDMxRLDB53gwzB0w',
              transactionId: '3152803',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJEM2tRYXgwUkQwTkRaQzBkV2RSMkNSbG5hOWJuQXJUaTBzLV8zZGhBOUtVIiwiMCIsIjAiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwiRk9UWEkxX3RDVTJaUjcwRDlOZ1pvXzU4MU9pcTRDWms2SW80ZENqZVdoWSJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'ee129d525d3c5248d121f64124bbbe0d083e773e659df749329cd014e197e467873d6465fd2bcafa9c60f494e410d53f4ff9faff9ec0e92823629b8957de4503',
              },
            ],
          },
        },
        {
          cursor: 'MTYyOTk3MDYwNQ==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2021-08-26T09:36:45.000Z',
                gasLimit: '600',
                gasPrice: 1e-10,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '900',
              },
              networkId: 'mainnet01',
              nonce: '2021-08-26T09:37:44.932Z',
              payload: {
                code: '"(runonflux.flux.transfer \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" \\"c970bf51b46ed9510afe7bc531ef10d0a707912ef9fbdc6857807b3869673dd4\\" 199792.0)"',
                data: '{}',
              },
              signers: [
                {
                  address: null,
                  clist: [
                    {
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","c970bf51b46ed9510afe7bc531ef10d0a707912ef9fbdc6857807b3869673dd4",199792]',
                      name: 'runonflux.flux.TRANSFER',
                    },
                    {
                      args: '[]',
                      name: 'coin.GAS',
                    },
                  ],
                  id: 'U2lnbmVyOlsieE5tbWZEOHZYMGxwLWxnZ2MxTlhtVEtTV3hLR05SZDlYemxlbXhwcVZ1byIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'xNmmfD8vX0lp-lggc1NXmTKSWxKGNRd9XzlemxpqVuo',
            id: 'VHJhbnNhY3Rpb246WyJfYWJuTnJSWllwMWhUY0MzSTlZNnFCb29ZYjYyYXhINVoyMnoxWW40aE9BIiwieE5tbWZEOHZYMGxwLWxnZ2MxTlhtVEtTV3hLR05SZDlYemxlbXhwcVZ1byJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6X2Fibk5yUlpZcDFoVGNDM0k5WTZxQm9vWWI2MmF4SDVaMjJ6MVluNGhPQQ==',
              },
              continuation: null,
              eventCount: 2,
              events: {
                pageInfo: {
                  endCursor: 'MjIyOTIxNTQ4',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjIyOTIxNTQ5',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJfYWJuTnJSWllwMWhUY0MzSTlZNnFCb29ZYjYyYXhINVoyMnoxWW40aE9BIiwiMSIsInhObW1mRDh2WDBscC1sZ2djMU5YbVRLU1d4S0dOUmQ5WHpsZW14cHFWdW8iXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJfYWJuTnJSWllwMWhUY0MzSTlZNnFCb29ZYjYyYXhINVoyMnoxWW40aE9BIiwiMCIsInhObW1mRDh2WDBscC1sZ2djMU5YbVRLU1d4S0dOUmQ5WHpsZW14cHFWdW8iXQ==',
                    },
                  },
                ],
              },
              gas: '475',
              goodResult: '"Write succeeded"',
              logs: 'sPVaH68semP-vIfLuuVpcHr_4_W_3LeLlrMwKOUxbq4',
              transactionId: '3052978',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJfYWJuTnJSWllwMWhUY0MzSTlZNnFCb29ZYjYyYXhINVoyMnoxWW40aE9BIiwiMCIsIjEiLCJYbFN3M1BFSVpnQ05LX2U4b0hpa2ZlMVVJQzFneVpuWVd0UHktT2QxOXVjIiwieE5tbWZEOHZYMGxwLWxnZ2MxTlhtVEtTV3hLR05SZDlYemxlbXhwcVZ1byJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJfYWJuTnJSWllwMWhUY0MzSTlZNnFCb29ZYjYyYXhINVoyMnoxWW40aE9BIiwiMCIsIjAiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwieE5tbWZEOHZYMGxwLWxnZ2MxTlhtVEtTV3hLR05SZDlYemxlbXhwcVZ1byJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'f17267709c35ec2e8097c27d07113d7c57d0a4e52f1f4ef69e35e2b3e0ab494d1aee469380c8e5eed4ad5bf9c8112ed06bb857f29314b652fd171835a4a9080a',
              },
            ],
          },
        },
        {
          cursor: 'MTYyNDc5MzQ5Nw==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2021-06-27T11:31:37.000Z',
                gasLimit: '3000',
                gasPrice: 1e-12,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2021-06-27T11:32:37.060Z',
              payload: {
                code: '"(kdx.priv-sale.reserve \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" (read-decimal \'amount))"',
                data: '{"amount":2043.642}',
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
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","kdx-bank",2043.642]',
                      name: 'coin.TRANSFER',
                    },
                  ],
                  id: 'U2lnbmVyOlsidWd4Zmxjcmp0cGU2WDhVeURRdGhtZFBnWWZsSGNCSm9MMTdQOUEweFdOYyIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'ugxflcrjtpe6X8UyDQthmdPgYflHcBJoL17P9A0xWNc',
            id: 'VHJhbnNhY3Rpb246WyItLUJXVWVkSlhsSlBlSWo1MmNPWnBhV0xLSUlyUVVkU3VfakQ0bVotOGgwIiwidWd4Zmxjcmp0cGU2WDhVeURRdGhtZFBnWWZsSGNCSm9MMTdQOUEweFdOYyJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6LS1CV1VlZEpYbEpQZUlqNTJjT1pwYVdMS0lJclFVZFN1X2pENG1aLThoMA==',
              },
              continuation: null,
              eventCount: 3,
              events: {
                pageInfo: {
                  endCursor: 'MjIzMTU0MTg5',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjIzMTU0MTkx',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyItLUJXVWVkSlhsSlBlSWo1MmNPWnBhV0xLSUlyUVVkU3VfakQ0bVotOGgwIiwiMiIsInVneGZsY3JqdHBlNlg4VXlEUXRobWRQZ1lmbEhjQkpvTDE3UDlBMHhXTmMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItLUJXVWVkSlhsSlBlSWo1MmNPWnBhV0xLSUlyUVVkU3VfakQ0bVotOGgwIiwiMSIsInVneGZsY3JqdHBlNlg4VXlEUXRobWRQZ1lmbEhjQkpvTDE3UDlBMHhXTmMiXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyItLUJXVWVkSlhsSlBlSWo1MmNPWnBhV0xLSUlyUVVkU3VfakQ0bVotOGgwIiwiMCIsInVneGZsY3JqdHBlNlg4VXlEUXRobWRQZ1lmbEhjQkpvTDE3UDlBMHhXTmMiXQ==',
                    },
                  },
                ],
              },
              gas: '926',
              goodResult:
                '"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf reserved KDX with 2043.642 KDA"',
              logs: '6Fcv7XJd8YSJ0NWe9G_S-UAWXKrP0RHJUWtlyzpjlAY',
              transactionId: '2544979',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItLUJXVWVkSlhsSlBlSWo1MmNPWnBhV0xLSUlyUVVkU3VfakQ0bVotOGgwIiwiMCIsIjEiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwidWd4Zmxjcmp0cGU2WDhVeURRdGhtZFBnWWZsSGNCSm9MMTdQOUEweFdOYyJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyItLUJXVWVkSlhsSlBlSWo1MmNPWnBhV0xLSUlyUVVkU3VfakQ0bVotOGgwIiwiMCIsIjAiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwidWd4Zmxjcmp0cGU2WDhVeURRdGhtZFBnWWZsSGNCSm9MMTdQOUEweFdOYyJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'e0e01b3e02c7883799a99b60d62d6a97be94324b474c135f67cfcdf68a221c26957e11f164cba32248227416e09f738549af22c717d61fe419c49ca142c04902',
              },
            ],
          },
        },
        {
          cursor: 'MTYyNDU1NTExNw==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2021-06-24T17:18:37.000Z',
                gasLimit: '3000',
                gasPrice: 1e-12,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2021-06-24T17:19:36.557Z',
              payload: {
                code: '"(kdx.priv-sale.reserve \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" (read-decimal \'amount))"',
                data: '{"amount":1166.66688}',
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
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","kdx-bank",1166.66688]',
                      name: 'coin.TRANSFER',
                    },
                  ],
                  id: 'U2lnbmVyOlsiYzlqNXcteVRFWXphZkI4OXpyU1VKZmRNTnA0QTVreHdPYzZEeDZzYkJwdyIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'c9j5w-yTEYzafB89zrSUJfdMNp4A5kxwOc6Dx6sbBpw',
            id: 'VHJhbnNhY3Rpb246WyJoRDVsaFpCNjJzaXc0cFQtczg1ZVJLc2hLallIeS1zT2gtTk4tZkVBd1RrIiwiYzlqNXcteVRFWXphZkI4OXpyU1VKZmRNTnA0QTVreHdPYzZEeDZzYkJwdyJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6aEQ1bGhaQjYyc2l3NHBULXM4NWVSS3NoS2pZSHktc09oLU5OLWZFQXdUaw==',
              },
              continuation: null,
              eventCount: 3,
              events: {
                pageInfo: {
                  endCursor: 'MjIzMTYxOTkx',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjIzMTYxOTkz',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJoRDVsaFpCNjJzaXc0cFQtczg1ZVJLc2hLallIeS1zT2gtTk4tZkVBd1RrIiwiMiIsImM5ajV3LXlURVl6YWZCODl6clNVSmZkTU5wNEE1a3h3T2M2RHg2c2JCcHciXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJoRDVsaFpCNjJzaXc0cFQtczg1ZVJLc2hLallIeS1zT2gtTk4tZkVBd1RrIiwiMSIsImM5ajV3LXlURVl6YWZCODl6clNVSmZkTU5wNEE1a3h3T2M2RHg2c2JCcHciXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJoRDVsaFpCNjJzaXc0cFQtczg1ZVJLc2hLallIeS1zT2gtTk4tZkVBd1RrIiwiMCIsImM5ajV3LXlURVl6YWZCODl6clNVSmZkTU5wNEE1a3h3T2M2RHg2c2JCcHciXQ==',
                    },
                  },
                ],
              },
              gas: '922',
              goodResult:
                '"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf reserved KDX with 1166.66688 KDA"',
              logs: 'jIIMtBAJPM4aKTNVKX0kqdbrb_KpPodEJzWxiZRskRs',
              transactionId: '2525997',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJoRDVsaFpCNjJzaXc0cFQtczg1ZVJLc2hLallIeS1zT2gtTk4tZkVBd1RrIiwiMCIsIjEiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwiYzlqNXcteVRFWXphZkI4OXpyU1VKZmRNTnA0QTVreHdPYzZEeDZzYkJwdyJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJoRDVsaFpCNjJzaXc0cFQtczg1ZVJLc2hLallIeS1zT2gtTk4tZkVBd1RrIiwiMCIsIjAiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwiYzlqNXcteVRFWXphZkI4OXpyU1VKZmRNTnA0QTVreHdPYzZEeDZzYkJwdyJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'bb7dafa4755c843896e19586befc8ec2b9ea6470c256cdd2345aa26197c31b754172e7bdc90e518867b18b2a0424e8793b61aa9944984b3fa6b6a66c5f419001',
              },
            ],
          },
        },
        {
          cursor: 'MTYyNDE5MjMxMg==',
          node: {
            cmd: {
              meta: {
                chainId: 0,
                creationTime: '2021-06-20T12:31:52.000Z',
                gasLimit: '3000',
                gasPrice: 1e-12,
                sender: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                ttl: '600',
              },
              networkId: 'mainnet01',
              nonce: '2021-06-20T12:32:51.591Z',
              payload: {
                code: '"(kdx.priv-sale.reserve \\"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf\\" (read-decimal \'amount))"',
                data: '{"amount":354.787666}',
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
                      args: '["1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf","kdx-bank",354.787666]',
                      name: 'coin.TRANSFER',
                    },
                  ],
                  id: 'U2lnbmVyOlsiZEgzMkRfWGtOcEFtMzhEb3pHVS1ZM01SVUVaMGJQRjk2XzUxUkNha0otZyIsIjAiXQ==',
                  orderIndex: 0,
                  pubkey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
                  scheme: '',
                },
              ],
            },
            hash: 'dH32D_XkNpAm38DozGU-Y3MRUEZ0bPF96_51RCakJ-g',
            id: 'VHJhbnNhY3Rpb246WyJpcDdIbDNVZ1NPNWYzTlpVOUVQM21JX1pqLUJmSmR6eEVJSzVKSlZCclgwIiwiZEgzMkRfWGtOcEFtMzhEb3pHVS1ZM01SVUVaMGJQRjk2XzUxUkNha0otZyJd',
            orphanedTransactions: null,
            result: {
              badResult: null,
              block: {
                id: 'QmxvY2s6aXA3SGwzVWdTTzVmM05aVTlFUDNtSV9aai1CZkpkenhFSUs1SkpWQnJYMA==',
              },
              continuation: null,
              eventCount: 3,
              events: {
                pageInfo: {
                  endCursor: 'MjIzMTc5OTQ4',
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'MjIzMTc5OTUw',
                },
                edges: [
                  {
                    node: {
                      id: 'RXZlbnQ6WyJpcDdIbDNVZ1NPNWYzTlpVOUVQM21JX1pqLUJmSmR6eEVJSzVKSlZCclgwIiwiMiIsImRIMzJEX1hrTnBBbTM4RG96R1UtWTNNUlVFWjBiUEY5Nl81MVJDYWtKLWciXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJpcDdIbDNVZ1NPNWYzTlpVOUVQM21JX1pqLUJmSmR6eEVJSzVKSlZCclgwIiwiMSIsImRIMzJEX1hrTnBBbTM4RG96R1UtWTNNUlVFWjBiUEY5Nl81MVJDYWtKLWciXQ==',
                    },
                  },
                  {
                    node: {
                      id: 'RXZlbnQ6WyJpcDdIbDNVZ1NPNWYzTlpVOUVQM21JX1pqLUJmSmR6eEVJSzVKSlZCclgwIiwiMCIsImRIMzJEX1hrTnBBbTM4RG96R1UtWTNNUlVFWjBiUEY5Nl81MVJDYWtKLWciXQ==',
                    },
                  },
                ],
              },
              gas: '922',
              goodResult:
                '"1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf reserved KDX with 354.787666 KDA"',
              logs: 'HsyX8rqL2BFtiKatbC0A6qN4wbNPtaCzYs-CGxJRDJU',
              transactionId: '2490651',
              transfers: {
                edges: [
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJpcDdIbDNVZ1NPNWYzTlpVOUVQM21JX1pqLUJmSmR6eEVJSzVKSlZCclgwIiwiMCIsIjEiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwiZEgzMkRfWGtOcEFtMzhEb3pHVS1ZM01SVUVaMGJQRjk2XzUxUkNha0otZyJd',
                    },
                  },
                  {
                    node: {
                      id: 'VHJhbnNmZXI6WyJpcDdIbDNVZ1NPNWYzTlpVOUVQM21JX1pqLUJmSmR6eEVJSzVKSlZCclgwIiwiMCIsIjAiLCIxb3Nfc0xBVVl2QnpzcG41amphd3RScEpXaUgxV1BmaHlOcmFlVnZTSXdVIiwiZEgzMkRfWGtOcEFtMzhEb3pHVS1ZM01SVUVaMGJQRjk2XzUxUkNha0otZyJd',
                    },
                  },
                ],
              },
            },
            sigs: [
              {
                sig: 'c93643a90b22877a388d72d0ddd35da5ee14add1950c0421803f3a5a5251d89aaee87d1a82a7d542d42a7d39760a600d103ee66a7ca3898070005011553c6b0f',
              },
            ],
          },
        },
      ],
    },
  },
};
