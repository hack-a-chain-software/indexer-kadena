package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

type CounterAttributes struct {
	ChainId                    int
	CanonicalBlocksCount       int
	CanonicalTransactionsCount int
	TotalGasUsed               float64
}

func SaveTotalGasUsed(tx pgx.Tx, totalGasUsed float64, blockId int64) error {
	query := `
		UPDATE "Blocks"
		SET "totalGasUsed" = $1
		WHERE "id" = $2
	`

	_, err := tx.Exec(context.Background(), query, totalGasUsed, blockId)
	if err != nil {
		return fmt.Errorf("saving total gas used: %w", err)
	}

	return nil
}

func SaveCounters(tx pgx.Tx, counters CounterAttributes) error {
	query := `
		UPDATE "Counters"
		SET "canonicalBlocks" = "canonicalBlocks" + $1, "canonicalTransactions" = "canonicalTransactions" + $2, "totalGasUsed" = "totalGasUsed" + $3
		WHERE "chainId" = $4
	`

	_, err := tx.Exec(context.Background(), query, counters.CanonicalBlocksCount, counters.CanonicalTransactionsCount, counters.TotalGasUsed, counters.ChainId)
	if err != nil {
		return fmt.Errorf("saving counters: %w", err)
	}

	return nil
}
