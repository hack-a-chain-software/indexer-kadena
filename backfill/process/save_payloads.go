package process

import (
	"context"
	"fmt"
	"go-backfill/clickhouse"
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
	"strconv"
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
	var txCreationTimesToSave [][]string
	var totalGasUsedInChain float64 = 0

	// Accumulators for ClickHouse backfill
	var chRows []clickhouse.TxCodeRow
	var chReqKeys []string

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

		// Build ClickHouse rows for non-coinbase transactions
		for i := 0; i < len(txDetails); i++ {
			codeStr, mErr := clickhouse.MarshalCode(txDetails[i].Code)
			if mErr != nil {
				log.Printf("[CH][MARSHAL][WARN] skipping code marshal error: %v", mErr)
				continue
			}
			row := clickhouse.TxCodeRow{
				ID:           uint64(transactionIds[i]),
				RequestKey:   txs[i].RequestKey,
				ChainID:      uint16(chainId),
				CreationTime: uint64(currBlock.CreationTime),
				Height:       uint64(currBlock.Height),
				Canonical:    1,
				Sender:       txs[i].Sender,
				Gas:          txDetails[i].Gas,
				GasLimit:     txDetails[i].GasLimit,
				GasPrice:     txDetails[i].GasPrice,
				Code:         codeStr,
			}
			chRows = append(chRows, row)
			chReqKeys = append(chReqKeys, txs[i].RequestKey)
		}

		var totalGasUsedInBlock float64 = 0
		for _, txDetail := range txDetails {
			gas, err := strconv.ParseFloat(txDetail.Gas, 64)
			if err != nil {
				return Counters{}, DataSizeTracker{}, fmt.Errorf("parsing gas for block %d: %w", currBlock.Height, err)
			}
			gasPrice, err := strconv.ParseFloat(txDetail.GasPrice, 64)
			if err != nil {
				return Counters{}, DataSizeTracker{}, fmt.Errorf("parsing gas price for block %d: %w", currBlock.Height, err)
			}
			totalGasUsedInBlock += gas * gasPrice
		}

		repository.SaveTotalGasUsed(tx, totalGasUsedInBlock, blockId)
		totalGasUsedInChain += totalGasUsedInBlock

		txsSize := approximateSize(txs)
		dataSizeTracker.TransactionsKB += txsSize
		transactionIdsToSave = append(transactionIdsToSave, transactionIds)

		var txCreationTimes []string
		for _, tx := range txs {
			txCreationTimes = append(txCreationTimes, tx.CreationTime)
		}
		txCreationTimes = append(txCreationTimes, txCoinbase.CreationTime)
		txCreationTimesToSave = append(txCreationTimesToSave, txCreationTimes)

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
		transfers, err := PrepareTransfers(network, processedPayload, transactionIdsToSave[index], txCreationTimesToSave[index])
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

	repository.SaveCounters(tx, repository.CounterAttributes{
		ChainId:              chainId,
		TotalGasUsed:         totalGasUsedInChain,
		CanonicalBlocksCount: len(blocks),
		// ignore coinbase transactions on the canonical transaction counter
		CanonicalTransactionsCount: counters.Transactions - len(blocks),
	})

	env := config.GetConfig()
	if env.IsSingleChain {
		log.Printf("Saved payloads in %fs\n", time.Since(startTime).Seconds())
	}

	if err := tx.Commit(context.Background()); err != nil {
		return Counters{}, DataSizeTracker{}, fmt.Errorf("committing transaction: %w", err)
	}

	// After commit, optionally backfill into ClickHouse and flip flags
	if clickhouse.GetCHConfig().ClickHouseURL != "" {
		ctx := context.Background()
		connCH, err := clickhouse.NewClient(clickhouse.GetCHConfig())
		if err != nil {
			log.Printf("[CH][CONNECT][ERROR] %v", err)
		} else {
			if err := clickhouse.EnsureDDL(ctx, connCH); err != nil {
				log.Printf("[CH][DDL][ERROR] %v", err)
			} else {
				if err := clickhouse.BulkInsert(ctx, connCH, chRows); err != nil {
					log.Printf("[CH][INSERT][ERROR] %v", err)
				} else {
					// Flip code_indexed for matching request keys
					if len(chReqKeys) > 0 {
						_, err := conn.Exec(context.Background(), `
							UPDATE "TransactionDetails" td
							SET code_indexed = true
							FROM "Transactions" t
							WHERE td."transactionId" = t.id AND t.requestkey = ANY($1::text[])`, chReqKeys)
						if err != nil {
							log.Printf("[PG][FLAG][ERROR] %v", err)
						}
					}
				}
			}
		}
	}

	dataSizeTracker.TransactionsKB /= 1024
	dataSizeTracker.EventsKB /= 1024
	dataSizeTracker.TransfersKB /= 1024
	dataSizeTracker.SignersKB /= 1024
	dataSizeTracker.BalancesKB /= 1024

	return counters, dataSizeTracker, nil
}
