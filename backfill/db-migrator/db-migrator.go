package main

import (
	"database/sql"
	"flag"
	"fmt"
	"go-backfill/config"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

func main() {
	envFile := flag.String("env", ".env", "Path to the .env file")
	flag.Parse()
	config.InitEnv(*envFile)
	env := config.GetConfig()
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env.DbHost, env.DbPort, env.DbUser, env.DbPassword, env.DbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database")

	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("Failed to begin transaction: %v", err)
	}

	// SQL commands grouped by table
	commands := []struct {
		description string
		query       string
	}{
		{"Create unique index on Balances", `CREATE UNIQUE INDEX "Balances_pkey" ON public."Balances" USING btree (id);`},
		{"Create index on account column of Balances", `CREATE INDEX balances_account_index ON public."Balances" USING btree (account);`},
		{"Create index on contractId column of Balances", `CREATE INDEX balances_contractid_index ON public."Balances" USING btree ("contractId");`},
		{"Create index on lower(account) column of Balances", `CREATE INDEX balances_search_idx ON public."Balances" USING btree (lower((account)::text));`},
		{"Create index on tokenId column of Balances", `CREATE INDEX balances_tokenid_index ON public."Balances" USING btree ("tokenId");`},
		{"Create unique constraint on Balances", `CREATE UNIQUE INDEX balances_unique_constraint ON public."Balances" USING btree ("chainId", account, module, "tokenId");`},
		{"Create unique index on Blocks", `CREATE UNIQUE INDEX "Blocks_pkey" ON public."Blocks" USING btree (id);`},
		{"Create index on canonical column of Blocks", `CREATE INDEX blocks_canonical_idx ON public."Blocks" USING btree (canonical);`},
		{"Create index on chainId, height columns of Blocks", `CREATE INDEX blocks_chainid_height_idx ON public."Blocks" USING btree ("chainId", height);`},
		{"Create index on chainId column of Blocks", `CREATE INDEX blocks_chainid_idx ON public."Blocks" USING btree ("chainId");`},
		{"Create unique index on Blocks chainwebVersion, chainId, hash", `CREATE UNIQUE INDEX "blocks_chainwebVersion_chainid_hash_unique_idx" ON public."Blocks" USING btree ("chainwebVersion", "chainId", hash);`},
		{"Create index on hash column of Blocks", `CREATE INDEX blocks_hash_idx ON public."Blocks" USING btree (hash);`},
		{"Create index on height, id columns of Blocks", `CREATE INDEX blocks_height_id_idx ON public."Blocks" USING btree (height, id);`},
		{"Create index on height column of Blocks", `CREATE INDEX blocks_height_idx ON public."Blocks" USING btree (height);`},
		{"Create GIN index on parent column of Blocks", `CREATE INDEX blocks_trgm_parent_idx ON public."Blocks" USING gin (lower((parent)::text));`},
		{"Create unique index on Contracts", `CREATE UNIQUE INDEX "Contracts_pkey" ON public."Contracts" USING btree (id);`},
		{"Create unique constraint on Contracts", `CREATE UNIQUE INDEX contract_unique_constraint ON public."Contracts" USING btree ("chainId", module, "tokenId");`},
		{"Create index on Contracts module", `CREATE INDEX contracts_search_idx ON public."Contracts" USING btree (lower((module)::text));`},
		{"Create unique index on Events", `CREATE UNIQUE INDEX "Events_pkey" ON public."Events" USING btree (id);`},
		{"Create index on Events module, name", `CREATE INDEX events_module_name_idx ON public."Events" USING btree (module, name);`},
		{"Create index on transactionId column of Events", `CREATE INDEX events_transactionid_idx ON public."Events" USING btree ("transactionId");`},
		{"Create unique index on Guards", `CREATE UNIQUE INDEX "Guards_pkey" ON public."Guards" USING btree (id);`},
		{"Create unique index on Guards publicKey, predicate, balanceId", `CREATE UNIQUE INDEX guards_publickey_predicate_balanceid_idx ON public."Guards" USING btree ("publicKey", predicate, "balanceId");`},
		{"Create unique index on Signers", `CREATE UNIQUE INDEX "Signers_pkey" ON public."Signers" USING btree (id);`},
		{"Create index on pubkey column of Signers", `CREATE INDEX signers_pubkey_idx ON public."Signers" USING btree (pubkey);`},
		{"Create index on pubkey, transactionId columns of Signers", `CREATE INDEX signers_pubkey_transactionid_idx ON public."Signers" USING btree (pubkey, "transactionId");`},
		{"Create index on transactionId column of Signers", `CREATE INDEX signers_transaction_id_idx ON public."Signers" USING btree ("transactionId");`},
		{"Create unique index on Transactions", `CREATE UNIQUE INDEX "Transactions_pkey" ON public."Transactions" USING btree (id);`},
		{"Create index on blockId column of Transactions", `CREATE INDEX "transactions_blockId_idx" ON public."Transactions" USING btree ("blockId");`},
		{"Create index on canonical column of Transactions", `CREATE INDEX transactions_canonical_idx ON public."Transactions" USING btree (canonical);`},
		{"Create index on chainId column of Transactions", `CREATE INDEX "transactions_chainId_idx" ON public."Transactions" USING btree ("chainId");`},
		{"Create index on chainId, blockId columns of Transactions", `CREATE INDEX transactions_chainid_blockid_idx ON public."Transactions" USING btree ("chainId", "blockId");`},
		{"Create index on hash column of Transactions", `CREATE INDEX transactions_hash_idx ON public."Transactions" USING btree (hash);`},
		{"Create index on requestkey column of Transactions", `CREATE INDEX transactions_requestkey_idx ON public."Transactions" USING btree (requestkey);`},
		{"Create index on sender, id columns of Transactions", `CREATE INDEX transactions_sender_id_idx ON public."Transactions" USING btree (sender, id);`},
		{"Create index on sender column of Transactions", `CREATE INDEX transactions_sender_idx ON public."Transactions" USING btree (sender);`},
		{"Create GIN index on hash column of Transactions", `CREATE INDEX transactions_trgm_hash_idx ON public."Transactions" USING gin (lower((hash)::text));`},
		{"Create GIN index on pactid column of Transactions", `CREATE INDEX transactions_trgm_pactid_idx ON public."Transactions" USING gin (lower((pactid)::text));`},
		{"Create GIN index on requestkey column of Transactions", `CREATE INDEX transactions_trgm_requestkey_idx ON public."Transactions" USING gin (lower((requestkey)::text));`},
		{"Create GIN index on sender column of Transactions", `CREATE INDEX transactions_trgm_sender_idx ON public."Transactions" USING gin (lower((sender)::text));`},
		{"Create GIN index on txid column of Transactions", `CREATE INDEX transactions_trgm_txid_idx ON public."Transactions" USING gin (lower((txid)::text));`},
		{"Create unique index on Transfers", `CREATE UNIQUE INDEX "Transfers_pkey" ON public."Transfers" USING btree (id);`},
		{"Create index on from_acct column of Transfers", `CREATE INDEX from_acct_idx ON public."Transfers" USING btree (from_acct);`},
		{"Create index on to_acct column of Transfers", `CREATE INDEX to_acct_idx ON public."Transfers" USING btree (to_acct);`},
		{"Create index on chainId, from_acct, modulename columns of Transfers", `CREATE INDEX transfers_chainid_from_acct_modulename_idx ON public."Transfers" USING btree ("chainId", from_acct, modulename);`},
		{"Create index on chainId, to_acct, modulename columns of Transfers", `CREATE INDEX transfers_chainid_to_acct_modulename_idx ON public."Transfers" USING btree ("chainId", to_acct, modulename);`},
		{"Create index on contractId column of Transfers", `CREATE INDEX transfers_contractid_idx ON public."Transfers" USING btree ("contractId");`},
		{"Create index on from_acct, modulename columns of Transfers", `CREATE INDEX transfers_from_acct_modulename_idx ON public."Transfers" USING btree (from_acct, modulename);`},
		{"Create index on hasTokenId column of Transfers", `CREATE INDEX "transfers_hasTokenId_idx" ON public."Transfers" USING btree ("hasTokenId");`},
		{"Create index on modulename column of Transfers", `CREATE INDEX transfers_modulename_idx ON public."Transfers" USING btree (modulename);`},
		{"Create index on transactionId column of Transfers", `CREATE INDEX transfers_transactionid_idx ON public."Transfers" USING btree ("transactionId");`},
		{"Create index on type column of Transfers", `CREATE INDEX transfers_type_idx ON public."Transfers" USING btree (type);`},
	}

	for i, cmd := range commands {
		log.Printf("Executing (%d/%d): %s", i+1, len(commands), cmd.description)

		start := time.Now()
		_, err := tx.Exec(cmd.query)
		elapsed := time.Since(start)

		if err != nil {
			log.Printf("Error executing (%d): %s - %v", i+1, cmd.description, err)
			tx.Rollback()
			log.Println("Transaction rolled back due to error")
			return
		} else {
			log.Printf("Successfully executed (%d): %s in %v", i+1, cmd.description, elapsed)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Fatalf("Failed to commit transaction: %v", err)
	}

	log.Println("All commands executed")
}
