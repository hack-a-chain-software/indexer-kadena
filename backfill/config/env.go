package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DbUser                    string
	DbPassword                string
	DbName                    string
	DbHost                    string
	DbPort                    string
	CertPath                  string
	Network                   string
	ChainId                   int
	SyncBaseUrl               string
	SyncMinHeight             int
	SyncFetchIntervalInBlocks int
	SyncAttemptsMaxRetry      int
	SyncAttemptsIntervalInMs  int
	IsDevelopment             bool
	IsSingleChain             bool
}

var config *Config

func InitEnv(envFilePath string) {
	IsDevelopment := true
	if err := godotenv.Load(envFilePath); err != nil {
		IsDevelopment = false
		log.Printf("No .env file found at %s, falling back to system environment variables", envFilePath)
	}

	config = &Config{
		DbUser:                    getEnv("DB_USERNAME"),
		DbPassword:                getEnv("DB_PASSWORD"),
		DbName:                    getEnv("DB_NAME"),
		DbHost:                    getEnv("DB_HOST"),
		DbPort:                    getEnv("DB_PORT"),
		CertPath:                  getEnv("CERT_PATH"),
		Network:                   getEnv("NETWORK"),
		ChainId:                   getEnvAsInt("CHAIN_ID"),
		SyncBaseUrl:               getEnv("SYNC_BASE_URL"),
		SyncMinHeight:             getEnvAsInt("SYNC_MIN_HEIGHT"),
		SyncFetchIntervalInBlocks: getEnvAsInt("SYNC_FETCH_INTERVAL_IN_BLOCKS"),
		SyncAttemptsMaxRetry:      getEnvAsInt("SYNC_ATTEMPTS_MAX_RETRY"),
		SyncAttemptsIntervalInMs:  getEnvAsInt("SYNC_ATTEMPTS_INTERVAL_IN_MS"),
		IsSingleChain:             getEnvAsBool("IS_SINGLE_CHAIN_RUN"),
		IsDevelopment:             IsDevelopment,
	}
}

func GetConfig() *Config {
	if config == nil {
		log.Fatal("Config not initialized. Call InitEnv first.")
	}
	return config
}

func getEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Environment variable %s is required but not set", key)
	}
	return value
}

func getEnvAsInt(key string) int {
	valueStr := getEnv(key)
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Fatalf("Environment variable %s must be an integer, but got: %s", key, valueStr)
	}
	return value
}

func getEnvAsBool(key string) bool {
	valueStr := getEnv(key)
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		log.Fatalf("Environment variable %s must be a boolean, but got: %s", key, valueStr)
	}
	return value
}

func GetMinHeights(network string) map[int]int {
	minHeights := make(map[int]int)
	if network == "mainnet01" {
		minHeights = map[int]int{
			0:  0,
			1:  0,
			2:  0,
			3:  0,
			4:  0,
			5:  0,
			6:  0,
			7:  0,
			8:  0,
			9:  0,
			10: 852054,
			11: 852054,
			12: 852054,
			13: 852054,
			14: 852054,
			15: 852054,
			16: 852054,
			17: 852054,
			18: 852054,
			19: 852054,
		}
	}

	if network == "testnet04" {
		minHeights = map[int]int{
			0:  0,
			1:  0,
			2:  0,
			3:  0,
			4:  0,
			5:  0,
			6:  0,
			7:  0,
			8:  0,
			9:  0,
			10: 332604,
			11: 332604,
			12: 332604,
			13: 332604,
			14: 332604,
			15: 332604,
			16: 332604,
			17: 332604,
			18: 332604,
			19: 332604,
		}
	}

	return minHeights
}
