package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
)

func PrepareEvents(network string, item fetch.Item, payload fetch.ProcessedPayload, transactionsId []int64) []repository.EventAttributes {
	transactions := payload.Transactions

	if len(transactions) == 0 {
		// log.Printf("No events to save for block %s\n", item.Hash)
		return []repository.EventAttributes{}
	}

	// average value that we can expect for the number of events in 50 blocks
	const avgEventsPerTransaction = 80
	events := make([]repository.EventAttributes, 0, len(transactions)*avgEventsPerTransaction)

	for index, t := range transactions {

		for _, event := range t.Events {

			module := buildModuleName(event.Module.Namespace, event.Module.Name)

			qualName := buildModuleName(event.Module.Namespace, event.Module.Name)

			paramsJSON, err := json.Marshal(event.Params)
			if err != nil {
				fmt.Printf("Events: %+v\n", t.Events)
				log.Printf("Error marshaling params for event %s: %v\n", event.Name, err)
				return []repository.EventAttributes{}
			}

			eventRecord := repository.EventAttributes{
				TransactionId: transactionsId[index],
				PayloadHash:   item.PayloadHash,
				ChainId:       item.ChainId,
				Module:        module,
				ModuleHash:    event.ModuleHash,
				Name:          event.Name,
				Params:        paramsJSON,
				ParamText:     paramsJSON,
				QualName:      qualName,
				RequestKey:    t.ReqKey,
			}
			events = append(events, eventRecord)
		}

	}

	return events
}
