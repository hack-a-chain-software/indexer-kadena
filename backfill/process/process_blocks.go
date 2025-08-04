package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
)

func PrepareBlocks(network string, chainId int, payloads []fetch.ProcessedPayload) []repository.BlockAttributes {

	blocks := make([]repository.BlockAttributes, 0, len(payloads))

	for _, payload := range payloads {
		header := payload.Header
		block := repository.BlockAttributes{
			Nonce:             header.Nonce,
			CreationTime:      header.CreationTime,
			Parent:            header.Parent,
			Adjacents:         header.Adjacents,
			Target:            header.Target,
			PayloadHash:       header.PayloadHash,
			ChainId:           chainId,
			Weight:            header.Weight,
			Height:            header.Height,
			ChainwebVersion:   header.ChainwebVersion,
			EpochStart:        header.EpochStart,
			FeatureFlags:      int64(header.FeatureFlags),
			Hash:              header.Hash,
			MinerData:         string(payload.MinerData),
			TransactionsHash:  payload.TransactionsHash,
			OutputsHash:       payload.OutputsHash,
			Coinbase:          string(payload.Coinbase),
			TransactionsCount: len(payload.Transactions),
		}

		blocks = append(blocks, block)
	}

	return blocks
}
