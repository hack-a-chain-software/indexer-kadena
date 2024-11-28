package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type BlockAttributes struct {
	Nonce             string
	CreationTime      int64
	Parent            string
	Adjacents         map[string]string
	Target            string
	PayloadHash       string
	ChainId           int
	Weight            string
	Height            int
	ChainwebVersion   string
	EpochStart        int64
	FeatureFlags      int
	Hash              string
	MinerData         string
	TransactionsHash  string
	OutputsHash       string
	Coinbase          string
	TransactionsCount int
}

func SaveBlocks(tx pgx.Tx, blocks []BlockAttributes) ([]int64, error) {
	if len(blocks) == 0 {
		return nil, nil
	}

	query := `
		INSERT INTO "Blocks" (
			nonce, "creationTime", parent, adjacents, target, "payloadHash", 
			"chainId", weight, height, "chainwebVersion", "epochStart", 
			"featureFlags", hash, "minerData", "transactionsHash", 
			"outputsHash", coinbase, "transactionsCount", "createdAt", "updatedAt"
		)
		VALUES 
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
		RETURNING id
	`

	now := time.Now()

	batch := &pgx.Batch{}
	for _, block := range blocks {
		adjacentsJSON, err := json.Marshal(block.Adjacents)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal adjacents for block %s: %v", block.Hash, err)
		}

		batch.Queue(
			query,
			block.Nonce,
			block.CreationTime,
			block.Parent,
			adjacentsJSON,
			block.Target,
			block.PayloadHash,
			block.ChainId,
			block.Weight,
			block.Height,
			block.ChainwebVersion,
			block.EpochStart,
			block.FeatureFlags,
			block.Hash,
			block.MinerData,
			block.TransactionsHash,
			block.OutputsHash,
			block.Coinbase,
			block.TransactionsCount,
			now,
			now,
		)
	}

	// Send the batch to the database
	br := tx.SendBatch(context.Background(), batch)
	defer br.Close()

	blockIds := make([]int64, 0, len(blocks))

	// Collect IDs for each queued query
	for i := 0; i < len(blocks); i++ {
		var id int64
		if err := br.QueryRow().Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to execute batch for block %d: %v", i, err)
		}
		blockIds = append(blockIds, id)
	}

	return blockIds, nil
}
