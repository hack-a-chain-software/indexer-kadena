package clickhouse

import (
    "log"
    "os"
    "strconv"

    "github.com/joho/godotenv"
)

type CHConfig struct {
    ClickHouseURL               string
    ClickHouseUser              string
    ClickHousePassword          string
    ClickHouseDatabase          string
    Network                     string
    ChainId                     int
    SyncBaseUrl                 string
    SyncMinHeight               int
    SyncFetchIntervalInBlocks   int
    SyncAttemptsMaxRetry        int
    SyncAttemptsIntervalInMs    int
    IsSingleChain               bool
}

var chConfig *CHConfig

func LoadCHEnv(envFilePath string) {
    _ = godotenv.Load(envFilePath)

    chConfig = &CHConfig{
        ClickHouseURL:             getEnvSoft("CLICKHOUSE_URL"),
        ClickHouseUser:            getEnvSoft("CLICKHOUSE_USER"),
        ClickHousePassword:        getEnvSoft("CLICKHOUSE_PASSWORD"),
        ClickHouseDatabase:        getEnvSoft("CLICKHOUSE_DATABASE"),
        Network:                   getEnvHard("NETWORK"),
        ChainId:                   getEnvAsIntSoft("CHAIN_ID"),
        SyncBaseUrl:               getEnvHard("SYNC_BASE_URL"),
        SyncMinHeight:             getEnvAsIntSoft("SYNC_MIN_HEIGHT"),
        SyncFetchIntervalInBlocks: getEnvAsIntSoft("SYNC_FETCH_INTERVAL_IN_BLOCKS"),
        SyncAttemptsMaxRetry:      getEnvAsIntSoft("SYNC_ATTEMPTS_MAX_RETRY"),
        SyncAttemptsIntervalInMs:  getEnvAsIntSoft("SYNC_ATTEMPTS_INTERVAL_IN_MS"),
        IsSingleChain:             getEnvAsBoolSoft("IS_SINGLE_CHAIN_RUN"),
    }
}

func GetCHConfig() *CHConfig {
    if chConfig == nil {
        log.Fatal("CH config not initialized. Call LoadCHEnv first.")
    }
    return chConfig
}

func getEnvHard(key string) string {
    v := os.Getenv(key)
    if v == "" {
        log.Fatalf("Environment variable %s is required but not set", key)
    }
    return v
}

func getEnvSoft(key string) string {
    return os.Getenv(key)
}

func getEnvAsIntSoft(key string) int {
    v := os.Getenv(key)
    if v == "" {
        return 0
    }
    i, err := strconv.Atoi(v)
    if err != nil {
        log.Fatalf("Environment variable %s must be an integer, but got: %s", key, v)
    }
    return i
}

func getEnvAsBoolSoft(key string) bool {
    v := os.Getenv(key)
    if v == "" {
        return false
    }
    b, err := strconv.ParseBool(v)
    if err != nil {
        log.Fatalf("Environment variable %s must be a boolean, but got: %s", key, v)
    }
    return b
}


