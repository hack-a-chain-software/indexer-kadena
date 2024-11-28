package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type TransactionAttributes struct {
	BlockId      int64           `json:"blockId"`
	PayloadHash  string          `json:"payloadHash"`
	Code         json.RawMessage `json:"code"` // JSONB column
	Data         json.RawMessage `json:"data"` // JSONB column
	ChainId      int             `json:"chainId"`
	CreationTime string          `json:"creationTime"`
	GasLimit     string          `json:"gasLimit"`
	GasPrice     string          `json:"gasPrice"`
	Hash         string          `json:"hash"`
	Nonce        string          `json:"nonce"`
	PactId       string          `json:"pactId"`
	Continuation json.RawMessage `json:"continuation"` // JSONB column
	Gas          string          `json:"gas"`
	Result       json.RawMessage `json:"result"` // JSONB column
	Logs         json.RawMessage `json:"logs"`
	Metadata     json.RawMessage `json:"metadata"` // JSONB column
	NumEvents    int             `json:"numEvents"`
	RequestKey   string          `json:"requestKey"`
	Rollback     bool            `json:"rollback"`
	Sender       string          `json:"sender"`
	Sigs         json.RawMessage `json:"sigs"` // JSONB column
	Step         int             `json:"step"`
	TTL          string          `json:"ttl"`
	TxId         string          `json:"txId"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

func SaveTransactions(db pgx.Tx, transactions []TransactionAttributes) ([]int64, error) {
	if len(transactions) == 0 {
		return nil, nil
	}

	query := `
		INSERT INTO "Transactions" 
		("blockId", "payloadHash", code, data, "chainId", creationtime, gaslimit, gasprice, hash, nonce, pactid, continuation, gas, result, logs, metadata, num_events, requestkey, rollback, sender, sigs, step, ttl, txid, "createdAt", "updatedAt")
		VALUES 
		($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17, $18, $19, $20, $21::jsonb, $22, $23, $24, $25, $26)
		RETURNING id
	`

	now := time.Now()
	batch := &pgx.Batch{}

	for _, t := range transactions {
		// Marshal JSON fields
		code, err := json.Marshal(t.Code)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal code: %v", err)
		}

		data, err := json.Marshal(t.Data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal data: %v", err)
		}

		continuation, err := json.Marshal(t.Continuation)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal continuation: %v", err)
		}

		result, err := json.Marshal(t.Result)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal result: %v", err)
		}

		sigs, err := json.Marshal(t.Sigs)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal sigs: %v", err)
		}

		// Add the query to the batch
		batch.Queue(
			query,
			t.BlockId,
			t.PayloadHash,
			code,
			data,
			t.ChainId,
			t.CreationTime,
			t.GasLimit,
			t.GasPrice,
			t.Hash,
			t.Nonce,
			t.PactId,
			continuation,
			t.Gas,
			result,
			t.Logs,
			t.Metadata,
			t.NumEvents,
			t.RequestKey,
			t.Rollback,
			t.Sender,
			sigs,
			t.Step,
			t.TTL,
			t.TxId,
			now,
			now,
		)
	}

	// Send the batch to the database
	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	transactionIds := make([]int64, 0, len(transactions))

	// Collect IDs for each queued query
	for i := 0; i < len(transactions); i++ {
		var id int64
		if err := br.QueryRow().Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to execute batch for transaction %d: %v", i, err)
		}
		transactionIds = append(transactionIds, id)
	}

	return transactionIds, nil
}
