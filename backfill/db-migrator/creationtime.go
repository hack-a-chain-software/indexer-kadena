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
	endTransactionId      = 110239835
)

// This script was created to duplicate the creation time of transaction to the events and transfers tables.
// The main motivation was to improve the performance of the events and transfers queries.

func updateCreationTimes() error {
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

	log.Println("Successfully updated all events and transfers creation times")
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

	log.Printf("Completed processing. Total records updated: %d (100.0%%)", totalProcessed)
	return nil
}

func processBatch(db *sql.DB, startId, endId int) (int, error) {
	// Begin transaction for atomic operation
	tx, err := db.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback() // Will be ignored if tx.Commit() succeeds

	// Update events with creation time from transactions
	eventsUpdateQuery := `
		UPDATE "Events" 
		SET creationtime = t.creationtime, "updatedAt" = CURRENT_TIMESTAMP
		FROM "Transactions" t
		WHERE "Events"."transactionId" = t.id 
		AND t.id >= $1 AND t.id <= $2
	`

	eventsResult, err := tx.Exec(eventsUpdateQuery, startId, endId)
	if err != nil {
		return 0, fmt.Errorf("failed to update events: %v", err)
	}

	eventsRowsAffected, err := eventsResult.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get events rows affected: %v", err)
	}

	// Update transfers with creation time from transactions
	transfersUpdateQuery := `
		UPDATE "Transfers" 
		SET creationtime = t.creationtime, "updatedAt" = CURRENT_TIMESTAMP
		FROM "Transactions" t
		WHERE "Transfers"."transactionId" = t.id 
		AND t.id >= $1 AND t.id <= $2
	`

	transfersResult, err := tx.Exec(transfersUpdateQuery, startId, endId)
	if err != nil {
		return 0, fmt.Errorf("failed to update transfers: %v", err)
	}

	transfersRowsAffected, err := transfersResult.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get transfers rows affected: %v", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %v", err)
	}

	totalRowsAffected := int(eventsRowsAffected + transfersRowsAffected)
	return totalRowsAffected, nil
}

func creationTimes() {
	if err := updateCreationTimes(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}
