package main

import (
    "context"
    "flag"
    "log"
    chpkg "go-backfill/clickhouse"
    "go-backfill/config"
    "go-backfill/repository"
)

func main() {
    envFile := flag.String("env", ".env", "Path to the .env file")
    batch := flag.Int("batch", 5000, "Batch size")
    flag.Parse()

    config.InitEnv(*envFile)
    chpkg.LoadCHEnv(*envFile)

    env := config.GetConfig()
    if chpkg.GetCHConfig().ClickHouseURL == "" {
        log.Fatal("CLICKHOUSE_URL not set; aborting repair")
    }

    pool := config.InitDatabase()
    defer pool.Close()

    ch, err := chpkg.NewClient(chpkg.GetCHConfig())
    if err != nil {
        log.Fatalf("clickhouse connect: %v", err)
    }
    if err := chpkg.EnsureDDL(context.Background(), ch); err != nil {
        log.Fatalf("clickhouse DDL: %v", err)
    }

    var lastTdID int64 = 0
    for {
        rows, err := repository.FetchUnindexedBatch(pool, lastTdID, *batch)
        if err != nil {
            log.Fatalf("fetch batch: %v", err)
        }
        if len(rows) == 0 {
            log.Println("repair complete")
            return
        }

        payload := make([]chpkg.TxCodeRow, 0, len(rows))
        tdIDs := make([]int64, 0, len(rows))
        for _, r := range rows {
            code, _ := chpkg.MarshalCode(r.Code)
            payload = append(payload, chpkg.TxCodeRow{
                ID:           uint64(r.TxID),
                RequestKey:   r.RequestKey,
                ChainID:      uint16(r.ChainID),
                CreationTime: uint64(parseUint64(r.CreationTime)),
                Height:       uint64(r.Height),
                Canonical:    boolToUint8(r.Canonical),
                Sender:       r.Sender,
                Gas:          r.Gas,
                GasLimit:     r.GasLimit,
                GasPrice:     r.GasPrice,
                Code:         code,
            })
            tdIDs = append(tdIDs, r.TdID)
            lastTdID = r.TdID
        }

        if err := chpkg.BulkInsert(context.Background(), ch, payload); err != nil {
            log.Printf("[CH][INSERT][ERROR] %v", err)
            continue
        }
        if err := repository.MarkIndexedByTdIDs(pool, tdIDs); err != nil {
            log.Printf("[PG][FLAG][ERROR] %v", err)
        }
        log.Printf("indexed %d rows up to td.id=%d", len(rows), lastTdID)
        if env.IsSingleChain {
            break
        }
    }
}

func parseUint64(s string) uint64 {
    var out uint64
    for i := 0; i < len(s); i++ {
        out = out*10 + uint64(s[i]-'0')
    }
    return out
}

func boolToUint8(b bool) uint8 { if b { return 1 }; return 0 }


