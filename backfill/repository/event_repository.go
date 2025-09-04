package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type EventAttributes struct {
	TransactionId int64           `json:"transactionId"`
	ChainId       int             `json:"chainId"`
	Module        string          `json:"module"`
	Name          string          `json:"name"`
	Params        json.RawMessage `json:"params"`
	QualName      string          `json:"qualName"`
	RequestKey    string          `json:"requestKey"`
	OrderIndex    int             `json:"orderIndex"`
	CreationTime  string          `json:"creationtime"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}

func SaveEventsToDatabase(events []EventAttributes, db pgx.Tx) error {
	if len(events) == 0 {
		return nil
	}

	query := `
		INSERT INTO "Events" 
		("transactionId", "chainId", "module", name, params, qualname, requestkey, "creationtime", "orderIndex", "createdAt", "updatedAt", canonical)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	now := time.Now()

	batch := &pgx.Batch{}
	for _, event := range events {
		batch.Queue(
			query,
			event.TransactionId,
			event.ChainId,
			event.Module,
			event.Name,
			event.Params,
			event.QualName,
			event.RequestKey,
			event.CreationTime,
			event.OrderIndex,
			now,
			now,
			true,
		)
	}

	br := db.SendBatch(context.Background(), batch)
	defer br.Close()

	for i := 0; i < len(events); i++ {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("failed to execute batch for event %d: %v", i, err)
		}
	}

	return nil
}
