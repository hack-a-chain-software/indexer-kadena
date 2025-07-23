package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type TransactionAttributes struct {
	BlockId      int64           `json:"blockId"`
	ChainId      int             `json:"chainId"`
	CreationTime string          `json:"creationTime"`
	Hash         string          `json:"hash"`
	Result       json.RawMessage `json:"result"` // JSONB column
	Logs         string          `json:"logs"`
	NumEvents    int             `json:"numEvents"`
	RequestKey   string          `json:"requestKey"`
	Rollback     bool            `json:"rollback"`
	Sender       string          `json:"sender"`
	TxId         string          `json:"txId"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

type TransactionDetailsAttributes struct {
	TransactionId int64
	Code          json.RawMessage
	Continuation  json.RawMessage
	Data          json.RawMessage
	Gas           string
	GasLimit      string
	GasPrice      string
	Nonce         string
	PactId        *string
	Proof         *string
	Rollback      bool
	Sigs          json.RawMessage
	Step          int
	TTL           string
}

func SaveTransactions(db pgx.Tx, transactions []TransactionAttributes, coinbaseTx TransactionAttributes) ([]int64, error) {

	query := `
		INSERT INTO "Transactions" 
		("blockId", "chainId", creationtime, hash, result, logs, num_events, requestkey, sender, txid, "createdAt", "updatedAt", canonical)
		VALUES 
		($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id
	`

	now := time.Now()
	batch := &pgx.Batch{}

	for _, t := range transactions {
		result, err := json.Marshal(t.Result)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal result: %v", err)
		}

		batch.Queue(
			query,
			t.BlockId,
			t.ChainId,
			t.CreationTime,
			t.Hash,
			result,
			t.Logs,
			t.NumEvents,
			t.RequestKey,
			t.Sender,
			t.TxId,
			now,
			now,
			true,
		)
	}

	batch.Queue(
		query,
		coinbaseTx.BlockId,
		coinbaseTx.ChainId,
		coinbaseTx.CreationTime,
		coinbaseTx.Hash,
		coinbaseTx.Result,
		coinbaseTx.Logs,
		coinbaseTx.NumEvents,
		coinbaseTx.RequestKey,
		coinbaseTx.Sender,
		coinbaseTx.TxId,
		now,
		now,
		true,
	)

	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	transactionIds := make([]int64, 0, len(transactions)+1) // +1 for coinbase

	// Collect IDs for each queued query
	for i := 0; i < len(transactions)+1; i++ { // +1 for coinbase
		var id int64
		if err := br.QueryRow().Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to execute batch for transaction %d: %v", i, err)
		}
		transactionIds = append(transactionIds, id)
	}

	return transactionIds, nil
}

func SaveTransactionDetails(db pgx.Tx, details []TransactionDetailsAttributes, transactionIds []int64) error {

	if len(details) == 0 {
		return nil
	}

	query := `INSERT INTO "TransactionDetails" (
			"transactionId", code, continuation, data, gas, gaslimit, gasprice,
			nonce, pactid, proof, rollback, sigs, step, ttl, "createdAt", "updatedAt"
		)
		VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15, $16)
	`

	now := time.Now()
	batch := &pgx.Batch{}

	for index := 0; index < len(details); index++ {
		// Sanitize data before marshalling to prevent "unsupported Unicode escape sequence" errors.
		// PostgreSQL's JSONB type does not support null characters (\u0000), so we remove them.
		details[index].Data = bytes.ReplaceAll(details[index].Data, []byte(`\u0000`), []byte{})

		detail := details[index]
		code, err := json.Marshal(detail.Code)
		if err != nil {
			return fmt.Errorf("failed to marshal code: %v", err)
		}

		continuation, err := json.Marshal(detail.Continuation)
		if err != nil {
			return fmt.Errorf("failed to marshal continuation: %v", err)
		}

		data, err := json.Marshal(detail.Data)
		if err != nil {
			return fmt.Errorf("failed to marshal data: %v", err)
		}

		sigs, err := json.Marshal(detail.Sigs)
		if err != nil {
			return fmt.Errorf("failed to marshal sigs: %v", err)
		}

		batch.Queue(
			query,
			transactionIds[index],
			code,
			continuation,
			data,
			detail.Gas,
			detail.GasLimit,
			detail.GasPrice,
			detail.Nonce,
			detail.PactId,
			detail.Proof,
			detail.Rollback,
			sigs,
			detail.Step,
			detail.TTL,
			now,
			now,
		)
	}

	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	// Execute all queued queries
	for i := 0; i < len(details); i++ {
		if _, err := br.Exec(); err != nil {
			failedDetail := details[i]
			failedData, _ := json.MarshalIndent(failedDetail, "", "  ")
			return fmt.Errorf("failed to execute batch for transaction details %d: %v\nFailing data:\n%s", i, err, string(failedData))
		}
	}

	return nil
}