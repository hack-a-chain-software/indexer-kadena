package main

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"go-backfill/config"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

const (
	batchSize  = 1000
	maxBlockId = 113630897
	baseAPIURL = "https://api.chainweb.com/chainweb/0.0/mainnet01"
)

type ReconcileResult struct {
	PayloadHash string
	ChainId     int
	BlockId     int
}

type TransferData struct {
	TransactionId int
	Type          string
	Amount        string
	ChainId       int
	FromAcct      string
	ModuleHash    string
	ModuleName    string
	RequestKey    string
	ToAcct        string
	HasTokenId    bool
	TokenId       string
	OrderIndex    int
}

// Transaction types from process_payloads.go
type Event struct {
	Params     []interface{} `json:"params"`
	Name       string        `json:"name"`
	Module     Module        `json:"module"`
	ModuleHash string        `json:"moduleHash"`
}

type Module struct {
	Namespace *string `json:"namespace"`
	Name      string  `json:"name"`
}

type DecodedTransaction struct {
	Hash         string          `json:"hash"`
	Sigs         json.RawMessage `json:"sigs"`
	Cmd          json.RawMessage `json:"cmd"`
	Gas          int             `json:"gas"`
	Result       json.RawMessage `json:"result"`
	ReqKey       string          `json:"reqKey"`
	Logs         string          `json:"logs"`
	Events       []Event         `json:"events"`
	Continuation json.RawMessage `json:"continuation"`
	Step         int             `json:"step"`
	TTL          string          `json:"ttl"`
	TxId         int             `json:"txId"`
}

// Correct payload response from API
type PayloadAPIResponse struct {
	Transactions     [][2]string `json:"transactions"`
	MinerData        string      `json:"minerData"`
	TransactionsHash string      `json:"transactionsHash"`
	OutputsHash      string      `json:"outputsHash"`
	PayloadHash      string      `json:"payloadHash"`
}

// Transaction parts for decoding
type TransactionPart0 struct {
	Hash string          `json:"hash"`
	Sigs json.RawMessage `json:"sigs"`
	Cmd  json.RawMessage `json:"cmd"`
}

type TransactionPart1 struct {
	Gas          int             `json:"gas"`
	Result       json.RawMessage `json:"result"`
	ReqKey       string          `json:"reqKey"`
	Logs         string          `json:"logs"`
	Events       []Event         `json:"events"`
	Continuation json.RawMessage `json:"continuation"`
	TxId         int             `json:"txId"`
}

func reconcile() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()
	config.InitEnv(*envFile)
	env := config.GetConfig()
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env.DbHost, env.DbPort, env.DbUser, env.DbPassword, env.DbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database")

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Process reconcile events in batches
	if err := processReconcileEvents(db); err != nil {
		log.Fatalf("Failed to process reconcile events: %v", err)
	}

	log.Println("Finished processing reconcile events")
}

func processReconcileEvents(db *sql.DB) error {
	var lastBlockId int
	totalProcessed := 0

	// log.Printf("Starting reconcile events processing from block ID 1 to %d", maxBlockId)

	httpClient := &http.Client{
		Timeout: 30 * time.Second,
	}

	for {
		results, maxBlockIdFromBatch, err := fetchReconcileEventsBatch(db, lastBlockId, batchSize)
		if err != nil {
			return fmt.Errorf("failed to fetch batch: %v", err)
		}

		// If no results, we're done
		if len(results) == 0 {
			// log.Printf("No more records to process. Total processed: %d (100.0%%)", totalProcessed)
			break
		}

		// Calculate progress percentage
		progress := float64(lastBlockId) / float64(maxBlockId) * 100.0

		// Process the batch
		log.Printf("Processing batch of %d records (block ID: %d, progress: %.1f%%)", len(results), lastBlockId, progress)

		// Fetch payload data and extract request keys for each result
		var allTransfers []TransferData
		for _, result := range results {
			transfers, err := processPayloadAndExtractRequestKeys(httpClient, db, result.PayloadHash, result.ChainId, result.BlockId)
			if err != nil {
				log.Printf("Error processing payload %s on chain %d: %v", result.PayloadHash, result.ChainId, err)
				continue
			}
			allTransfers = append(allTransfers, transfers...)
		}

		// Insert all transfers in a single database transaction
		if len(allTransfers) > 0 {
			err := insertTransfers(db, allTransfers)
			if err != nil {
				log.Printf("Error inserting transfers: %v", err)
			} else {
				log.Printf("Successfully inserted %d transfers", len(allTransfers))
			}
		}

		totalProcessed += len(results)
		lastBlockId = maxBlockIdFromBatch

		// If we got less than batchSize, we're likely done
		if len(results) < batchSize {
			// finalProgress := float64(lastBlockId) / float64(maxBlockId) * 100.0
			// log.Printf("Last batch processed. Total processed: %d (%.1f%%)", totalProcessed, finalProgress)
			break
		}
	}

	return nil
}

