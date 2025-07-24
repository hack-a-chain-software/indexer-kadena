package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type CounterAttributes struct {
	ChainId                    int
	CanonicalBlocksCount       int
	CanonicalTransactionsCount int
}

func SaveCounters(tx pgx.Tx, counters CounterAttributes) error {
	query := `
		UPDATE "Counters"
		SET "canonicalBlocks" = "canonicalBlocks" + $1, "canonicalTransactions" = "canonicalTransactions" + $2
		WHERE "chainId" = $3
	`

	batch := &pgx.Batch{}
	batch.Queue(
		query,
		counters.CanonicalBlocksCount,
		counters.CanonicalTransactionsCount,
		counters.ChainId,
	)

	br := tx.SendBatch(context.Background(), batch)
	defer br.Close()

	return nil
}
