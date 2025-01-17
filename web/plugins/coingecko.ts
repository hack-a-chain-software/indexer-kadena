export default defineNuxtPlugin(async () => {
  const {
    CG_KEY: apiKey,
    CG_URL: baseUrl,
  } = useRuntimeConfig().public;

  const request = async (endpoint: string, params = {}) => {
    const url = new URL(`${baseUrl}/${endpoint}`) as any;

    url.search = new URLSearchParams({ ...params });

    try {
      const response = await fetch(url, {
        headers: {
          'x-cg-pro-api-key': apiKey
        }
      });

      if (!response.ok) {
        console.warn(`HTTP error! status text: ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Fetching CoinGecko API failed:', error);
      return null;
    }
  };

  return {
    provide: {
      coingecko: {
        request,
      },
    },
  };
});
