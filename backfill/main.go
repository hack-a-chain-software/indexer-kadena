package main

import (
	"flag"
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/process"
)

func main() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()
	config.InitEnv(*envFile)
	env := config.GetConfig()

	pool := config.InitDatabase()
	defer pool.Close()

	go config.StartMemoryMonitoring()
	cut := fetch.FetchCut()
	ChainId := env.ChainId

	var effectiveSyncMinHeight int
	if env.SyncMinHeight > 0 {
		effectiveSyncMinHeight = env.SyncMinHeight
	} else {
		chainGenesisHeights := config.GetMinHeights(env.Network)
		effectiveSyncMinHeight = chainGenesisHeights[ChainId]
	}

	process.StartBackfill(cut.Height, cut.Hash, ChainId, effectiveSyncMinHeight, pool)
}
