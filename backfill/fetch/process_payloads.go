package fetch

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"go-backfill/config"
	"log"
	"strings"
	"time"
)

type Event struct {
	Params     []interface{} `json:"params"`
	Name       string        `json:"name"`
	Module     Module        `json:"module"`
	ModuleHash string        `json:"moduleHash"`
}

type Module struct {
	Namespace *string `json:"namespace"`
	Name      string  `json:"name"`
}

type Result struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data"`
}

type ProcessedPayload struct {
	Header           Header               `json:"header"`
	Transactions     []DecodedTransaction `json:"transactions"`
	MinerData        json.RawMessage      `json:"minerData"`
	TransactionsHash string               `json:"transactionsHash"`
	OutputsHash      string               `json:"outputsHash"`
	PayloadHash      string               `json:"payloadHash"`
	Coinbase         json.RawMessage      `json:"coinbase"`
}

type DecodedTransaction struct {
	Hash         string          `json:"hash"`
	Sigs         json.RawMessage `json:"sigs"`
	Cmd          json.RawMessage `json:"cmd"`
	Gas          int             `json:"gas"`
	Result       json.RawMessage `json:"result"`
	ReqKey       string          `json:"reqKey"`
	Logs         string          `json:"logs"`
	Events       []Event         `json:"events"`
	Continuation json.RawMessage `json:"continuation"`
	Step         int             `json:"step"`
	TTL          string          `json:"ttl"`
	TxId         int             `json:"txId"`
}

type TransactionPart0 struct {
	Hash string          `json:"hash"`
	Sigs json.RawMessage `json:"sigs"`
	Cmd  json.RawMessage `json:"cmd"`
}

type TransactionPart1 struct {
	Gas          int             `json:"gas"`
	Result       json.RawMessage `json:"result"`
	ReqKey       string          `json:"reqKey"`
	Logs         string          `json:"logs"`
	Events       []Event         `json:"events"`
	Continuation json.RawMessage `json:"continuation"`
	TxId         int             `json:"txId"`
}

func ProcessPayloads(blocks []BlockInfo) ([]ProcessedPayload, error) {
	startTime := time.Now()
	var processedPayloads []ProcessedPayload

	for _, block := range blocks {
		payload := block.Payload
		var transactions []DecodedTransaction

		for _, transactionParts := range payload.Transactions {
			if len(transactionParts) != 2 {
				log.Printf("Transaction parts length is not 2, skipping transaction")
				continue
			}

			var part0 TransactionPart0
			var part1 TransactionPart1

			err := DecodeBase64AndParseJSON(transactionParts[0], &part0)
			if err != nil {
				return nil, fmt.Errorf("error decoding transaction part 0: %w", err)
			}

			err = DecodeBase64AndParseJSON(string(transactionParts[1]), &part1)
			if err != nil {
				return nil, fmt.Errorf("error decoding transaction part 1: %w", err)
			}

			transactions = append(transactions, DecodedTransaction{
				Hash:         part0.Hash,
				Sigs:         part0.Sigs,
				Cmd:          part0.Cmd,
				Gas:          part1.Gas,
				Result:       part1.Result,
				ReqKey:       part1.ReqKey,
				Logs:         part1.Logs,
				Events:       part1.Events,
				Continuation: part1.Continuation,
				TxId:         part1.TxId,
			})
		}

		var minerDataRaw json.RawMessage
		err1 := DecodeBase64AndParseJSON(payload.MinerData, &minerDataRaw)
		if err1 != nil {
			return nil, fmt.Errorf("error decoding miner data: %w", err1)
		}

		var coinbaseRaw json.RawMessage
		err2 := DecodeBase64AndParseJSON(payload.Coinbase, &coinbaseRaw)
		if err2 != nil {
			return nil, fmt.Errorf("error decoding coinbase data: %w", err2)
		}

		processedPayload := ProcessedPayload{
			Header:           block.Header,
			Transactions:     transactions,
			MinerData:        minerDataRaw,
			TransactionsHash: payload.TransactionsHash,
			OutputsHash:      payload.OutputsHash,
			PayloadHash:      payload.PayloadHash,
			Coinbase:         coinbaseRaw,
		}

		processedPayloads = append(processedPayloads, processedPayload)
	}

	env := config.GetConfig()
	if env.IsSingleChain {
		log.Printf("Processed payloads in %fs\n", time.Since(startTime).Seconds())
	}

	return processedPayloads, nil
}

func DecodeBase64AndParseJSON(encodedData string, v interface{}) error {
	// Normalize the input by ensuring proper padding
	encodedData = ensureBase64Padding(encodedData)

	// Attempt decoding using both standard and URL-safe Base64 encodings
	var decodedData []byte
	var err error

	decodedData, err = base64.StdEncoding.DecodeString(encodedData)
	if err != nil {
		decodedData, err = base64.URLEncoding.DecodeString(encodedData)
		if err != nil {
			return fmt.Errorf("error decoding base64 data using both standard and URL-safe encodings: %w", err)
		}
	}

	// Unmarshal the JSON data into the provided interface
	err = json.Unmarshal(decodedData, v)
	if err != nil {
		return fmt.Errorf("error unmarshalling JSON data: %w", err)
	}

	return nil
}

// ensureBase64Padding adds missing padding to a Base64 string if necessary.
func ensureBase64Padding(base64Str string) string {
	missingPadding := len(base64Str) % 4
	if missingPadding > 0 {
		padding := strings.Repeat("=", 4-missingPadding)
		base64Str += padding
	}
	return base64Str
}
