const CHAINWEB_NODE_URL = process.env.CHAINWEB_NODE_URL || '';

export const generateHashes = async (): Promise<string[]> => {
  console.log('Generating hashes to be tested between both apis...');
  const cut = await fetch(`${CHAINWEB_NODE_URL}/mainnet01/cut`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const cutData: any = await cut.json();

  const maxCurrentHeight = Object.values(cutData.hashes).reduce((min: number, hash: any) => {
    return Math.min(min, hash.height);
  }, Infinity);

  const ranges = [
    { min: 1000000, max: 2000000 },
    { min: 2000000, max: 3000000 },
    { min: 3000000, max: 4000000 },
    { min: 4000000, max: 5000000 },
    { min: 5000000, max: 6000000 },
    { min: 6000000, max: maxCurrentHeight },
  ];

  const allNumbers: { chainId: number; blockHeight: number }[] = [];
  ranges.forEach(range => {
    const numbersInRange = Array.from({ length: 20 }, (_, index) => ({
      chainId: index,
      blockHeight: Math.floor(Math.random() * (range.max - range.min)) + range.min,
    }));
    allNumbers.push(...numbersInRange);
  });

  const hashes: string[] = [];
  for (const number of allNumbers) {
    try {
      const response = await fetch(
        `${CHAINWEB_NODE_URL}/mainnet01/chain/${number.chainId}/block/branch?minheight=${number.blockHeight}&maxheight=${number.blockHeight}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            upper: [cutData.hashes[number.chainId].hash],
          }),
        },
      );
      const responseJson = await response.json();

      // Check if the response has the expected structure
      if (responseJson.items && responseJson.items.length > 0 && responseJson.items[0].header) {
        hashes.push(responseJson.items[0].header.hash);
      } else {
        console.warn(`Invalid response structure for number ${number}:`, responseJson);
      }

      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching hash for number ${number}:`, error);
      console.error('Aborting hash generation...');
      throw error;
    }
  }

  console.log('Hashes generated! Starting tests...');
  return hashes;
};
