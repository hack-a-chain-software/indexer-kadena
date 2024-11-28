package fetch

import (
	"encoding/json"
	"fmt"
	"go-backfill/config"
	"io/ioutil"
	"net/http"
)

// Adjacents represents the adjacents field in each item
type Adjacents map[string]string

// Item represents a single item in the fetched data
type Item struct {
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
	FeatureFlags    int       `json:"featureFlags"`
	Hash            string    `json:"hash"`
}

type FetchResponse struct {
	Items []Item `json:"items"`
}

func FetchHeaders(network string, chainId int, minHeight int, maxHeight int) (FetchResponse, error) {
	env := config.LoadEnv()
	endpoint := fmt.Sprintf("%s/%s/chain/%d/header?minheight=%d&maxheight=%d",
		env.SyncBaseUrl, network, chainId, minHeight, maxHeight)

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return FetchResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Accept", "application/json;blockheader-encoding=object")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return FetchResponse{}, fmt.Errorf("failed to make GET request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return FetchResponse{}, fmt.Errorf("received non-OK HTTP status: %d", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return FetchResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	var fetchResponse FetchResponse
	err = json.Unmarshal(body, &fetchResponse)
	if err != nil {
		return FetchResponse{}, fmt.Errorf("failed to unmarshal JSON response: %v", err)
	}

	return fetchResponse, nil
}
