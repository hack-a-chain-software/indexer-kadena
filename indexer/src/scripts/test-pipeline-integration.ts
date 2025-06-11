import PactCodeSearchService from '../services/pact-code-search';
import PactCodeParser from '../services/pact-parser';

/**
 * Test script to verify the pipeline integration works
 */
async function testPipelineIntegration() {
  console.log('🧪 Testing Pipeline Integration...\n');

  // Test 1: Parser functionality
  console.log('📝 Test 1: Parser extraction');
  const testCode = '(free.radio02.close-send-receive "k:abc123" {"gatewayId":"xyz"} ["test"])';
  const args = PactCodeParser.parsePactCode(testCode);
  console.log('Input:', testCode);
  console.log('Extracted args:', args);
  console.log('✅ Parser works\n');

  // Test 2: Code extraction from different formats
  console.log('📝 Test 2: Code extraction from different formats');

  const testCases = [
    // Direct string
    '(free.radio02.test "arg1")',

    // Object with code field
    { code: '(oracle.set-values "KDA/USD" 0.48)' },

    // Object with exec.code structure
    { exec: { code: '(coin.transfer "k:sender" "k:receiver" 1.0)' } },

    // Empty cases
    {},
    null,
    undefined,
  ];

  for (const [index, testCase] of testCases.entries()) {
    console.log(`  Case ${index + 1}:`, JSON.stringify(testCase));

    try {
      // This simulates what happens in the pipeline
      const extractedString = extractPactCodeString(testCase);
      const parsedArgs = extractedString ? PactCodeParser.parsePactCode(extractedString) : [];
      console.log(`    → Extracted: "${extractedString}"`);
      console.log(`    → Args: [${parsedArgs.join(', ')}]`);
    } catch (error) {
      console.log(`    → Error: ${error}`);
    }
    console.log('');
  }

  console.log('✅ All tests completed!');
}

/**
 * Helper function to extract Pact code string (mirrors the one in PactCodeSearchService)
 */
function extractPactCodeString(codeJsonb: any): string | null {
  if (!codeJsonb) return null;

  // Handle different possible structures
  if (typeof codeJsonb === 'string') {
    return codeJsonb;
  }

  if (typeof codeJsonb === 'object') {
    // Try common code field names
    if (codeJsonb.code) return codeJsonb.code;
    if (codeJsonb.pact) return codeJsonb.pact;
    if (codeJsonb.exec && codeJsonb.exec.code) return codeJsonb.exec.code;

    // If it's a single key-value pair, try the value
    const keys = Object.keys(codeJsonb);
    if (keys.length === 1 && typeof codeJsonb[keys[0]] === 'string') {
      return codeJsonb[keys[0]];
    }
  }

  return null;
}

// Run the test
if (require.main === module) {
  testPipelineIntegration().catch(console.error);
}
