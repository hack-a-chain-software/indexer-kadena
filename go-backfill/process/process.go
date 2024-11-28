package process

import (
	"fmt"
	"go-backfill/config"
	"go-backfill/fetch"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Chain struct {
	ChainId       int
	CurrentHeight int
}

func StartBackfill(network string, chain Chain, db *pgxpool.Pool) {
	env := config.LoadEnv()
	log.Println("Starting backfill process...")

	AverageTime := 0.0

	for chain.CurrentHeight > env.SyncMinHeight {
		log.Printf("Processing chain: %v\n", chain)
		startTime := time.Now()
		nextHeight := max(chain.CurrentHeight-env.SyncFetchIntervalInBlocks, env.SyncMinHeight+1)

		headers, err := fetchHeaders(network, chain.ChainId, nextHeight, chain.CurrentHeight)
		if err != nil {
			log.Printf("Error fetching headers for chain %d: %v\n", chain.ChainId, err)
			continue
		}

		payloads, err := fetchPayloads(network, chain.ChainId, headers)
		if err != nil {
			log.Printf("Error fetching payloads for chain %d: %v\n", chain.ChainId, err)
			continue
		}

		processPayloads, err := processPayloads(payloads)
		if err != nil {
			log.Printf("Error processing payloads for chain %d: %v\n", chain.ChainId, err)
			continue
		}

		err = saveInDatabase(network, chain.ChainId, headers, processPayloads, db)
		if err != nil {
			log.Printf("Error saving payloads for chain %d, height %d to %d: %v\n", chain.ChainId, nextHeight, chain.CurrentHeight, err)
			continue
		}

		chain.CurrentHeight = nextHeight - 1
		duration := time.Since(startTime)
		log.Printf("Processed and saved chain %d data in %fs\n", chain, duration.Seconds())
		AverageTime = (AverageTime + duration.Seconds()) / 2
		log.Printf("Average time: %f\n", AverageTime)
	}

	log.Println("Backfill process completed.")
}

func fetchHeaders(network string, chainId int, minHeight int, maxHeight int) ([]fetch.Item, error) {
	startTime := time.Now()

	data, err := fetch.FetchHeaders(network, chainId, minHeight, maxHeight)
	if err != nil {
		return nil, fmt.Errorf("fetchHeaders: %w", err)
	}

	log.Printf("Fetched headers in %fs\n", time.Since(startTime).Seconds())
	return data.Items, nil
}

func fetchPayloads(network string, chainId int, headers []fetch.Item) ([]fetch.Payload, error) {
	startTime := time.Now()

	payloadHashes := make([]string, 0, len(headers))
	for _, header := range headers {
		payloadHashes = append(payloadHashes, header.PayloadHash)
	}

	payloads, err := fetch.FetchPayloads(network, chainId, payloadHashes)

	if err != nil {
		return nil, fmt.Errorf("fetchPayloads: %w", err)
	}

	log.Printf("Fetched payloads in %fs\n", time.Since(startTime).Seconds())
	return payloads, nil
}

func processPayloads(payloads []fetch.Payload) ([]fetch.ProcessedPayload, error) {
	startTime := time.Now()
	processedPayloads, err := fetch.ProcessPayloads(payloads)

	if err != nil {
		return nil, fmt.Errorf("processPayloads: %w", err)
	}

	log.Printf("Processed payloads in %fs\n", time.Since(startTime).Seconds())
	return processedPayloads, nil
}

func saveInDatabase(network string, chainId int, headers []fetch.Item, processedPayloads []fetch.ProcessedPayload, db *pgxpool.Pool) error {
	startTime := time.Now()
	err := savePayloads(network, chainId, headers, processedPayloads, db)
	if err != nil {
		return fmt.Errorf("saveInDatabase: %w", err)
	}

	log.Printf("Saved payloads in %fs\n", time.Since(startTime).Seconds())
	return nil
}
