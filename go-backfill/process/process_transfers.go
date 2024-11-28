package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
)

func PrepareTransfers(network string, item fetch.Item, payload fetch.ProcessedPayload, transactionsId []int64) []repository.TransferAttributes {
	transactions := payload.Transactions

	if len(transactions) == 0 {
		// log.Printf("No transfers to save for block %s\n", item.Hash)
		return []repository.TransferAttributes{}
	}

	// average value that we can expect for the number of events in 50 blocks
	const avgTransfersPerTransaction = 80
	transfers := make([]repository.TransferAttributes, 0, len(transactions)*avgTransfersPerTransaction)

	for index, t := range transactions {
		coinTransfers := GetCoinTransfers(t.Events, item.PayloadHash, item.ChainId, t.ReqKey, transactionsId[index])
		nftTransfers := GetNftTransfers(network, item.ChainId, t.Events, item.PayloadHash, t.ReqKey, transactionsId[index])
		transfers = append(transfers, coinTransfers...)
		transfers = append(transfers, nftTransfers...)
	}

	return transfers
}
