package process

import (
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"
)

func PrepareBlocks(network string, chainId int, headers []fetch.Item, payloads []fetch.ProcessedPayload) ([]repository.BlockAttributes, error) {
	if len(headers) != len(payloads) {
		return nil, fmt.Errorf("mismatch between headers and payloads: %d headers, %d payloads", len(headers), len(payloads))
	}

	blocks := make([]repository.BlockAttributes, 0, len(headers))

	for i, header := range headers {
		payload := payloads[i]
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
			FeatureFlags:      header.FeatureFlags,
			Hash:              header.Hash,
			MinerData:         string(payload.MinerData),
			TransactionsHash:  payload.TransactionsHash,
			OutputsHash:       payload.OutputsHash,
			Coinbase:          string(payload.Coinbase),
			TransactionsCount: len(payload.Transactions),
		}

		blocks = append(blocks, block)
	}

	return blocks, nil
}
