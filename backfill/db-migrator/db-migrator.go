package main

import (
	"database/sql"
	"fmt"
	"go-backfill/config"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

const (
	batchSizeTransactions = 50
)

func updateTransactionCounters() error {
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

	// Get min and max transaction IDs
	var minID, maxID int
	err = db.QueryRow(`
		SELECT MIN(t.id), MAX(t.id)
		FROM "Transactions" t
		JOIN "Blocks" b ON b.id = t."blockId"
		WHERE t.sender != 'coinbase'
		AND b.canonical = true
	`).Scan(&minID, &maxID)
	if err != nil {
		return fmt.Errorf("failed to get transaction ID range: %v", err)
	}

	log.Printf("Processing transactions from ID %d to %d", maxID, minID)
	totalTransactions := maxID - minID + 1
	log.Printf("Total transactions to process: %d", totalTransactions)

	// Process transactions in batches
	if err := processTransactionsBatchTx(db, minID, maxID); err != nil {
		return fmt.Errorf("failed to process transactions: %v", err)
	}

	log.Println("Successfully updated all transaction counters")
	return nil
}

func processTransactionsBatchTx(db *sql.DB, minID, maxID int) error {
	currentID := maxID
	totalProcessed := 0
	totalTransactions := maxID - minID + 1
	lastProgressPrinted := -1.0

	for currentID >= minID {
		// Calculate batch start (going backwards)
		batchStart := currentID - batchSizeTransactions + 1
		if batchStart < minID {
			batchStart = minID
		}

		// Process this batch
		processed, err := processBatchTx(db, batchStart, currentID)
		if err != nil {
			return fmt.Errorf("failed to process batch %d-%d: %v", batchStart, currentID, err)
		}

		totalProcessed += processed

		// Calculate progress percentage
		transactionsProcessed := maxID - currentID + 1
		progressPercent := (float64(transactionsProcessed) / float64(totalTransactions)) * 100.0

		// Only print progress if it has increased by at least 0.1%
		if progressPercent-lastProgressPrinted >= 0.1 {
			log.Printf("Progress: %.1f%%", progressPercent)
			lastProgressPrinted = progressPercent
		}

		// Move to next batch
		currentID = batchStart - 1
	}

	log.Printf("Completed processing. Total records updated: %d (100.0%%)", totalProcessed)
	return nil
}

func processBatchTx(db *sql.DB, startID, endID int) (int, error) {
	// First collect all the counts
	countsQuery := `
		SELECT t.sender, t."chainId", e.module, COUNT(*)::int as cnt
		FROM "Transactions" t
		JOIN "Events" e ON e."transactionId" = t.id
		JOIN "Blocks" b ON b.id = t."blockId"
		WHERE t.id >= $1 AND t.id <= $2
		AND t.sender != 'coinbase'
		AND b.canonical = true
		GROUP BY t.sender, t."chainId", e.module
	`

	type counterUpdate struct {
		sender  string
		chainID int
		module  string
		count   int
	}

	// Collect all updates first
	rows, err := db.Query(countsQuery, startID, endID)
	if err != nil {
		return 0, fmt.Errorf("failed to query transaction counts: %v", err)
	}
	defer rows.Close()

	var updates []counterUpdate
	for rows.Next() {
		var update counterUpdate
		if err := rows.Scan(&update.sender, &update.chainID, &update.module, &update.count); err != nil {
			return 0, fmt.Errorf("failed to scan row: %v", err)
		}
		updates = append(updates, update)
	}

	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("error iterating rows: %v", err)
	}

	// Now process all updates in a single transaction
	tx, err := db.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback() // Will be ignored if tx.Commit() succeeds

	totalUpdated := 0
	// Prepare the statement for better performance
	stmt, err := tx.Prepare(`
		INSERT INTO "TransactionCounters" (sender, "chainId", module, counter)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (sender, "chainId", module)
		DO UPDATE SET counter = "TransactionCounters".counter + EXCLUDED.counter
	`)
	if err != nil {
		return 0, fmt.Errorf("failed to prepare statement: %v", err)
	}
	defer stmt.Close()

	for _, update := range updates {
		result, err := stmt.Exec(update.sender, update.chainID, update.module, update.count)
		if err != nil {
			return totalUpdated, fmt.Errorf("failed to update counter: %v", err)
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return totalUpdated, fmt.Errorf("failed to get rows affected: %v", err)
		}

		totalUpdated += int(rowsAffected)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return totalUpdated, nil
}

func MakeTxCounters() {
	start := time.Now()
	if err := updateTransactionCounters(); err != nil {
		log.Fatalf("Error: %v", err)
	}
	elapsed := time.Since(start)
	log.Printf("Total execution time: %v", elapsed)
}
