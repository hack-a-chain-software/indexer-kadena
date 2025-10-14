package main

import (
	"flag"
	"go-backfill/config"
	"log"
)

var (
	command = flag.String("command", "", "Migration command to run (code-to-text, creation-time, reconcile)")
	envFile = flag.String("env", ".env", "Path to the .env file")
)

func initEnv() {
	config.InitEnv(*envFile)
}

func main() {
	flag.Parse()

	if *command == "" {
		log.Fatalf("Please specify a command to run. Available commands: code-to-text, creation-time, reconcile")
	}

	// Initialize environment first
	initEnv()

	switch *command {
	case "code-to-text":
		CodeToText()
	case "creation-time":
		DuplicateCreationTimes()
	case "reconcile":
		InsertReconcileEvents()
	case "tx-counters":
		MakeTxCounters()
	default:
		log.Fatalf("Unknown command: %s", *command)
	}
}
