package run

import (
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/process"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunSingleChainBackfill(pool *pgxpool.Pool) {
	env := config.GetConfig()

	ChainId := env.ChainId
	cut := fetch.FetchCutByChainId(ChainId)

	var effectiveSyncMinHeight int
	if env.SyncMinHeight > 0 {
		effectiveSyncMinHeight = env.SyncMinHeight
	} else {
		chainGenesisHeights := config.GetMinHeights(env.Network)
		effectiveSyncMinHeight = chainGenesisHeights[ChainId]
	}

	process.StartBackfill(cut.Height, cut.Hash, ChainId, effectiveSyncMinHeight, pool)
}
