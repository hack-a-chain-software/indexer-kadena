package process

import (
	"go-backfill/config"
	"go-backfill/fetch"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func StartBackfill(LastHeight int, Hash string, ChainId int, SyncMinHeight int, db *pgxpool.Pool) {
	env := config.GetConfig()

	network := env.Network
	AverageTime := 0.0
	CurrentHeight := LastHeight

	log.Printf("Starting backfill process: %s, %d, %d\n", Hash, LastHeight, SyncMinHeight)

	for CurrentHeight >= SyncMinHeight {
		startTime := time.Now()

		var nextHeight int
		if CurrentHeight == SyncMinHeight {
			nextHeight = SyncMinHeight
		} else {
			nextHeight = Max(CurrentHeight-env.SyncFetchIntervalInBlocks+1, SyncMinHeight)
		}

		log.Printf("Processing height %d to %d...\n", CurrentHeight, nextHeight)

		blocks, err := fetch.FetchPayloadsWithHeaders(network, ChainId, Hash, nextHeight, CurrentHeight)
		if err != nil {
			log.Fatalf("Error fetching payloads for chain %d, height %d to %d: %v\n", ChainId, nextHeight, CurrentHeight, err)
		}

		processedPayloads, err := fetch.ProcessPayloads(blocks)
		if err != nil {
			log.Fatalf("Error processing payloads for chain %d, height %d to %d: %v\n", ChainId, nextHeight, CurrentHeight, err)
		}

		counters, dataSizeTracker, err := savePayloads(network, ChainId, processedPayloads, db)
		if err != nil {
			log.Fatalf("Error saving payloads for chain %d, height %d to %d -> %v\n", ChainId, nextHeight, CurrentHeight, err)
		}

		if env.IsDevelopment {
			time.Sleep(5 * time.Second)
		}

		// Update the current height
		CurrentHeight = nextHeight - 1

		// Calculate duration and progress
		duration := time.Since(startTime)
		progress := 100.0 * float64(LastHeight-CurrentHeight) / float64(LastHeight-SyncMinHeight+1)

		// Log progress and stats
		log.Printf("(%.2f%%) Processed chain %d in %fs\n", progress, ChainId, duration.Seconds())
		log.Printf("Counters: %d transactions, %d transfers, %d events, %d signers\n", counters.Transactions, counters.Transfers, counters.Events, counters.Signers)
		log.Printf("Transactions: %d KB, Transfers: %d KB, Events: %d KB, Signers: %d KB\n", dataSizeTracker.TransactionsKB, dataSizeTracker.TransfersKB, dataSizeTracker.EventsKB, dataSizeTracker.SignersKB)

		// Update average time
		AverageTime = (AverageTime + duration.Seconds()) / 2
		log.Printf("Average time: %f\n", AverageTime)
	}

	log.Printf("Backfill process completed for chain %d.\n", ChainId)
}
