package main

import (
	"context"
	"flag"
	"fmt"
	"go-backfill/config"
	"go-backfill/fetch"
	"go-backfill/process"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
)

type BlockHeight struct {
	ChainID   int64
	MaxHeight int64
}

func main() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()
	config.InitEnv(*envFile)

	pool := config.InitDatabase()
	defer pool.Close()

	go config.StartMemoryMonitoring()
	cuts := fetch.FetchCuts()
	maxHeights, err := FetchMaxHeightByChain(pool)
	if err != nil {
		fmt.Printf("error fetching max heights: %v\n", err)
		return
	}

	for _, maxHeight := range maxHeights {
		ChainIdStr := strconv.FormatInt(maxHeight.ChainID, 10)
		Height := cuts.Hashes[ChainIdStr].Height
		Hash := cuts.Hashes[ChainIdStr].Hash
		process.StartBackfill(Height, Hash, int(maxHeight.ChainID), int(maxHeight.MaxHeight+1), pool)
	}
}

func FetchMaxHeightByChain(pool *pgxpool.Pool) ([]BlockHeight, error) {
	query := `
		SELECT MAX(b.height) AS max_height, b."chainId"
		FROM "Blocks" b
		GROUP BY b."chainId"
		ORDER BY b."chainId" DESC;
	`

	rows, err := pool.Query(context.Background(), query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer rows.Close()

	var results []BlockHeight
	for rows.Next() {
		var result BlockHeight
		if err := rows.Scan(&result.MaxHeight, &result.ChainID); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error occurred during row iteration: %w", err)
	}

	return results, nil
}
