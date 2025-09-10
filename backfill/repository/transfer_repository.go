package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type TransferAttributes struct {
	TransactionId int64     `json:"transactionId"`
	Amount        float64   `json:"amount"`
	ChainId       int       `json:"chainId"`
	FromAcct      string    `json:"from_acct"`
	ModuleHash    string    `json:"modulehash"`
	ModuleName    string    `json:"modulename"`
	RequestKey    string    `json:"requestkey"`
	ToAcct        string    `json:"to_acct"`
	HasTokenId    bool      `json:"hasTokenId"`
	TokenId       *string   `json:"tokenId"`
	Type          string    `json:"type"`
	CreationTime  string    `json:"creationtime"`
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
		("transactionId", amount, "chainId", from_acct, modulehash, modulename, requestkey, to_acct, "hasTokenId", "tokenId", "type", "creationtime", "orderIndex", "createdAt", "updatedAt", canonical)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`

	now := time.Now()

	batch := &pgx.Batch{}
	for _, transfer := range transfers {
		batch.Queue(
			query,
			transfer.TransactionId,
			transfer.Amount,
			transfer.ChainId,
			transfer.FromAcct,
			transfer.ModuleHash,
			transfer.ModuleName,
			transfer.RequestKey,
			transfer.ToAcct,
			transfer.HasTokenId,
			transfer.TokenId,
			transfer.Type,
			transfer.CreationTime,
			transfer.OrderIndex,
			now,
			now,
			true,
		)
	}

	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	// Check for errors in each batch execution
	for i := 0; i < len(transfers); i++ {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("failed to execute batch for transfer index %d: %v", i, err)
		}
	}

	return nil
}
