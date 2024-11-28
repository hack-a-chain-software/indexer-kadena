package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"log"
	"strconv"
)

type GasPriceString string

func (g *GasPriceString) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as a float
	var floatValue float64
	if err := json.Unmarshal(data, &floatValue); err == nil {
		*g = GasPriceString(fmt.Sprintf("%g", floatValue)) // Convert float64 to string
		return nil
	}

	// Try to unmarshal as a string
	var stringValue string
	if err := json.Unmarshal(data, &stringValue); err == nil {
		*g = GasPriceString(stringValue)
		return nil
	}

	return fmt.Errorf("data is neither float64 nor string: %s", string(data))
}

func convertToFloat64(event fetch.Event, index int) (float64, bool) {
	if amountMap, ok := event.Params[index].(map[string]interface{}); ok {
		// Extract the value from the map
		if decimalValue, exists := amountMap["decimal"]; exists {
			switch v := decimalValue.(type) {
			case float64:
				return v, true
			case string:
				parsedValue, err := strconv.ParseFloat(v, 64)
				if err != nil {
					log.Printf("Error: unable to parse decimal string to float64: %v\n", err)
					return 0, false // Return default value and false on error
				}
				return parsedValue, true
			default:
				log.Printf("Error: unexpected type for decimal value: %T\n", v)
				return 0, false
			}
		} else {
			log.Printf("Error: decimal key not found in map: %v\n", amountMap)
			return 0, false
		}
	} else if amountFloat, ok := event.Params[2].(float64); ok {
		// Directly handle if it's already a float64
		return amountFloat, true
	} else {
		log.Printf("Error: event.Params[2] is neither a map nor a float64: %v\n", event.Params[2])
		return 0, false
	}
}

func buildModuleName(namespace, name string) string {
	if namespace != "" {
		return namespace + "." + name
	}
	return name
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
