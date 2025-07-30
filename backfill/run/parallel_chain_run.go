package run

import (
	"context"
	"fmt"
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/process"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/semaphore"
)

const maxConcurrency = 4

func RunParallelChainBackfill(pool *pgxpool.Pool) {
	env := config.GetConfig()
	cuts := fetch.FetchCuts()
	chainGenesisHeights := config.GetMinHeights(env.Network)

	startTime := time.Now()
	var wg sync.WaitGroup
	sem := semaphore.NewWeighted(maxConcurrency)

	for chainIDStr, cutInfo := range cuts.Hashes {
		chainID, err := strconv.Atoi(chainIDStr)
		if err != nil {
			log.Printf("Invalid chain ID %s, skipping", chainIDStr)
			continue
		}

		if chainID < 0 || chainID > 19 {
			continue
		}

		if err := sem.Acquire(context.Background(), 1); err != nil {
			log.Fatalf("Failed to acquire semaphore: %v", err)
		}

		wg.Add(1)
		go func(id int, height int, hash string) {
			defer wg.Done()
			defer sem.Release(1)

			var effectiveSyncMinHeight int
			if env.SyncMinHeight > 0 {
				effectiveSyncMinHeight = env.SyncMinHeight
			} else {
				effectiveSyncMinHeight = chainGenesisHeights[id]
			}

			fmt.Printf("Starting backfill for chain %d from height %d\n", id, height)
			process.StartBackfill(height, hash, id, effectiveSyncMinHeight, pool)
		}(chainID, cutInfo.Height, cutInfo.Hash)
	}

	wg.Wait()

	log.Printf("Backfill process completed in %fs\n", time.Since(startTime).Seconds())
}
