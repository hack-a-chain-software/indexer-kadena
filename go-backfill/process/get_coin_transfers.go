package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
)

func GetCoinTransfers(
	events []fetch.Event,
	payloadHash string,
	chainId int,
	requestKey string,
	transactionId int64,
) []repository.TransferAttributes {
	const TransferCoinSignature = "TRANSFER"
	const TransferCoinParamsLength = 3

	transfers := make([]repository.TransferAttributes, 0, len(events))

	for index, event := range events {
		if event.Name == TransferCoinSignature && len(event.Params) == TransferCoinParamsLength {
			fromAcct, ok1 := event.Params[0].(string)
			toAcct, ok2 := event.Params[1].(string)
			amount, ok3 := convertToFloat64(event, 2)

			// Ensure all parameters are of the expected types
			if !ok1 || !ok2 || !ok3 {
				log.Printf("Skipping event due to invalid parameter types: %+v\n", payloadHash)
				continue
			}

			module := ""
			if event.Module.Namespace != "" {
				module = event.Module.Namespace + "." + event.Module.Name
			}

			// Build the transfer attributes
			transfer := repository.TransferAttributes{
				TransactionId: transactionId,
				Amount:        amount,
				PayloadHash:   payloadHash,
				ChainId:       chainId,
				FromAcct:      fromAcct,
				ModuleHash:    event.ModuleHash,
				ModuleName:    module,
				RequestKey:    requestKey,
				ToAcct:        toAcct,
				HasTokenId:    false,
				TokenId:       nil,
				Type:          "fungible",
				ContractId:    nil,
				OrderIndex:    index,
			}

			transfers = append(transfers, transfer)
		}
	}

	return transfers
}
