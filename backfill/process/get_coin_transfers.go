package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
)

func GetCoinTransfers(
	events []fetch.Event,
	chainId int,
	requestKey string,
	transactionId int64,
) []repository.TransferAttributes {
	const TransferCoinSignature = "TRANSFER"
	const TransferCoinParamsLength = 3

	transfers := make([]repository.TransferAttributes, 0, len(events))

	for _, event := range events {
		if event.Name == TransferCoinSignature && len(event.Params) == TransferCoinParamsLength {
			fromAcct, ok1 := event.Params[0].(string)
			toAcct, ok2 := event.Params[1].(string)
			amount, valid := GetAmountForTransfer(event.Params[2])

			// Ensure all parameters are of the expected types
			if !ok1 || !ok2 || !valid {
				log.Printf("Skipping event due to invalid parameter types: %+v\n", requestKey)
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
				RequestKey:    requestKey,
				ToAcct:        toAcct,
				HasTokenId:    false,
				TokenId:       nil,
				Type:          "fungible",
				OrderIndex:    len(transfers),
			}

			transfers = append(transfers, transfer)
		}
	}

	return transfers
}
