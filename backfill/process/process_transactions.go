package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"
	"strconv"
	"strings"
)

type CmdData struct {
	Meta struct {
		TTL          TtlString          `json:"ttl"`
		Sender       string             `json:"sender"`
		GasPrice     GasPriceString     `json:"gasPrice"`
		GasLimit     GasLimit           `json:"gasLimit"`
		ChainId      string             `json:"chainId"`
		CreationTime CreationTimeString `json:"creationTime"`
	} `json:"meta"`
	Nonce   string `json:"nonce"`
	Payload struct {
		Exec struct {
			Code json.RawMessage `json:"code"`
			Data json.RawMessage `json:"data"`
		} `json:"exec"`
		Cont *struct {
			Proof *string `json:"proof"`
			Step  int     `json:"step"`
		} `json:"cont"`
	} `json:"payload"`
}

func PrepareTransactions(network string, blockId int64, payload fetch.ProcessedPayload, block repository.BlockAttributes) ([]repository.TransactionAttributes, []repository.TransactionDetailsAttributes, repository.TransactionAttributes, error) {
	transactions := payload.Transactions

	transactionRecords := make([]repository.TransactionAttributes, 0, len(transactions))
	transactionDetailsRecords := make([]repository.TransactionDetailsAttributes, 0, len(transactions))

	var cmdData CmdData
	var continuationData struct {
		PactID *string `json:"pactId"`
	}
	var resultData map[string]interface{}

	for _, t := range transactions {
		cmdData = CmdData{}
		resultData = nil
		var rawCmd string
		continuationData = struct {
			PactID *string `json:"pactId"`
		}{}

		if err := json.Unmarshal(t.Cmd, &rawCmd); err != nil {
			return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("unmarshaling Cmd JSON for transaction %s: %w", t.Hash, err)
		}

		if err := json.Unmarshal([]byte(rawCmd), &cmdData); err != nil {
			return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("unmarshaling raw command for transaction %s: %w", t.Hash, err)
		}

		continuationRaw := json.RawMessage("{}")
		if string(t.Continuation) != "null" {
			continuationRaw = t.Continuation
		}

		codeRaw, err := ensureNotEmpty(cmdData.Payload.Exec.Code)
		if err != nil {
			return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("ensuring code is not empty for transaction %s: %w", t.Hash, err)
		}
		dataRaw, err := ensureNotEmpty(cmdData.Payload.Exec.Data)
		if err != nil {
			return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("ensuring data is not empty for transaction %s: %w", t.Hash, err)
		}

		if err := json.Unmarshal(continuationRaw, &continuationData); err != nil {
			return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("unmarshaling Continuation for transaction %s: %w", t.Hash, err)
		}

		rollback := true
		if err := json.Unmarshal(t.Result, &resultData); err == nil {
			if status, ok := resultData["status"].(string); ok && status == "success" {
				rollback = false
			}
		}

		var chainId int
		if cmdData.Meta.ChainId != "" {
			chainId, err = strconv.Atoi(cmdData.Meta.ChainId)
			if err != nil {
				return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("converting ChainId for transaction %s: %w", t.Hash, err)
			}
		} else {
			chainId = block.ChainId
		}

		txId := strconv.Itoa(t.TxId)
		gas := strconv.Itoa(t.Gas)

		var proof *string
		var step = 0
		if cmdData.Payload.Cont != nil {
			proof = cmdData.Payload.Cont.Proof
			step = cmdData.Payload.Cont.Step
		}

		nonce := strings.ReplaceAll(cmdData.Nonce, "\\\"", "")
		nonce = strings.ReplaceAll(nonce, "\"", "")
		transactionRecord := repository.TransactionAttributes{
			BlockId:      blockId,
			ChainId:      chainId,
			CreationTime: string(cmdData.Meta.CreationTime),
			Hash:         t.Hash,
			Result:       t.Result,
			Logs:         t.Logs,
			NumEvents:    len(t.Events),
			RequestKey:   t.ReqKey,
			Sender:       cmdData.Meta.Sender,
			TxId:         txId,
		}

		// Create transaction details record
		transactionDetailsRecord := repository.TransactionDetailsAttributes{
			TransactionId: -1,
			Code:          codeRaw,
			Continuation:  continuationRaw,
			Data:          dataRaw,
			Gas:           gas,
			GasLimit:      string(cmdData.Meta.GasLimit),
			GasPrice:      string(cmdData.Meta.GasPrice),
			Nonce:         nonce,
			PactId:        continuationData.PactID,
			Proof:         proof,
			Rollback:      rollback,
			Sigs:          t.Sigs,
			Step:          step,
			TTL:           string(cmdData.Meta.TTL),
		}

		transactionRecords = append(transactionRecords, transactionRecord)
		transactionDetailsRecords = append(transactionDetailsRecords, transactionDetailsRecord)
	}

	coinbaseTx, err := ProcessCoinbaseTransaction(string(payload.Coinbase), blockId, block.CreationTime, int64(block.ChainId))
	if err != nil {
		return nil, nil, repository.TransactionAttributes{}, fmt.Errorf("processing coinbase transaction %d: %w", blockId, err)
	}

	return transactionRecords, transactionDetailsRecords, coinbaseTx, nil
}

func ensureNotEmpty(raw json.RawMessage) (json.RawMessage, error) {
	if len(raw) == 0 || string(raw) == `""` {
		return json.RawMessage(`{}`), nil
	}

	var decoded interface{}
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}

	if decoded == nil || decoded == "" {
		return json.RawMessage(`{}`), nil
	}

	return raw, nil
}
