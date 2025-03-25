package process

import (
	"encoding/json"
	"fmt"
	"go-backfill/fetch"
	"log"
	"strconv"
)

type CreationTimeString string

func (c *CreationTimeString) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as a float
	var floatValue float64
	if err := json.Unmarshal(data, &floatValue); err == nil {
		*c = CreationTimeString(strconv.FormatFloat(floatValue, 'f', -1, 64)) // Convert float64 to string
		return nil
	}

	// Try to unmarshal as a string
	var stringValue string
	if err := json.Unmarshal(data, &stringValue); err == nil {
		*c = CreationTimeString(stringValue)
		return nil
	}

	return fmt.Errorf("data is neither float64 nor string: %s", string(data))
}

type TtlString string

func (g *TtlString) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as a string
	var stringValue string
	if err := json.Unmarshal(data, &stringValue); err == nil {
		*g = TtlString(stringValue)
		return nil
	}

	// Try to unmarshal as an integer
	var intValue int
	if err := json.Unmarshal(data, &intValue); err == nil {
		*g = TtlString(fmt.Sprintf("%d", intValue)) // Convert int to string
		return nil
	}

	// Try to unmarshal as a float
	var floatValue float64
	if err := json.Unmarshal(data, &floatValue); err == nil {
		*g = TtlString(fmt.Sprintf("%g", floatValue)) // Convert float to string
		return nil
	}

	// If all attempts fail, return an error
	return fmt.Errorf("data is neither string, int, nor float64: %s", string(data))
}

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

type GasLimit string

func (g *GasLimit) UnmarshalJSON(data []byte) error {
	// Attempt to unmarshal the data as an int
	var intValue int
	if err := json.Unmarshal(data, &intValue); err == nil {
		*g = GasLimit(strconv.Itoa(intValue)) // Convert int to string and assign
		return nil
	}

	// Attempt to unmarshal the data as a float
	var floatValue float64
	if err := json.Unmarshal(data, &floatValue); err == nil {
		*g = GasLimit(fmt.Sprintf("%.0f", floatValue)) // Convert float to int-like string
		return nil
	}

	// Attempt to unmarshal the data as a string
	var stringValue string
	if err := json.Unmarshal(data, &stringValue); err == nil {
		*g = GasLimit(stringValue) // Assign the string value directly
		return nil
	}

	var tempStruct struct {
		Int int `json:"int"`
	}
	if err := json.Unmarshal(data, &tempStruct); err == nil {
		*g = GasLimit(strconv.Itoa(tempStruct.Int)) // Convert int to string and assign
		return nil
	}

	// If neither, return an error
	return fmt.Errorf("data is neither int nor string nor float not { int: <some_number> }: %s", string(data))
}

func convertToFloat64(event fetch.Event, index int) (float64, bool) {
	// Handle if it's a map
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
			case int:
				return float64(v), true
			default:
				log.Printf("Error: unexpected type for decimal value: %T\n", v)
				return 0, false
			}
		} else {
			log.Printf("Error: decimal key not found in map: %v\n", amountMap)
			return 0, false
		}
	}

	// Handle if it's a float64
	if amountFloat, ok := event.Params[index].(float64); ok {
		return amountFloat, true
	}

	// Handle if it's an int
	if amountInt, ok := event.Params[index].(int); ok {
		return float64(amountInt), true
	}

	// If it doesn't match any expected type
	log.Printf("Error: event.Params[%d] is neither a map, float64, nor int: %v\n", index, event.Params[index])
	return 0, false
}

func buildModuleName(namespace *string, name string) string {
	if namespace != nil && *namespace != "" {
		return *namespace + "." + name
	}
	return name
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func approximateSize(v interface{}) int {
	data, err := json.Marshal(v)
	if err != nil {
		log.Printf("Error estimating size: %v\n", err)
		return 0
	}
	return len(data) // Return size in bytes
}
