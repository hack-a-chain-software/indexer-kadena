package repository

import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
)

type UnindexedRow struct {
    TdID         int64           `json:"tdId"`
    TxID         int64           `json:"txId"`
    RequestKey   string          `json:"requestKey"`
    ChainID      int             `json:"chainId"`
    CreationTime string          `json:"creationTime"`
    Height       int64           `json:"height"`
    Canonical    bool            `json:"canonical"`
    Sender       string          `json:"sender"`
    Gas          string          `json:"gas"`
    GasLimit     string          `json:"gasLimit"`
    GasPrice     string          `json:"gasPrice"`
    Code         json.RawMessage `json:"code"`
}

func FetchUnindexedBatch(pool *pgxpool.Pool, lastTdID int64, limit int) ([]UnindexedRow, error) {
    query := `
      SELECT td.id as "tdId", t.id as "txId", t.requestkey as "requestKey", t."chainId" as "chainId",
             t.creationtime as "creationTime", b.height as height, b.canonical as canonical, t.sender as sender,
             td.gas as gas, td.gaslimit as "gasLimit", td.gasprice as "gasPrice", td.code as code
      FROM "TransactionDetails" td
      JOIN "Transactions" t ON t.id = td."transactionId"
      JOIN "Blocks" b ON b.id = t."blockId"
      WHERE td.id > $1 AND td.code_indexed = false AND t.sender != 'coinbase'
      ORDER BY td.id ASC
      LIMIT $2
    `

    rows, err := pool.Query(context.Background(), query, lastTdID, limit)
    if err != nil {
        return nil, fmt.Errorf("query unindexed batch: %w", err)
    }
    defer rows.Close()

    var result []UnindexedRow
    for rows.Next() {
        var r UnindexedRow
        if err := rows.Scan(&r.TdID, &r.TxID, &r.RequestKey, &r.ChainID, &r.CreationTime, &r.Height, &r.Canonical, &r.Sender, &r.Gas, &r.GasLimit, &r.GasPrice, &r.Code); err != nil {
            return nil, fmt.Errorf("scan unindexed: %w", err)
        }
        result = append(result, r)
    }
    return result, nil
}

func MarkIndexedByTdIDs(pool *pgxpool.Pool, tdIDs []int64) error {
    if len(tdIDs) == 0 {
        return nil
    }
    query := `UPDATE "TransactionDetails" SET code_indexed = true WHERE id = ANY($1::bigint[])`
    if _, err := pool.Exec(context.Background(), query, tdIDs); err != nil {
        return fmt.Errorf("mark indexed: %w", err)
    }
    return nil
}


