export interface PactCodeArgs {
  functionName: string | null;
  args: string[];
}

export class PactCodeParser {
  /**
   * Main parser function - extracts searchable arguments from Pact code
   * @param pactCode - Raw Pact code string, e.g. "(free.radio02.close-send-receive \"k:abc123\" [{\"gatewayId\":\"xyz\"}] [])"
   * @returns Array of searchable argument strings
   */
  public static parsePactCode(pactCode: string): string[] {
    if (!pactCode || typeof pactCode !== 'string') {
      return [];
    }

    try {
      // Check if this is a complex expression that needs fallback parsing
      if (this.isComplexExpression(pactCode)) {
        return this.parseWithFallback(pactCode);
      }

      const args: string[] = [];

      // 1. Extract function name (module.function)
      const functionMatch = this.extractFunctionName(pactCode);
      if (functionMatch) {
        args.push(functionMatch);
      }

      // 2. Extract string arguments (but exclude ones that are part of objects)
      const stringArgs = this.extractStringArguments(pactCode);
      const objectKeyValues = this.extractObjectArguments(pactCode);
      const arrayArgs = this.extractArrayArguments(pactCode);

      // Filter out strings that are already part of object key:value pairs or arrays
      const filteredStringArgs = stringArgs.filter(str => {
        return !objectKeyValues.some(kv => kv.includes(str)) && !arrayArgs.includes(str);
      });

      args.push(...filteredStringArgs);

      // 3. Add object key:value pairs
      args.push(...objectKeyValues);

      // 4. Add array arguments
      args.push(...arrayArgs);

      // 5. Filter out encrypted/obfuscated data patterns
      const filteredArgs = args.filter(arg => !this.isEncryptedOrObfuscated(arg));

      // 6. Remove duplicates and filter empty strings
      return [...new Set(filteredArgs)].filter(arg => arg.trim().length > 0);
    } catch (error) {
      console.error('[ERROR][PACT_PARSER] Error parsing Pact code:', error, { pactCode });
      // Fallback to simple parsing if regular parsing fails
      return this.parseWithFallback(pactCode);
    }
  }

