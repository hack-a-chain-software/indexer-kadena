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
	PayloadHash   string          `json:"payloadHash"`
	ChainId       int             `json:"chainId"`
	Module        string          `json:"module"`
	ModuleHash    string          `json:"moduleHash"`
	Name          string          `json:"name"`
	Params        json.RawMessage `json:"params"`
	ParamText     json.RawMessage `json:"paramText"`
	QualName      string          `json:"qualName"`
	RequestKey    string          `json:"requestKey"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}

func SaveEventsToDatabase(events []EventAttributes, db pgx.Tx) error {
	if len(events) == 0 {
		return nil
	}

	query := `
		INSERT INTO "Events" 
		("payloadHash", "chainId", "module", modulehash, name, params, paramtext, qualname, requestkey, "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	now := time.Now()

	batch := &pgx.Batch{}
	for _, event := range events {
		batch.Queue(
			query,
			event.PayloadHash,
			event.ChainId,
			event.Module,
			event.ModuleHash,
			event.Name,
			event.Params,
			event.ParamText,
			event.QualName,
			event.RequestKey,
			now,
			now,
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
