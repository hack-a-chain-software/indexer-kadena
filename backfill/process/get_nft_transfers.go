package process

import (
	"go-backfill/fetch"
	"go-backfill/repository"
	"log"
)

func GetNftTransfers(network string, chainId int, events []fetch.Event, reqKey string, transactionId int64) []repository.TransferAttributes {
	const ReconcileSignature = "RECONCILE"
	const TransferNftParamsLength = 4

	transfers := make([]repository.TransferAttributes, 0, len(events))

	for _, event := range events {
		// Check if Namespace is not nil before dereferencing
		var isMarmalade = false
		if event.Module.Namespace != nil {
			isMarmalade = *event.Module.Namespace == "marmalade-v2" || *event.Module.Namespace == "marmalade"
		}
		var hasCorrectParams = len(event.Params) == TransferNftParamsLength
		if (event.Name == ReconcileSignature) && hasCorrectParams && isMarmalade {
			// RECONCILE events have different parameter structure:
			// params[0] = tokenId (string)
			// params[1] = amount
			// params[2] = {account: fromAcct, current: X, previous: Y}
			// params[3] = {account: toAcct, current: X, previous: Y}

			var tokenId *string
			if tokenIdValue, ok := event.Params[0].(string); ok && tokenIdValue != "null" {
				tokenId = &tokenIdValue
			}

			// Extract amount from params[1]
			amount, ok4 := GetAmountForTransfer(event.Params[1])

			// Extract fromAcct from params[2].account
			var fromAcct string
			var ok2 bool
			if params2, ok := event.Params[2].(map[string]interface{}); ok {
				if accountVal, ok := params2["account"].(string); ok {
					fromAcct = accountVal
					ok2 = true
				}
			}

			// Extract toAcct from params[3].account
			var toAcct string
			var ok3 bool
			if params3, ok := event.Params[3].(map[string]interface{}); ok {
				if accountVal, ok := params3["account"].(string); ok {
					toAcct = accountVal
					ok3 = true
				}
			}

			if !ok2 || !ok3 || !ok4 {
				log.Printf("Invalid RECONCILE transfer parameters in event: %+v\n", event)
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
