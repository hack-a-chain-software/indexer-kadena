package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
)

func GetNftTransfers(network string, chainId int, events []fetch.Event, reqKey string, transactionId int64) []repository.TransferAttributes {
	const TransferNftSignature = "TRANSFER"
	const TransferNftParamsLength = 4

	transfers := make([]repository.TransferAttributes, 0, len(events))

	for _, event := range events {
		if event.Name == TransferNftSignature && len(event.Params) == TransferNftParamsLength {
			var tokenId *string
			if tokenIdValue, ok := event.Params[0].(string); ok && tokenIdValue != "null" {
				tokenId = &tokenIdValue
			}

			fromAcct, ok2 := event.Params[1].(string)
			toAcct, ok3 := event.Params[2].(string)
			amount, ok4 := convertToFloat64(event, 3)

			if !ok2 || !ok3 || !ok4 {
				log.Printf("Invalid NFT transfer parameters in event: %+v\n", event)
				continue
			}

			moduleName := buildModuleName(event.Module.Namespace, event.Module.Name)

			transfer := repository.TransferAttributes{
				TransactionId: transactionId,
				Amount:        amount,
				ChainId:       chainId,
				FromAcct:      fromAcct,
				ModuleHash:    event.ModuleHash,
				ModuleName:    moduleName,
				RequestKey:    reqKey,
				ToAcct:        toAcct,
				HasTokenId:    tokenId != nil,
				TokenId:       tokenId,
				Type:          "poly-fungible",
				OrderIndex:    len(transfers),
			}

			transfers = append(transfers, transfer)
		}
	}

	return transfers
}
