package main

import (
	"context"
	"fmt"
	"go-backfill/config"
	"go-backfill/process"
	"log"
	"runtime"
	"time"

	_ "net/http/pprof"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/lib/pq"
)

func main() {
	env := config.LoadEnv()
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env.DbHost, env.DbPort, env.DbUser, env.DbPassword, env.DbName)

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		log.Fatalf("Unable to parse connection string: %v\n", err)
	}

	config.MaxConns = 10                       // Maximum number of connections
	config.MinConns = 5                        // Minimum number of connections to keep alive
	config.MaxConnLifetime = 1 * time.Hour     // Close and refresh connections after 1 hour
	config.HealthCheckPeriod = 1 * time.Minute // Check connection health every minute

	// Create the pool
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	log.Println("Connected to the database successfully.")

	go monitorMemoryUsage()
	network := env.Network
	chain := process.Chain{
		ChainId:       0,
		CurrentHeight: 5317171, //5319211,
	}

	process.StartBackfill(network, chain, pool)
}

// Function to monitor memory usage
func monitorMemoryUsage() {
	var memStats runtime.MemStats
	for {
		runtime.ReadMemStats(&memStats)

		log.Printf(
			"Alloc: %v KB, Sys: %v KB, HeapIdle: %v KB, HeapInuse: %v KB, NumGC: %v\n",
			memStats.Alloc/1024,     // Total allocated memory
			memStats.Sys/1024,       // Total system memory requested
			memStats.HeapIdle/1024,  // Idle heap memory
			memStats.HeapInuse/1024, // In-use heap memory
			memStats.NumGC,          // Number of garbage collections
		)

		time.Sleep(10 * time.Second)
	}
}
