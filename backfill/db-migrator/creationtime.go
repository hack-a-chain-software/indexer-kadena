package main

import (
	"database/sql"
	"flag"
	"fmt"
	"go-backfill/config"
	"log"

	_ "github.com/lib/pq" // PostgreSQL driver
)

const (
	creationTimeBatchSize = 500
	startTransactionId    = 1
	endTransactionId      = 1000
)

// This script was created to duplicate the creation time of transaction to the transfers table.
// The main motivation was to improve the performance of the transfers query.

func UpdateCreationTimes() error {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()
	config.InitEnv(*envFile)
	env := config.GetConfig()
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env.DbHost, env.DbPort, env.DbUser, env.DbPassword, env.DbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database")

	// Test database connection
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	// Process transactions in batches
	if err := processTransactionsBatch(db); err != nil {
		return fmt.Errorf("failed to process transactions: %v", err)
	}

	log.Println("Successfully updated all transfer creation times")
	return nil
}

func processTransactionsBatch(db *sql.DB) error {
	currentId := startTransactionId
	totalProcessed := 0
	totalTransactions := endTransactionId - startTransactionId + 1
	lastProgressPrinted := -1.0

	log.Printf("Starting to process transactions from ID %d to %d",
		startTransactionId, endTransactionId)
	log.Printf("Total transactions to process: %d", totalTransactions)

	for currentId <= endTransactionId {
		// Calculate batch end
		batchEnd := currentId + creationTimeBatchSize - 1
		if batchEnd > endTransactionId {
			batchEnd = endTransactionId
		}

		// Process this batch
		processed, err := processBatch(db, currentId, batchEnd)
		if err != nil {
			return fmt.Errorf("failed to process batch %d-%d: %v", currentId, batchEnd, err)
		}

		totalProcessed += processed

		// Calculate progress percentage
		transactionsProcessed := batchEnd - startTransactionId + 1
		progressPercent := (float64(transactionsProcessed) / float64(totalTransactions)) * 100.0

		// Only print progress if it has increased by at least 0.1%
		if progressPercent-lastProgressPrinted >= 0.1 {
			log.Printf("Progress: %.1f%%", progressPercent)
			lastProgressPrinted = progressPercent
		}

		// Move to next batch
		currentId = batchEnd + 1
	}

	log.Printf("Completed processing. Total transfers updated: %d (100.0%%)", totalProcessed)
	return nil
}

func processBatch(db *sql.DB, startId, endId int) (int, error) {
	// Begin transaction for atomic operation
	tx, err := db.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback() // Will be ignored if tx.Commit() succeeds

	// Update transfers with creation time from transactions in a single query
	updateQuery := `
		UPDATE "Transfers" 
		SET creationtime = t.creationtime, "updatedAt" = CURRENT_TIMESTAMP
		FROM "Transactions" t
		WHERE "Transfers"."transactionId" = t.id 
		AND t.id >= $1 AND t.id <= $2
	`

	result, err := tx.Exec(updateQuery, startId, endId)
	if err != nil {
		return 0, fmt.Errorf("failed to update transfers: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %v", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return int(rowsAffected), nil
}

func creationTimes() {
	if err := UpdateCreationTimes(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}
