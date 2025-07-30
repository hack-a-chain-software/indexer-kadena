package fetch

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go-backfill/config"
	"io"
	"log"
	"net/http"
	"time"
)

type BlockInfo struct {
	Header  Header  `json:"header"`
	Payload Payload `json:"payloadWithOutputs"`
}

type Adjacents map[string]string

type Header struct {
	Nonce           string    `json:"nonce"`
	CreationTime    int64     `json:"creationTime"`
	Parent          string    `json:"parent"`
	Adjacents       Adjacents `json:"adjacents"`
	Target          string    `json:"target"`
	PayloadHash     string    `json:"payloadHash"`
	ChainId         int       `json:"chainId"`
	Weight          string    `json:"weight"`
	Height          int       `json:"height"`
	ChainwebVersion string    `json:"chainwebVersion"`
	EpochStart      int64     `json:"epochStart"`
	FeatureFlags    uint64    `json:"featureFlags"`
	Hash            string    `json:"hash"`
}

type Payload struct {
	Transactions     [][2]string `json:"transactions"`
	MinerData        string      `json:"minerData"`
	TransactionsHash string      `json:"transactionsHash"`
	OutputsHash      string      `json:"outputsHash"`
	PayloadHash      string      `json:"payloadHash"`
	Coinbase         string      `json:"coinbase"`
}

func FetchPayloadsWithHeaders(network string, chainId int, Hash string, minHeight int, maxHeight int) ([]BlockInfo, error) {
	type FetchResponse struct {
		Items []BlockInfo `json:"items"`
	}

	startTime := time.Now()
	env := config.GetConfig()
	endpoint := fmt.Sprintf("%s/%s/chain/%d/block/branch?minheight=%d&maxheight=%d", env.SyncBaseUrl, network, chainId, minHeight, maxHeight)

	param := map[string]interface{}{
		"upper": []string{Hash},
	}

	paramJSON, err := json.Marshal(param)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload hashes to JSON: %v", err)
	}

	attempt := 1
	for attempt <= env.SyncAttemptsMaxRetry {
		req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(paramJSON))
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %v", err)
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Attempt %d: Error making POST request for payloads: %v\n", attempt, err)
			if attempt == env.SyncAttemptsMaxRetry {
				return nil, err
			}

			attempt++
			time.Sleep(time.Duration(env.SyncAttemptsIntervalInMs) * time.Millisecond)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("Attempt %d: Received non-OK HTTP status %d\n", attempt, resp.StatusCode)
			if attempt == env.SyncAttemptsMaxRetry {
				return nil, fmt.Errorf("received non-OK HTTP status: %d", resp.StatusCode)
			}

			attempt++
			time.Sleep(time.Duration(env.SyncAttemptsIntervalInMs) * time.Millisecond)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read response body: %v", err)
		}

		var payload FetchResponse
		err = json.Unmarshal(body, &payload)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal JSON response: %v", err)
		}

		if len(payload.Items) == 0 {
			log.Printf("Attempt %d: No payloads found, retrying...\n", attempt)
			if attempt == env.SyncAttemptsMaxRetry {
				return nil, fmt.Errorf("no payloads found after maximum attempts: %v", err)
			}

			attempt++
			time.Sleep(time.Duration(env.SyncAttemptsIntervalInMs) * time.Millisecond)
			continue
		}

		if env.IsSingleChain {
			log.Printf("Fetched payloads in %fs\n", time.Since(startTime).Seconds())
		}

		return payload.Items, nil
	}

	return nil, fmt.Errorf("failed to fetch payloads after maximum retry attempts: %v", err)
}
