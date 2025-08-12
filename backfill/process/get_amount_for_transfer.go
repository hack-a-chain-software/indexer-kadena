package process

import (
	"fmt"
	"strconv"
)

func GetAmountForTransfer(amount any) (float64, bool) {
	// Format 1: Direct number (100)
	switch v := amount.(type) {
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case float64:
		return v, true
	case float32:
		return float64(v), true
	}

	// Format 2 & 3: Object with decimal or integer string values
	if amountMap, ok := amount.(map[string]interface{}); ok {
		// Format 2: { decimal: "100.10" }
		if decimalStr, exists := amountMap["decimal"]; exists {
			if str, ok := decimalStr.(string); ok {
				if value, err := strconv.ParseFloat(str, 64); err == nil {
					fmt.Println("decimalStr", decimalStr)
					return value, true
				}
			}
			return 0, false // decimal exists but is not a valid string/number
		}

		// Format 3: { integer: "100.10" }
		if integerStr, exists := amountMap["integer"]; exists {
			if str, ok := integerStr.(string); ok {
				if value, err := strconv.ParseFloat(str, 64); err == nil {
					fmt.Println("integerStr", integerStr)
					return value, true
				}
			}
			return 0, false // integer exists but is not a valid string/number
		}
	}

	// Any other format is invalid
	return 0, false
}