func fetchReconcileEventsBatch(db *sql.DB, lastBlockId int, limit int) ([]ReconcileResult, int, error) {
	query := `
		SELECT DISTINCT b."payloadHash", b."chainId", b.id
		FROM "Events" e
		JOIN public."Transactions" t ON t.id = e."transactionId"
		JOIN "Blocks" b ON t."blockId" = b.id
		WHERE e.name = 'RECONCILE' 
		AND (e.module = 'marmalade.ledger' OR e.module = 'marmalade-v2.ledger')
		AND b.id > $1
		ORDER BY b.id
		LIMIT $2
	`

	rows, err := db.Query(query, lastBlockId, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to execute query: %v", err)
	}
	defer rows.Close()

	var results []ReconcileResult
	var maxBlockId int

	for rows.Next() {
		var result ReconcileResult

		if err := rows.Scan(&result.PayloadHash, &result.ChainId, &result.BlockId); err != nil {
			return nil, 0, fmt.Errorf("failed to scan row: %v", err)
		}

		results = append(results, result)
		if result.BlockId > maxBlockId {
			maxBlockId = result.BlockId
		}
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating rows: %v", err)
	}

	return results, maxBlockId, nil
}

func processPayloadAndExtractRequestKeys(client *http.Client, db *sql.DB, payloadHash string, chainId int, blockId int) ([]TransferData, error) {
	// Use the payload endpoint to get transaction arrays
	url := fmt.Sprintf("%s/chain/%d/payload/%s/outputs", baseAPIURL, chainId, payloadHash)

	// Make HTTP request
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status code %d", resp.StatusCode)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Parse as the correct Payload structure
	var apiResponse PayloadAPIResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	var transfers []TransferData

	// Process each transaction array [part0, part1]
	for i, transactionParts := range apiResponse.Transactions {
		if len(transactionParts) != 2 {
			log.Printf("Transaction %d parts length is not 2, skipping", i)
			continue
		}

		// Extract reqKey and events from the second part (transactionParts[1])
		reqKey, events, err := extractRequestKeyAndEventsFromTransactionPart(transactionParts[1])
		if err != nil {
			log.Printf("Error extracting data from transaction %d: %v", i, err)
			continue
		}

		// Filter and collect RECONCILE events
		for orderIndex, event := range events {
			if event.Name == "RECONCILE" && (*event.Module.Namespace == "marmalade-v2" || *event.Module.Namespace == "marmalade") {
				// Handle module name with namespace if present
				moduleName := event.Module.Name
				if event.Module.Namespace != nil {
					moduleName = *event.Module.Namespace + "." + event.Module.Name
				}

				// Extract additional properties from params
				var amount, tokenId, fromAcct, toAcct string
				if len(event.Params) >= 4 {
					// tokenId: params[0]
					if tokenIdVal, ok := event.Params[0].(string); ok {
						tokenId = tokenIdVal
					}

					// amount: params[1]
					if amountVal := event.Params[1]; amountVal != nil {
						amount = fmt.Sprintf("%v", amountVal)
					}

					// from_acct: params[2].account
					if params2, ok := event.Params[2].(map[string]interface{}); ok {
						if accountVal, ok := params2["account"].(string); ok {
							fromAcct = accountVal
						}
					}

					// to_acct: params[3].account
					if params3, ok := event.Params[3].(map[string]interface{}); ok {
						if accountVal, ok := params3["account"].(string); ok {
							toAcct = accountVal
						}
					}
				}

				// Get transaction ID from database using reqKey and the specific blockId we're processing
				transactionId, err := getTransactionId(db, reqKey, blockId)
				if err != nil {
					log.Printf("Error getting transaction ID for reqKey %s: %v", reqKey, err)
					continue
				}

				// Create transfer data
				transfer := TransferData{
					TransactionId: transactionId,
					Type:          "poly-fungible",
					Amount:        amount,
					ChainId:       chainId,
					FromAcct:      fromAcct,
					ModuleHash:    event.ModuleHash,
					ModuleName:    moduleName,
					RequestKey:    reqKey,
					ToAcct:        toAcct,
					HasTokenId:    true,
					TokenId:       tokenId,
					OrderIndex:    orderIndex,
				}

				transfers = append(transfers, transfer)
			}
		}
	}

	return transfers, nil
}

