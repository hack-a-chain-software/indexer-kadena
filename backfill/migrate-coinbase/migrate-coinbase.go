package main

import (
	"database/sql"
	"flag"
	"fmt"
	"go-backfill/config"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

const (
	batchSize = 1000
	stopID    = 173921979
)

func migrateBatchTransactions(db *sql.DB, lastID int) (int, bool, error) {
	startTime := time.Now()

	tx, err := db.Begin()
	if err != nil {
		return 0, false, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Insert batch into TransactionDetails
	insertQuery := `
		INSERT INTO "TransactionDetails" (
			"transactionId", code, continuation, data, gas, gaslimit, gasprice,
			nonce, pactid, proof, rollback, sigs, step, ttl, "createdAt", "updatedAt"
		)
		SELECT 
			id, code, continuation, data, gas, gaslimit, gasprice,
			nonce, pactid, proof, rollback, sigs, step, ttl, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		FROM "Transactions"
		WHERE id > $1
		ORDER BY id ASC
		LIMIT $2
		RETURNING "transactionId";
	`

	rows, err := tx.Query(insertQuery, lastID, batchSize)
	if err != nil {
		return 0, false, fmt.Errorf("failed to execute query: %v", err)
	}
	defer rows.Close()

	var newLastID int
	var insertedCount int

	// Scan through all rows and keep the last ID
	for rows.Next() {
		if err := rows.Scan(&newLastID); err != nil {
			return 0, false, fmt.Errorf("failed to scan row: %v", err)
		}
		insertedCount++
	}

	if err := tx.Commit(); err != nil {
		return 0, false, fmt.Errorf("failed to commit transaction: %v", err)
	}

	elapsed := time.Since(startTime)
	log.Printf("Inserted %d non-coinbase transactions. Last ID: %d. Batch time: %.2fs",
		insertedCount, newLastID, elapsed.Seconds())

	hasNext := insertedCount == batchSize

	return newLastID, hasNext, nil
}

func migrateTransactionDbInformation(envFile string) error {
	config.InitEnv(envFile)
	env := config.GetConfig()

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env.DbHost, env.DbPort, env.DbUser, env.DbPassword, env.DbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Connected to database")

	lastIdInserted := 0

	hasNext := true
	for hasNext {
		newLastId, newHasNext, err := migrateBatchTransactions(db, lastIdInserted)
		if err != nil {
			return fmt.Errorf("error during batch insert: %v", err)
		}

		lastIdInserted = newLastId
		hasNext = newHasNext
		time.Sleep(100 * time.Millisecond)
		if hasNext {
			log.Printf("Progress: %.2f%%", float64(lastIdInserted)/float64(stopID)*100)
		} else {
			log.Printf("Progress: 100.00%%")
		}
	}

	log.Println("Migration completed successfully")
	return nil
}

func main() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()

	// Run the migration
	if err := migrateTransactionDbInformation(*envFile); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
}
