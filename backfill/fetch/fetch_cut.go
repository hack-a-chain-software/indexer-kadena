package fetch

import (
	"encoding/json"
	"fmt"
	"go-backfill/config"
	"io"
	"log"
	"net/http"
)

type FetchCutResult struct {
	Hashes map[string]struct {
		Height int    `json:"height"`
		Hash   string `json:"hash"`
	} `json:"hashes"`
}

func FetchCut() FetchCutResult {
	env := config.GetConfig()

	endpoint := fmt.Sprintf("%s/%s/cut", env.SyncBaseUrl, env.Network)

	resp, err := http.Get(endpoint)
	if err != nil {
		log.Fatalf("error making GET request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("Unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("error reading response body: %v", err)
	}

	var result FetchCutResult
	err = json.Unmarshal(body, &result)
	if err != nil {
		log.Fatalf("Error parsing JSON response: %v", err)
	}

	return result
}
