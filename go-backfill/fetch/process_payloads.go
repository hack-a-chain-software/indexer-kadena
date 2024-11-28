package fetch

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
)

// Types for handling the JSON structure

type Event struct {
	Params     []interface{} `json:"params"`
	Name       string        `json:"name"`
	Module     Module        `json:"module"`
	ModuleHash string        `json:"moduleHash"`
}

type Module struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
}

type Transaction struct {
	Hash         string          `json:"hash"`
	Sigs         json.RawMessage `json:"sigs"`         // Treated as raw JSON
	Cmd          json.RawMessage `json:"cmd"`          // Treated as raw JSON
	Result       json.RawMessage `json:"result"`       // Treated as raw JSON
	Continuation json.RawMessage `json:"continuation"` // Treated as raw JSON
}

type Sig struct {
	Sig string `json:"sig"`
}

type TransactionResult struct {
	Gas          int         `json:"gas"`
	Result       Result      `json:"result"`
	ReqKey       string      `json:"reqKey"`
	Logs         string      `json:"logs"`
	Events       []Event     `json:"events"`
	MetaData     interface{} `json:"metaData"`
	Continuation interface{} `json:"continuation"`
	TxId         int         `json:"txId"`
}

type Result struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data"`
}

type Coinbase struct {
	Gas          int         `json:"gas"`
	Result       Result      `json:"result"`
	ReqKey       string      `json:"reqKey"`
	Logs         string      `json:"logs"`
	Events       []Event     `json:"events"`
	MetaData     interface{} `json:"metaData"`
	Continuation interface{} `json:"continuation"`
	TxId         int         `json:"txId"`
}

// ProcessedPayload represents the processed version of the payload
type ProcessedPayload struct {
	Transactions     []DecodedTransaction `json:"transactions"`
	MinerData        json.RawMessage      `json:"minerData"`
	TransactionsHash string               `json:"transactionsHash"`
	OutputsHash      string               `json:"outputsHash"`
	PayloadHash      string               `json:"payloadHash"`
	Coinbase         json.RawMessage      `json:"coinbase"`
}

// DecodedTransaction represents a decoded transaction
type DecodedTransaction struct {
	Hash         string          `json:"hash"`
	Sigs         json.RawMessage `json:"sigs"`
	Cmd          json.RawMessage `json:"cmd"`
	Gas          int             `json:"gas"`
	Result       json.RawMessage `json:"result"`
	ReqKey       string          `json:"reqKey"`
	Logs         json.RawMessage `json:"logs"`
	Events       []Event         `json:"events"`
	MetaData     interface{}     `json:"metaData"`
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
	Logs         json.RawMessage `json:"logs"`
	Events       []Event         `json:"events"`
	MetaData     interface{}     `json:"metaData"`
	Continuation json.RawMessage `json:"continuation"`
	TxId         int             `json:"txId"`
}

func ProcessPayloads(payloads []Payload) ([]ProcessedPayload, error) {
	var processedPayloads []ProcessedPayload

	for _, payload := range payloads {
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
				log.Printf("Error processing transaction part 0: %v\n", err)
				continue
			}

			err = DecodeBase64AndParseJSON(string(transactionParts[1]), &part1)
			if err != nil {
				log.Printf("Error processing transaction part 1: %v\n", err)
				continue
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
				MetaData:     part1.MetaData,
				Continuation: part1.Continuation,
				TxId:         part1.TxId,
			})
		}

		minerDataRaw := json.RawMessage(string(payload.MinerData))
		coinbaseRaw := json.RawMessage(string(payload.Coinbase))

		processedPayload := ProcessedPayload{
			Transactions:     transactions,
			MinerData:        minerDataRaw,
			TransactionsHash: payload.TransactionsHash,
			OutputsHash:      payload.OutputsHash,
			PayloadHash:      payload.PayloadHash,
			Coinbase:         coinbaseRaw,
		}

		processedPayloads = append(processedPayloads, processedPayload)
	}

	return processedPayloads, nil
}

func DecodeBase64AndParseJSON(encodedData string, v interface{}) error {
	// Attempt to decode using RawStdEncoding
	decodedData, err := base64.RawStdEncoding.DecodeString(encodedData)
	if err != nil {
		// If decoding fails, fall back to the padded RawURLEncoding method
		decodedData, err = decodeBase64WithPadding(encodedData)
		if err != nil {
			return fmt.Errorf("error decoding base64 data with both standard and padded URL-safe encoding: %w", err)
		}
	}

	err = json.Unmarshal(decodedData, v)
	if err != nil {
		fmt.Print("unmarshal error")
		return fmt.Errorf("error unmarshalling JSON data: %w", err)
	}

	return nil
}

func decodeBase64WithPadding(base64Str string) ([]byte, error) {
	// Add padding to the base64 string if needed (base64 URL-safe requires multiples of 4 in length)
	missingPadding := len(base64Str) % 4
	if missingPadding != 0 {
		base64Str += string(make([]byte, 4-missingPadding, 4-missingPadding))
	}

	// Decode the base64 string using URL-safe encoding
	decodedBytes, err := base64.RawURLEncoding.DecodeString(base64Str)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 with padding: %w", err)
	}

	return decodedBytes, nil
}
