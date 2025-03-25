package main

import (
	"context"
	"flag"
	"fmt"
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/process"
	"go-backfill/repository"
	"log"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
)

const (
	coinbaseBatchSize = 1000
)

type CoinbaseData struct {
	ID           int64  `json:"id"`
	Coinbase     string `json:"coinbase"`
	ChainId      int    `json:"chainId"`
	CreationTime string `json:"creationTime"`
}

func createBatchCoinbase(conn *pgx.Conn, lastId int64, network string) (bool, int64, error) {
	startTime := time.Now()

	// Start transaction for writes
	tx, err := conn.Begin(context.Background())
	if err != nil {
		return false, lastId, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(context.Background())

	// Fetch blocks with coinbase data using cursor pagination
	query := `
		SELECT id, coinbase, "chainId", "creationTime"
		FROM "Blocks"
		WHERE id > $1
		ORDER BY id ASC
		LIMIT $2
	`

	rows, err := conn.Query(context.Background(), query, lastId, coinbaseBatchSize)
	if err != nil {
		return false, lastId, fmt.Errorf("failed to execute query: %v", err)
	}
	defer rows.Close()

	var blocks []CoinbaseData
	for rows.Next() {
		var block CoinbaseData
		if err := rows.Scan(&block.ID, &block.Coinbase, &block.ChainId, &block.CreationTime); err != nil {
			return false, lastId, fmt.Errorf("failed to scan row: %v", err)
		}
		blocks = append(blocks, block)
	}

	if len(blocks) == 0 {
		return false, lastId, nil
	}

	// Process each block's coinbase transaction
	var transactions []repository.TransactionAttributes
	var transactionIds []int64
	for _, block := range blocks {
		creationTime, err := strconv.ParseInt(block.CreationTime, 10, 64)
		if err != nil {
			return false, lastId, fmt.Errorf("failed to parse creation time for block %d: %v", block.ID, err)
		}
		tx, err := process.ProcessCoinbaseTransaction(block.Coinbase, block.ID, creationTime, int64(block.ChainId))
		if err != nil {
			return false, lastId, fmt.Errorf("failed to process coinbase for block %d: %v", block.ID, err)
		}
		transactions = append(transactions, tx)
	}

	// Save transactions to database
	if len(transactions) > 0 {
		ids, err := repository.SaveTransactions(tx, transactions, repository.TransactionAttributes{})
		if err != nil {
			return false, lastId, fmt.Errorf("failed to save transactions: %v", err)
		}
		transactionIds = ids

		// Process and save events and transfers for each coinbase transaction
		for i, block := range blocks {
			transactionId := transactionIds[i]

			// Create a ProcessedPayload structure for the coinbase events
			processedPayload := fetch.ProcessedPayload{
				Header: fetch.Header{
					ChainId: block.ChainId,
				},
				Coinbase: []byte(block.Coinbase),
			}

			// Prepare and save events
			events, err := process.PrepareEvents(network, processedPayload, []int64{transactionId})
			if err != nil {
				return false, lastId, fmt.Errorf("failed to prepare events for block %d: %v", block.ID, err)
			}

			if err := repository.SaveEventsToDatabase(events, tx); err != nil {
				return false, lastId, fmt.Errorf("failed to save events for block %d: %v", block.ID, err)
			}

			// Prepare and save transfers
			transfers, err := process.PrepareTransfers(network, processedPayload, []int64{transactionId})
			if err != nil {
				return false, lastId, fmt.Errorf("failed to prepare transfers for block %d: %v", block.ID, err)
			}

			if err := repository.SaveTransfersToDatabase(transfers, tx); err != nil {
				return false, lastId, fmt.Errorf("failed to save transfers for block %d: %v", block.ID, err)
			}
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		return false, lastId, fmt.Errorf("failed to commit transaction: %v", err)
	}

	elapsed := time.Since(startTime)
	log.Printf("Processed %d coinbase transactions, their events, and transfers. Batch time: %.2fs", len(transactions), elapsed.Seconds())

	// Return the last processed ID as the new cursor
	lastProcessedId := blocks[len(blocks)-1].ID
	return len(blocks) == coinbaseBatchSize, lastProcessedId, nil
}

func main() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()

	config.InitEnv(*envFile)
	env := config.GetConfig()

	// Database connection
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env.DbHost, env.DbPort, env.DbUser, env.DbPassword, env.DbName)

	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close(context.Background())

	log.Println("Connected to database")

	lastId := int64(0)
	hasMore := true
	totalBlocks := int64(104813544)
	processedBlocks := int64(0)

	for hasMore {
		var err error
		hasMore, lastId, err = createBatchCoinbase(conn, lastId, env.Network)
		if err != nil {
			log.Fatalf("Error during batch processing: %v", err)
		}
		processedBlocks += coinbaseBatchSize
		progress := float64(processedBlocks) / float64(totalBlocks) * 100

		if hasMore {
			log.Printf("Progress: %.2f%% (%d/%d blocks processed)", progress, processedBlocks, totalBlocks)
		} else {
			log.Printf("Progress: 100.00%%")
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Println("Coinbase creation completed successfully")
}
