package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"
)

func PrepareEvents(network string, payload fetch.ProcessedPayload, transactionsId []int64, txCreationTimes []string) ([]repository.EventAttributes, error) {
	transactions := payload.Transactions

	const avgEventsPerTransaction = 80
	events := make([]repository.EventAttributes, 0, len(transactions)*avgEventsPerTransaction)

	for txIndex, t := range transactions {
		txCreationTime := txCreationTimes[txIndex]
		for eventIndex, event := range t.Events {
			module := buildModuleName(event.Module.Namespace, event.Module.Name)
			qualName := buildModuleName(event.Module.Namespace, event.Module.Name)

			paramsJSON, err := json.Marshal(event.Params)
			if err != nil {
				return []repository.EventAttributes{}, fmt.Errorf("marshaling params for event %s: %w", event.Name, err)
			}

			eventRecord := repository.EventAttributes{
				TransactionId: transactionsId[txIndex],
				ChainId:       payload.Header.ChainId,
				Module:        module,
				Name:          event.Name,
				Params:        paramsJSON,
				QualName:      qualName,
				RequestKey:    t.ReqKey,
				OrderIndex:    eventIndex,
				CreationTime:  txCreationTime,
			}
			events = append(events, eventRecord)
		}
	}

	coinbaseDecoded, err := decodeCoinbase(string(payload.Coinbase))
	if err != nil {
		return nil, fmt.Errorf("decoding Coinbase JSON of block: %w", err)
	}

	var coinbaseTxId = transactionsId[len(transactionsId)-1]
	var coinbaseTxCreationTime = txCreationTimes[len(txCreationTimes)-1]
	for eventIndex, event := range coinbaseDecoded.Events {

		module := buildModuleName(event.Module.Namespace, event.Module.Name)
		qualName := buildModuleName(event.Module.Namespace, event.Module.Name)
		paramsJSON, err := json.Marshal(event.Params)
		if err != nil {
			return []repository.EventAttributes{}, fmt.Errorf("marshaling params for event %s: %w", event.Name, err)
		}

		eventRecord := repository.EventAttributes{
			TransactionId: coinbaseTxId,
			ChainId:       payload.Header.ChainId,
			Module:        module,
			Name:          event.Name,
			Params:        paramsJSON,
			QualName:      qualName,
			RequestKey:    coinbaseDecoded.ReqKey,
			OrderIndex:    eventIndex,
			CreationTime:  coinbaseTxCreationTime,
		}
		events = append(events, eventRecord)
	}

	return events, nil
}