func extractRequestKeyAndEventsFromTransactionPart(transactionPart string) (string, []Event, error) {
	// Decode the base64 transaction part
	decodedData, err := decodeBase64(transactionPart)
	if err != nil {
		return "", nil, fmt.Errorf("failed to decode base64 transaction part: %v", err)
	}

	// Parse as transaction part 1 (should contain reqKey and events)
	var part1 TransactionPart1
	if err := json.Unmarshal(decodedData, &part1); err != nil {
		return "", nil, fmt.Errorf("failed to parse transaction part JSON: %v", err)
	}

	return part1.ReqKey, part1.Events, nil
}

func decodeBase64(encodedData string) ([]byte, error) {
	// Normalize the input by ensuring proper padding
	encodedData = ensureBase64Padding(encodedData)

	// Attempt decoding using both standard and URL-safe Base64 encodings
	var decodedData []byte
	var err error

	decodedData, err = base64.StdEncoding.DecodeString(encodedData)
	if err != nil {
		decodedData, err = base64.URLEncoding.DecodeString(encodedData)
		if err != nil {
			return nil, fmt.Errorf("error decoding base64 data using both standard and URL-safe encodings: %w", err)
		}
	}

	return decodedData, nil
}

// ensureBase64Padding adds missing padding to a Base64 string if necessary.
func ensureBase64Padding(base64Str string) string {
	missingPadding := len(base64Str) % 4
	if missingPadding > 0 {
		padding := strings.Repeat("=", 4-missingPadding)
		base64Str += padding
	}
	return base64Str
}

func getTransactionId(db *sql.DB, reqKey string, blockId int) (int, error) {
	query := `
		SELECT t.id
		FROM "Transactions" t
		WHERE t.requestkey = $1 AND t."blockId" = $2
		LIMIT 1
	`

	var transactionId int
	err := db.QueryRow(query, reqKey, blockId).Scan(&transactionId)
	if err != nil {
		return 0, fmt.Errorf("failed to find transaction for reqKey %s in block %d: %v", reqKey, blockId, err)
	}

	return transactionId, nil
}

func insertTransfers(db *sql.DB, transfers []TransferData) error {
	// Begin database transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback() // Will be ignored if tx.Commit() succeeds

	// Prepare the insert statement
	stmt, err := tx.Prepare(`
		INSERT INTO "Transfers" (
			"transactionId", type, amount, "chainId", from_acct, 
			modulehash, modulename, requestkey, to_acct, 
			"hasTokenId", "tokenId", "orderIndex"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %v", err)
	}
	defer stmt.Close()

	// Insert each transfer
	for _, transfer := range transfers {
		_, err := stmt.Exec(
			transfer.TransactionId,
			transfer.Type,
			transfer.Amount,
			transfer.ChainId,
			transfer.FromAcct,
			transfer.ModuleHash,
			transfer.ModuleName,
			transfer.RequestKey,
			transfer.ToAcct,
			transfer.HasTokenId,
			transfer.TokenId,
			transfer.OrderIndex,
		)
		if err != nil {
			return fmt.Errorf("failed to insert transfer: %v", err)
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}
