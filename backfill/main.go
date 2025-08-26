package main

import (
	"flag"
	"go-backfill/clickhouse"
	"go-backfill/config"
	"go-backfill/run"
)

func main() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()
	config.InitEnv(*envFile)
	clickhouse.LoadCHEnv(*envFile)
	env := config.GetConfig()

	pool := config.InitDatabase()
	defer pool.Close()

	if env.IsSingleChain {
		run.RunSingleChainBackfill(pool)
	} else {
		run.RunParallelChainBackfill(pool)
	}
}
