package fetch

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go-backfill/config"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

// Payload represents the structure of the payload data
type Payload struct {
	Transactions     [][2]string     `json:"transactions"`
	MinerData        json.RawMessage `json:"minerData"`
	TransactionsHash string          `json:"transactionsHash"`
	OutputsHash      string          `json:"outputsHash"`
	PayloadHash      string          `json:"payloadHash"`
	Coinbase         json.RawMessage `json:"coinbase"`
}

func FetchPayloads(network string, chainId int, payloadHashes []string) ([]Payload, error) {
	env := config.LoadEnv()
	endpoint := fmt.Sprintf("%s/%s/chain/%d/payload/outputs/batch", env.SyncBaseUrl, network, chainId)

	payloadHashesJSON, err := json.Marshal(payloadHashes)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload hashes to JSON: %v", err)
	}

	attempt := 1
	for attempt <= env.SyncAttemptsMaxRetry {
		req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(payloadHashesJSON))
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
			if attempt == SYNC_ATTEMPTS_MAX_RETRY {
				return nil, fmt.Errorf("received non-OK HTTP status: %d", resp.StatusCode)
			}

			attempt++
			time.Sleep(SYNC_ATTEMPTS_INTERVAL_IN_MS * time.Millisecond)
			continue
		}

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read response body: %v", err)
		}

		var payloads []Payload
		err = json.Unmarshal(body, &payloads)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal JSON response: %v", err)
		}

		if len(payloads) == 0 {
			log.Printf("Attempt %d: No payloads found, retrying...\n", attempt)
			if attempt == SYNC_ATTEMPTS_MAX_RETRY {
				return nil, fmt.Errorf("no payloads found after maximum attempts")
			}

			attempt++
			time.Sleep(SYNC_ATTEMPTS_INTERVAL_IN_MS * time.Millisecond)
			continue
		}

		return payloads, nil
	}

	return nil, fmt.Errorf("failed to fetch payloads after maximum retry attempts")
}
