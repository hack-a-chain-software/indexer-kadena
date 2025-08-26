package clickhouse

import (
    ch "github.com/ClickHouse/clickhouse-go/v2"
    "context"
)

func NewClient(cfg *CHConfig) (ch.Conn, error) {
    options := &ch.Options{
        Addr: []string{cfg.ClickHouseURL},
        Auth: ch.Auth{
            Database: cfg.ClickHouseDatabase,
            Username: cfg.ClickHouseUser,
            Password: cfg.ClickHousePassword,
        },
        Settings: ch.Settings{
            "max_execution_time": 60,
        },
    }
    conn, err := ch.Open(options)
    if err != nil {
        return nil, err
    }
    if err := conn.Ping(context.Background()); err != nil {
        return nil, err
    }
    return conn, nil
}


