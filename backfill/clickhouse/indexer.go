package clickhouse

import (
    "context"
    "encoding/json"
    "fmt"
    ch "github.com/ClickHouse/clickhouse-go/v2"
)

type TxCodeRow struct {
    ID           uint64 `json:"id"`
    RequestKey   string `json:"requestKey"`
    ChainID      uint16 `json:"chainId"`
    CreationTime uint64 `json:"creationTime"`
    Height       uint64 `json:"height"`
    Canonical    uint8  `json:"canonical"`
    Sender       string `json:"sender"`
    Gas          string `json:"gas"`
    GasLimit     string `json:"gasLimit"`
    GasPrice     string `json:"gasPrice"`
    Code         string `json:"code"`
}

func EnsureDDL(ctx context.Context, conn ch.Conn) error {
    ddl := `
      CREATE TABLE IF NOT EXISTS transactions_code_v1
      (
        id UInt64,
        requestKey String,
        chainId UInt16,
        creationTime UInt64,
        height UInt64,
        canonical UInt8,
        sender LowCardinality(String),
        gas String,
        gasLimit String,
        gasPrice String,
        code String,
        INDEX idx_code_ngram code TYPE ngrambf_v1(3, 256, 2, 0) GRANULARITY 4
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(toDateTime(creationTime))
      ORDER BY (creationTime, id)
      SETTINGS index_granularity = 8192
    `
    return conn.Exec(ctx, ddl)
}

func BulkInsert(ctx context.Context, conn ch.Conn, rows []TxCodeRow) error {
    if len(rows) == 0 {
        return nil
    }
    batch, err := conn.PrepareBatch(ctx, "INSERT INTO transactions_code_v1")
    if err != nil {
        return err
    }
    for _, r := range rows {
        if err := batch.Append(
            r.ID,
            r.RequestKey,
            r.ChainID,
            r.CreationTime,
            r.Height,
            r.Canonical,
            r.Sender,
            r.Gas,
            r.GasLimit,
            r.GasPrice,
            r.Code,
        ); err != nil {
            return err
        }
    }
    return batch.Send()
}

func MarshalCode(input json.RawMessage) (string, error) {
    if len(input) == 0 {
        return "", nil
    }
    var any interface{}
    if err := json.Unmarshal(input, &any); err != nil {
        return "", fmt.Errorf("marshal code: %w", err)
    }
    buf, err := json.Marshal(any)
    if err != nil {
        return "", fmt.Errorf("marshal code: %w", err)
    }
    return string(buf), nil
}


