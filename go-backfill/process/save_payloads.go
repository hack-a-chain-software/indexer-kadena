package process

import (
	"context"
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"

	"github.com/jackc/pgx/v5/pgxpool"
)

func savePayloads(network string, chainId int, headers []fetch.Item, processedPayloads []fetch.ProcessedPayload, pool *pgxpool.Pool) error {
	conn, err := pool.Acquire(context.Background())
	if err != nil {
		return fmt.Errorf("acquiring connection: %w", err)
	}
	defer conn.Release()

	tx, err := conn.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("starting transaction: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback(context.Background()) // Explicitly ignore rollback error
		}
	}()

	blocks, err := PrepareBlocks(network, chainId, headers, processedPayloads)
	if err != nil {
		return fmt.Errorf("preparing blocks: %w", err)
	}

	blockIds, err := repository.SaveBlocks(tx, blocks)
	if err != nil {
		return fmt.Errorf("saving blocks: %w", err)
	}

	var transactionIdsToSave [][]int64
	for index, processedPayload := range processedPayloads {
		txs := PrepareTransactions(network, blockIds[index], headers[index], processedPayload)
		transactionIds, err := repository.SaveTransactions(tx, txs)
		if err != nil {
			return fmt.Errorf("saving transactions: %w", err)
		}
		transactionIdsToSave = append(transactionIdsToSave, transactionIds)
	}

	for index, processedPayload := range processedPayloads {
		events := PrepareEvents(network, headers[index], processedPayload, transactionIdsToSave[index])
		if err := repository.SaveEventsToDatabase(events, tx); err != nil {
			return fmt.Errorf("saving events: %w", err)
		}
	}

	for index, processedPayload := range processedPayloads {
		transfers := PrepareTransfers(network, headers[index], processedPayload, transactionIdsToSave[index])
		if err := repository.SaveTransfersToDatabase(transfers, tx); err != nil {
			return fmt.Errorf("saving transfers: %w", err)
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}

	return nil
}