  /**
   * Extracts the main function name from Pact code
   * Examples: "(free.radio02.close-send-receive" -> "free.radio02.close-send-receive"
   */
  private static extractFunctionName(pactCode: string): string | null {
    // Match pattern: ( followed by module.function name
    const functionRegex = /^\s*\(\s*([a-zA-Z][a-zA-Z0-9\-_.]*[a-zA-Z0-9])/;
    const match = pactCode.match(functionRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Extracts string arguments from Pact code
   * Examples: "k:abc123", "some-string"
   */
  private static extractStringArguments(pactCode: string): string[] {
    const stringArgs: string[] = [];

    // Match quoted strings, handling escaped quotes
    const stringRegex = /"([^"\\]*(\\.[^"\\]*)*)"/g;
    let match;

    while ((match = stringRegex.exec(pactCode)) !== null) {
      const stringValue = match[1];
      if (stringValue && stringValue.trim().length > 0) {
        // Unescape common escaped characters
        const unescaped = stringValue.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        stringArgs.push(unescaped.trim());
      }
    }

    return stringArgs;
  }

  /**
   * Extracts object key:value pairs as "key:value" strings
   * Examples: {"gatewayId":"xyz","mic":"123"} -> ["gatewayId:xyz", "mic:123"]
   */
  private static extractObjectArguments(pactCode: string): string[] {
    const objectArgs: string[] = [];

    try {
      // Find JSON objects in the code
      const objectRegex = /\{[^{}]*\}/g;
      let match;

      while ((match = objectRegex.exec(pactCode)) !== null) {
        const objectStr = match[0];

        try {
          // Try to parse as JSON
          const obj = JSON.parse(objectStr);

          if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            // Extract key:value pairs
            for (const [key, value] of Object.entries(obj)) {
              if (key && value !== null && value !== undefined) {
                // Convert value to string and create key:value pair
                const valueStr = typeof value === 'string' ? value : String(value);
                if (valueStr.trim().length > 0) {
                  objectArgs.push(`${key}:${valueStr}`);
                }
              }
            }
          }
        } catch (jsonError) {
          // If JSON parsing fails, try to extract key:value pairs manually
          const manualArgs = this.extractKeyValuePairsManually(objectStr);
          objectArgs.push(...manualArgs);
        }
      }
    } catch (error) {
      console.debug('[DEBUG][PACT_PARSER] Error extracting object arguments:', error, { pactCode });
    }

    return objectArgs;
  }

  /**
   * Fallback method to extract key:value pairs when JSON parsing fails
   */
  private static extractKeyValuePairsManually(objectStr: string): string[] {
    const pairs: string[] = [];

    // Match "key":"value" patterns
    const keyValueRegex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
    let match;

    while ((match = keyValueRegex.exec(objectStr)) !== null) {
      const key = match[1];
      const value = match[2];

      if (key && value !== null && value !== undefined) {
        pairs.push(`${key}:${value}`);
      }
    }

    return pairs;
  }

  /**
   * Extracts arguments from array notation like ["KDA/USD"] or [0.48567158228408214]
   */
  private static extractArrayArguments(pactCode: string): string[] {
    const arrayArgs: string[] = [];

    try {
      // Match array patterns [...]
      const arrayRegex = /\[([^\[\]]*)\]/g;
      let match;

      while ((match = arrayRegex.exec(pactCode)) !== null) {
        const arrayContent = match[1].trim();

        if (arrayContent) {
          // Try to parse as JSON array first
          try {
            const parsed = JSON.parse(`[${arrayContent}]`);
            if (Array.isArray(parsed)) {
              parsed.forEach(item => {
                if (item !== null && item !== undefined) {
                  const itemStr = String(item);
                  if (itemStr.trim().length > 0) {
                    arrayArgs.push(itemStr);
                  }
                }
              });
            }
          } catch (jsonError) {
            // If JSON parsing fails, try to extract quoted strings and numbers manually
            const manualArgs = this.extractArrayContentManually(arrayContent);
            arrayArgs.push(...manualArgs);
          }
        }
      }
    } catch (error) {
      console.debug('[DEBUG][PACT_PARSER] Error extracting array arguments:', error, { pactCode });
    }

    return arrayArgs;
  }

  /**
   * Manually extract content from array when JSON parsing fails
   */
  private static extractArrayContentManually(arrayContent: string): string[] {
    const args: string[] = [];

    // Extract quoted strings
    const stringRegex = /"([^"]+)"/g;
    let match;
    while ((match = stringRegex.exec(arrayContent)) !== null) {
      args.push(match[1]);
    }

    // Extract numbers (simple pattern)
    const numberRegex = /\b\d+\.?\d*\b/g;
    while ((match = numberRegex.exec(arrayContent)) !== null) {
      args.push(match[0]);
    }

    return args;
  }

  /**
   * Check if an argument appears to be encrypted or obfuscated data that shouldn't be indexed
   */
  private static isEncryptedOrObfuscated(arg: string): boolean {
    // Skip very long strings (likely encrypted data)
    if (arg.length > 200) {
      return true;
    }

    // Pattern 1: Base64-like strings with ;;;;; delimiter (common in your data)
    // Example: U2FsdGVkX1++waRA0kJKBLlibOXkILWtgpLs/xaOl+c=;;;;;eMVSm88FYouMVhm1QUXUU8I2...
    if (arg.includes(';;;;;') && arg.length > 50) {
      return true;
    }

    // Pattern 2: Very long base64-like strings (contains = padding and alphanumeric+/+)
    const base64Pattern = /^[A-Za-z0-9+/]{40,}={0,2}$/;
    if (base64Pattern.test(arg) && arg.length > 50) {
      return true;
    }

    // Pattern 3: Hex-encoded data (very long hex strings)
    const hexPattern = /^[0-9a-fA-F]{64,}$/;
    if (hexPattern.test(arg)) {
      return true;
    }

    // Pattern 4: Mixed alphanumeric gibberish (random-looking strings with no clear meaning)
    // Long strings with no clear word boundaries, numbers, or recognizable patterns
    if (
      arg.length > 100 &&
      !/[:\-\.]/.test(arg) && // No separators like :, -, .
      !/\s/.test(arg) && // No spaces
      /^[A-Za-z0-9+/=]{50,}$/.test(arg)
    ) {
      // Only alphanumeric + base64 chars
      return true;
    }

    return false;
  }

  /**
   * Check if this is a complex expression that needs fallback parsing
   */
  private static isComplexExpression(pactCode: string): boolean {
    // Look for patterns that indicate complex expressions
    const complexPatterns = [
      /\blet\b/, // let expressions
      /\blet\*\b/, // let* expressions
      /\bif\b/, // if expressions
      /\bcond\b/, // cond expressions
      /\bdefun\b/, // function definitions
      /\bread-msg\b/, // read-msg calls
      /\bread-keyset\b/, // read-keyset calls
      /\bread-integer\b/, // read-integer calls
      /\bread-decimal\b/, // read-decimal calls
    ];

    return complexPatterns.some(pattern => pattern.test(pactCode));
  }

  /**
   * Fallback parser for complex expressions - tokenizes by spaces and extracts meaningful tokens
   */
  private static parseWithFallback(pactCode: string): string[] {
    console.debug('[DEBUG][PACT_PARSER] Using fallback parsing for complex expression');

    const args: string[] = [];

    try {
      // 1. Extract all quoted strings first (these are high-quality)
      const stringArgs = this.extractStringArguments(pactCode);
      args.push(...stringArgs);

      // 2. Clean tokenization - remove punctuation and split properly
      const cleanedCode = pactCode
        .replace(/[()[\]{}'"`,]/g, ' ') // Remove brackets, parens, quotes, commas
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      const tokens = cleanedCode
        .split(' ')
        .map(token => token.trim())
        .filter(token => {
          return (
            token.length > 2 && // Minimum length
            !token.match(/^\d+$/)
          ); // Skip pure numbers
        });

      // 3. Filter out only basic keywords (be more permissive)
      const skipTokens = new Set([
        'let',
        'let*',
        'if',
        'cond',
        'defun',
        'time',
        'true',
        'false',
        'nil',
      ]);

      // 4. Add meaningful tokens (broader capture but clean)
      tokens.forEach(token => {
        // Skip if already captured or is a basic keyword
        if (args.includes(token) || skipTokens.has(token)) {
          return;
        }

        // Accept tokens that are:
        // - Module.function patterns (contain dots)
        // - Word-like tokens with hyphens (read-integer, payment-amount, etc.)
        // - Meaningful identifiers (longer than 3 chars)
        if (token.includes('.') && token.length > 5) {
          args.push(token); // Module functions
        } else if (token.includes('-') && token.length > 3) {
          args.push(token); // Hyphenated words like read-integer, payment-amount
        } else if (token.length > 3 && /^[a-zA-Z][a-zA-Z0-9-]*$/.test(token)) {
          args.push(token); // Clean alphanumeric tokens like amount, precision, policies
        }
      });

      // 5. Remove duplicates and clean up
      const uniqueArgs = [...new Set(args)]
        .filter(arg => arg.trim().length > 0)
        .map(arg => arg.replace(/['"`,]/g, '').trim()) // Final cleanup
        .filter(arg => arg.length > 0)
        .filter(arg => !this.isEncryptedOrObfuscated(arg)); // Filter out encrypted data

      return [...new Set(uniqueArgs)]; // Remove duplicates again after cleanup
    } catch (error) {
      console.error('[ERROR][PACT_PARSER] Fallback parsing failed:', error, { pactCode });
      return [];
    }
  }

  /**
   * Utility method to get detailed parsing results for debugging
   */
  public static parseDetailed(pactCode: string): PactCodeArgs {
    const functionName = this.extractFunctionName(pactCode);
    const args = this.parsePactCode(pactCode);

    return {
      functionName,
      args,
    };
  }
}

// Export for testing
export default PactCodeParser;
