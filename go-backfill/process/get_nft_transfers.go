package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
)

func GetNftTransfers(network string, chainId int, events []fetch.Event, payloadHash string, reqKey string, transactionId int64) []repository.TransferAttributes {
	const TransferNftSignature = "TRANSFER"
	const TransferNftParamsLength = 4

	transfers := make([]repository.TransferAttributes, 0, len(events))

	for index, event := range events {
		// Check if the event matches the NFT transfer signature and parameters
		if event.Name == TransferNftSignature && len(event.Params) == TransferNftParamsLength {
			var tokenId *string
			if tokenIdValue, ok := event.Params[0].(string); ok {
				tokenId = &tokenIdValue
			}

			fromAcct, ok2 := event.Params[1].(string)
			toAcct, ok3 := event.Params[2].(string)
			amount, ok4 := convertToFloat64(event, 3)

			if !ok2 || !ok3 || !ok4 {
				log.Printf("Invalid NFT transfer parameters in event: %+v\n", event)
				continue
			}

			// Generate the module name
			moduleName := buildModuleName(event.Module.Namespace, event.Module.Name)

			// Create the transfer record
			transfer := repository.TransferAttributes{
				TransactionId: transactionId,
				Amount:        amount,
				PayloadHash:   payloadHash,
				ChainId:       chainId,
				FromAcct:      fromAcct,
				ModuleHash:    event.ModuleHash,
				ModuleName:    moduleName,
				RequestKey:    reqKey,
				ToAcct:        toAcct,
				HasTokenId:    tokenId != nil, // Determines if a token ID exists
				TokenId:       tokenId,
				Type:          "poly-fungible",
				// ContractId:  null, // Add if needed
				OrderIndex: index,
			}

			transfers = append(transfers, transfer)
		}
	}

	return transfers
}
