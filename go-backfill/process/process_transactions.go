package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
	"strconv"
)

type CmdData struct {
	Meta struct {
		TTL          int            `json:"ttl"`
		Sender       string         `json:"sender"`
		Nonce        *string        `json:"nonce"`
		GasPrice     GasPriceString `json:"gasPrice"`
		GasLimit     int            `json:"gasLimit"`
		ChainId      string         `json:"chainId"`
		CreationTime float64        `json:"creationTime"`
	} `json:"meta"`
	Payload struct {
		Exec struct {
			Code json.RawMessage `json:"code"`
			Data json.RawMessage `json:"data"`
		} `json:"exec"`
	} `json:"payload"`
}

func PrepareTransactions(network string, blockId int64, item fetch.Item, payload fetch.ProcessedPayload) []repository.TransactionAttributes {
	transactions := payload.Transactions

	if len(transactions) == 0 {
		// log.Printf("No transactions to save for block %s\n", item.Hash)
		return []repository.TransactionAttributes{}
	}

	// Preallocate the slice for better performance
	transactionRecords := make([]repository.TransactionAttributes, 0, len(transactions))

	var cmdData CmdData
	var continuationData struct {
		PactID string `json:"pactId"`
	}
	var resultData map[string]interface{}

	for _, t := range transactions {
		// Reset variables
		cmdData = CmdData{}
		continuationData = struct {
			PactID string `json:"pactId"`
		}{}
		resultData = nil

		var rawCmd string

		// Step 1: Unmarshal Cmd as a raw string
		err := json.Unmarshal(t.Cmd, &rawCmd)
		if err != nil {
			log.Printf("Error unmarshaling Cmd for transaction %s (raw string): %v\n", item.Hash, err)
			continue
		}

		// Step 2: Unmarshal the extracted JSON content into the cmdData struct
		err = json.Unmarshal([]byte(rawCmd), &cmdData)
		if err != nil {
			log.Printf("Error unmarshaling Cmd for transaction %s (JSON object): %v\n", t.ReqKey, err)
			continue
		}

		// Convert MetaData to JSON format
		metaDataJSON, err := json.Marshal(t.MetaData)
		if err != nil {
			log.Printf("Error marshaling MetaData for transaction %s: %v\n", t.Hash, err)
			continue
		}

		// Extract PactID from Continuation
		if len(t.Continuation) > 0 {
			err = json.Unmarshal(t.Continuation, &continuationData)
			if err != nil {
				log.Printf("Error unmarshaling Continuation for transaction %s: %v\n", t.Hash, err)
				continue
			}
		}

		err = json.Unmarshal(t.Result, &resultData)
		if err != nil {
			log.Printf("Error unmarshaling result JSON for transaction %s: %v\n", t.Hash, err)
			continue
		}

		nonce := ""
		if cmdData.Meta.Nonce != nil {
			nonce = *cmdData.Meta.Nonce
		}

		code := cmdData.Payload.Exec.Code
		data := cmdData.Payload.Exec.Data

		var resultData map[string]interface{}
		err = json.Unmarshal(t.Result, &resultData)
		if err != nil {
			log.Printf("Error unmarshaling result JSON for transaction %s: %v\n", t.Hash, err)
			continue
		}

		rollback := true
		if resultData != nil {
			if status, ok := resultData["status"].(string); ok && status == "success" {
				rollback = false
			}
		}

		chainId, err := strconv.Atoi(cmdData.Meta.ChainId)
		if err != nil {
			fmt.Println("Error converting string to int:", err)
			continue
		}

		txId := strconv.Itoa(t.TxId)

		ttl := strconv.Itoa(cmdData.Meta.TTL)

		gasLimit := strconv.Itoa(cmdData.Meta.GasLimit)

		// gasPrice := strconv.FormatFloat(, 'f', -1, 64)

		creationTimeStr := strconv.FormatFloat(cmdData.Meta.CreationTime, 'f', -1, 64)

		gas := strconv.Itoa(t.Gas)

		transactionRecord := repository.TransactionAttributes{
			BlockId:      blockId,
			PayloadHash:  item.PayloadHash,
			Code:         code,
			Data:         data,
			ChainId:      chainId,
			CreationTime: creationTimeStr,
			GasLimit:     gasLimit,
			GasPrice:     string(cmdData.Meta.GasPrice),
			Hash:         t.Hash,
			Nonce:        nonce,
			PactId:       continuationData.PactID,
			Continuation: t.Continuation,
			Gas:          gas,
			Result:       t.Result,
			Logs:         t.Logs,
			Metadata:     json.RawMessage(metaDataJSON),
			NumEvents:    len(t.Events),
			RequestKey:   t.ReqKey,
			Rollback:     rollback,
			Sender:       cmdData.Meta.Sender,
			Sigs:         t.Sigs,
			Step:         t.Step,
			TTL:          ttl,
			TxId:         txId,
		}
		transactionRecords = append(transactionRecords, transactionRecord)

	}

	return transactionRecords
}
