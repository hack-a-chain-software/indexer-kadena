package process

import (
	"context"
	"fmt"
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Counters struct {
	Transactions int
	Events       int
	Transfers    int
	Signers      int
	Balances     int
}

type DataSizeTracker struct {
	TransactionsKB int
	EventsKB       int
	TransfersKB    int
	SignersKB      int
	BalancesKB     int
}

func savePayloads(network string, chainId int, processedPayloads []fetch.ProcessedPayload, pool *pgxpool.Pool) (Counters, DataSizeTracker, error) {
	startTime := time.Now()

	counters := Counters{
		Transactions: 0,
		Events:       0,
		Transfers:    0,
		Signers:      0,
		Balances:     0,
	}

	dataSizeTracker := DataSizeTracker{
		TransactionsKB: 0,
		EventsKB:       0,
		TransfersKB:    0,
		SignersKB:      0,
		BalancesKB:     0,
	}

	conn, err := pool.Acquire(context.Background())
	if err != nil {
		return Counters{}, DataSizeTracker{}, fmt.Errorf("acquiring connection: %w", err)
	}
	defer conn.Release()

	tx, err := conn.Begin(context.Background())
	if err != nil {
		return Counters{}, DataSizeTracker{}, fmt.Errorf("starting transaction: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback(context.Background()) // Explicitly ignore rollback error
		}
	}()

	blocks := PrepareBlocks(network, chainId, processedPayloads)

	blockIds, err := repository.SaveBlocks(tx, blocks)
	if err != nil {
		return Counters{}, DataSizeTracker{}, fmt.Errorf("saving blocks -> %w", err)
	}

	var transactionIdsToSave [][]int64
	for index, processedPayload := range processedPayloads {
		var blockId = blockIds[index]
		var currBlock = blocks[index]
		txs, txDetails, txCoinbase, err := PrepareTransactions(network, blockId, processedPayload, currBlock)
		if err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("preparing transactions for block %d -> %w", currBlock.Height, err)
		}

		transactionIds, err := repository.SaveTransactions(tx, txs, txCoinbase)
		if err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving transactions for block %d -> %w", currBlock.Height, err)
		}

		err = repository.SaveTransactionDetails(tx, txDetails, transactionIds)
		if err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving transaction details for block %d -> %w", currBlock.Height, err)
		}

		txsSize := approximateSize(txs)
		dataSizeTracker.TransactionsKB += txsSize
		transactionIdsToSave = append(transactionIdsToSave, transactionIds)
		counters.Transactions += len(transactionIds)
	}

	for index, processedPayload := range processedPayloads {
		events, err := PrepareEvents(network, processedPayload, transactionIdsToSave[index])
		if err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("preparing events -> %w", err)
		}
		if err := repository.SaveEventsToDatabase(events, tx); err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving events -> %w", err)
		}

		balances, err := PrepareNonFungibleBalancesData(events)
		if err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("preparing non fungible balances -> %w", err)
		}
		if err := repository.SaveBalancesToDatabase(balances, tx); err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving non fungible balances: %w", err)
		}

		balancesSize := approximateSize(balances)
		dataSizeTracker.BalancesKB += balancesSize
		counters.Balances += len(balances)

		size := approximateSize(events)
		dataSizeTracker.EventsKB += size
		counters.Events += len(events)
	}

	for index, processedPayload := range processedPayloads {
		transfers, err := PrepareTransfers(network, processedPayload, transactionIdsToSave[index])
		if err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("preparing transfers -> %w", err)
		}
		if err := repository.SaveTransfersToDatabase(transfers, tx); err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving transfers: %w", err)
		}

		balances := PrepareFungibleBalancesData(transfers)
		if err := repository.SaveBalancesToDatabase(balances, tx); err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving fungible balances: %w", err)
		}

		balancesSize := approximateSize(balances)
		dataSizeTracker.BalancesKB += balancesSize
		counters.Balances += len(balances)

		size := approximateSize(transfers)
		dataSizeTracker.TransfersKB += size
		counters.Transfers += len(transfers)
	}

	for index, processedPayload := range processedPayloads {
		signers := PrepareSigners(network, processedPayload, transactionIdsToSave[index])
		if err := repository.SaveSignersToDatabase(signers, tx); err != nil {
			return Counters{}, DataSizeTracker{}, fmt.Errorf("saving signers: %w", err)
		}

		size := approximateSize(signers)
		dataSizeTracker.SignersKB += size
		counters.Signers += len(signers)
	}

	env := config.GetConfig()
	if env.IsSingleChain {
		log.Printf("Saved payloads in %fs\n", time.Since(startTime).Seconds())
	}

	if err := tx.Commit(context.Background()); err != nil {
		return Counters{}, DataSizeTracker{}, fmt.Errorf("committing transaction: %w", err)
	}

	dataSizeTracker.TransactionsKB /= 1024
	dataSizeTracker.EventsKB /= 1024
	dataSizeTracker.TransfersKB /= 1024
	dataSizeTracker.SignersKB /= 1024
	dataSizeTracker.BalancesKB /= 1024

	return counters, dataSizeTracker, nil
}
