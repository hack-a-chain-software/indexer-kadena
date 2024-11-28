package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
)

type TransferAttributes struct {
	TransactionId int64     `json:"transactionId"`
	Amount        float64   `json:"amount"`
	PayloadHash   string    `json:"payloadHash"`
	ChainId       int       `json:"chainId"`
	FromAcct      string    `json:"from_acct"`
	ModuleHash    string    `json:"modulehash"`
	ModuleName    string    `json:"modulename"`
	RequestKey    string    `json:"requestkey"`
	ToAcct        string    `json:"to_acct"`
	HasTokenId    bool      `json:"hasTokenId"`
	TokenId       *string   `json:"tokenId"`
	Type          string    `json:"type"`
	ContractId    *string   `json:"contractId"`
	OrderIndex    int       `json:"orderIndex"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func SaveTransfersToDatabase(transfers []TransferAttributes, db pgx.Tx) error {
	if len(transfers) == 0 {
		return nil
	}

	query := `
		INSERT INTO "Transfers" 
		(amount, "payloadHash", "chainId", "from_acct", modulehash, modulename, requestkey, to_acct, "hasTokenId", "tokenId", "type", "contractId", "orderIndex", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	now := time.Now()

	// Use a pgx.Batch for batch execution
	batch := &pgx.Batch{}
	for _, transfer := range transfers {
		tokenIdJSON, err := json.Marshal(transfer.TokenId)
		if err != nil {
			log.Printf("Error marshaling TokenId for transfer %+v: %v\n", transfer, err)
			continue
		}

		// Queue the transfer data in the batch
		batch.Queue(
			query,
			transfer.Amount,
			transfer.PayloadHash,
			transfer.ChainId,
			transfer.FromAcct,
			transfer.ModuleHash,
			transfer.ModuleName,
			transfer.RequestKey,
			transfer.ToAcct,
			transfer.HasTokenId,
			string(tokenIdJSON),
			transfer.Type,
			transfer.ContractId,
			transfer.OrderIndex,
			now,
			now,
		)
	}

	// Execute the batch
	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	// Check for errors in each batch execution
	for i := 0; i < len(transfers); i++ {
		if _, err := br.Exec(); err != nil {
			log.Printf("Error saving transfer at index %d: %v\n", i, err)
			return fmt.Errorf("failed to execute batch for transfer index %d: %v", i, err)
		}
	}

	return nil
}
