add env variables to the project
move db to file config
move monitor to monitor config file
use COPY for events and transfers
add to get the latest cut on the project and parametrize the chain id
add the sync save to the db after a success and failed operation
add the public keys account and signers and remove from transaction table
add the contract calls
improve error handling, if something fails for a specific block, it should rollback everything of that block

check these heights 5297740, 5298913, 5292895, 5267752 (decode in txpart01)
2024/11/21 16:34:17 Processing chain: {0 5316406} and {0 4972963}
http://72.44.41.78:1848/chainweb/0.0/mainnet01/chain/0/header?minheight=5316356&maxheight=5316406
2024/11/21 16:34:18 No transactions to save for block CmCbgaEpKlHOsiBaUeWomjwNtmYHuwL54FYHU531lrw
{"meta":{"chainId":"0","creationTime":1731958872,"gasLimit":8000,"gasPrice":"0.00000001","sender":"k:14ba8608c12f515f42db8d960944c213238718bcc555a0d52f45e13a7b1aa4b4","ttl":28860},"networkId":"mainnet01","nonce":"2024-11-19T03:41:12Z.906Z","payload":{"exec":{"code":"(coin.transfer-create \"k:14ba8608c12f515f42db8d960944c213238718bcc555a0d52f45e13a7b1aa4b4\" \"k:c262130a854795997fd8702ebf0aa6dd391cacd0f47c6603eab075a0863d598e\" (read-keyset \"receiver-guard\") 6.69712247)","data":{"receiver-guard":{"keys":["c262130a854795997fd8702ebf0aa6dd391cacd0f47c6603eab075a0863d598e"],"pred":"keys-all"}}}},"signers":[{"clist":[{"args":["k:14ba8608c12f515f42db8d960944c213238718bcc555a0d52f45e13a7b1aa4b4","k:c262130a854795997fd8702ebf0aa6dd391cacd0f47c6603eab075a0863d598e",6.69712247],"name":"coin.TRANSFER"},{"args":[],"name":"coin.GAS"}],"pubKey":"14ba8608c12f515f42db8d960944c213238718bcc555a0d52f45e13a7b1aa4b4"}]}
cGiyqWyvNYZsVC7heHUdp4nFkRsGtkZ4CVB3UmegtrA
2024/11/21 16:34:18 Error unmarshaling Cmd for transaction av5tONNDRWBz8hCT9rNKp6l2kbsL\_-GscenjaGBui80 (JSON object): json: cannot unmarshal string into Go struct field .meta.gasPrice of type float64
