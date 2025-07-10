package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/repository"
)

// PrepareFungibleBalancesData processes regular token transfers to prepare fungible balance data
func PrepareFungibleBalancesData(transfers []repository.TransferAttributes) []repository.BalanceAttributes {
	// Pre-allocate with estimated size (2 balances per transfer)
	balances := make([]repository.BalanceAttributes, 0, len(transfers)*2)

	// Process transfers
	for _, transfer := range transfers {

		// Add from account if not empty
		if transfer.FromAcct != "" {
			balances = append(balances, repository.BalanceAttributes{
				ChainId:    transfer.ChainId,
				Account:    transfer.FromAcct,
				Module:     transfer.ModuleName,
				HasTokenId: transfer.HasTokenId,
				TokenId:    stringValueOrEmpty(transfer.TokenId),
			})
		}

		// Add to account if not empty
		if transfer.ToAcct != "" {
			balances = append(balances, repository.BalanceAttributes{
				ChainId:    transfer.ChainId,
				Account:    transfer.ToAcct,
				Module:     transfer.ModuleName,
				HasTokenId: transfer.HasTokenId,
				TokenId:    stringValueOrEmpty(transfer.TokenId),
			})
		}
	}

	return balances
}

// PrepareNonFungibleBalancesData processes Marmalade events to prepare NFT balance data
func PrepareNonFungibleBalancesData(events []repository.EventAttributes) ([]repository.BalanceAttributes, error) {
	// Pre-allocate with estimated size (1 balance per mint/transfer event)
	balances := make([]repository.BalanceAttributes, 0, len(events))

	// Process mint and transfer events for Marmalade NFTs
	for _, event := range events {
		var isMarmaladeEvent = event.Module == "marmalade-v2.ledger" || event.Module == "marmalade.ledger"
		var isMarmaladeTransferEvent = event.Name == "TRANSFER"
		var isMarmaladeMintEvent = event.Name == "MINT"
		if isMarmaladeEvent && (isMarmaladeTransferEvent || isMarmaladeMintEvent) {
			var params []interface{}
			if err := json.Unmarshal(event.Params, &params); err != nil {
				return []repository.BalanceAttributes{}, fmt.Errorf("unmarshaling params for event %s: %w", event.RequestKey, err)
			}

			switch event.Name {
			case "MINT":
				if len(params) < 2 {
					continue // Skip if we don't have enough params
				}
				tokenId, ok1 := params[0].(string)
				account, ok2 := params[1].(string)
				if !ok1 || !ok2 {
					continue
				}
				balances = append(balances, repository.BalanceAttributes{
					ChainId:    event.ChainId,
					TokenId:    tokenId,
					Account:    account,
					Module:     event.Module,
					HasTokenId: true,
				})
			case "TRANSFER":
				if len(params) < 3 {
					continue // Skip if we don't have enough params
				}
				tokenId, ok1 := params[0].(string)
				recipient, ok2 := params[2].(string)
				if !ok1 || !ok2 {
					continue
				}
				balances = append(balances, repository.BalanceAttributes{
					ChainId:    event.ChainId,
					TokenId:    tokenId,
					Account:    recipient, // params[2] is the recipient account
					Module:     event.Module,
					HasTokenId: true,
				})
			}
		}
	}

	return balances, nil
}

func stringValueOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
