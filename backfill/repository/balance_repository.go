package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type BalanceAttributes struct {
	ChainId    int       `json:"chainId"`
	Account    string    `json:"account"`
	Module     string    `json:"module"`
	HasTokenId bool      `json:"hasTokenId"`
	TokenId    string    `json:"tokenId"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func SaveBalancesToDatabase(balances []BalanceAttributes, db pgx.Tx) error {
	if len(balances) == 0 {
		return nil
	}

	query := `
		INSERT INTO "Balances"
		("chainId", "account", "module", "hasTokenId", "tokenId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT ("chainId", "account", "module", "tokenId") DO NOTHING
	`

	now := time.Now()
	batch := &pgx.Batch{}

	for _, balance := range balances {
		batch.Queue(
			query,
			balance.ChainId,
			balance.Account,
			balance.Module,
			balance.HasTokenId,
			balance.TokenId,
			now,
			now,
		)
	}

	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	// Check for errors in each batch execution
	for i := 0; i < len(balances); i++ {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("failed to execute batch for balance index %d: %v", i, err)
		}
	}

	return nil
}
