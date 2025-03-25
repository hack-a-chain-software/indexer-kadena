package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"
	"strconv"
)

type Coinbase struct {
	Gas          int              `json:"gas"`
	Logs         string           `json:"logs"`
	TxID         int              `json:"txId"`
	Events       []fetch.Event    `json:"events"`
	ReqKey       string           `json:"reqKey"`
	Result       json.RawMessage  `json:"result"`
	MetaData     *json.RawMessage `json:"metaData"`
	Continuation *json.RawMessage `json:"continuation"`
}

func decodeCoinbase(jsonStr string) (*Coinbase, error) {
	if jsonStr == "" {
		return nil, fmt.Errorf("empty JSON string provided")
	}
	var coinbase Coinbase
	err := json.Unmarshal([]byte(jsonStr), &coinbase)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal coinbase JSON: %v, input: %s", err, jsonStr)
	}
	return &coinbase, nil
}

func ProcessCoinbaseTransaction(coinbase string, blockId int64, creationTime int64, chainId int64) (repository.TransactionAttributes, error) {
	coinbaseDecoded, err := decodeCoinbase(coinbase)
	if err != nil {
		return repository.TransactionAttributes{}, fmt.Errorf("decoding Coinbase JSON of block %d: %w", blockId, err)
	}

	txAttribute := repository.TransactionAttributes{
		BlockId:      blockId,
		ChainId:      int(chainId),
		CreationTime: strconv.FormatInt(creationTime, 10),
		Hash:         coinbaseDecoded.ReqKey,
		Result:       coinbaseDecoded.Result,
		Logs:         coinbaseDecoded.Logs,
		NumEvents:    len(coinbaseDecoded.Events),
		RequestKey:   coinbaseDecoded.ReqKey,
		Sender:       "coinbase",
		TxId:         fmt.Sprintf("%d", coinbaseDecoded.TxID),
	}

	return txAttribute, nil
}
