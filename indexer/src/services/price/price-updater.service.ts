import { PriceService } from './price.service';
import { fetchWithRetry } from '@/utils/http';

type DiaPriceResponse = { Price: number };

export class PriceUpdaterService {
  private static instance: PriceUpdaterService;
  private priceService: PriceService;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly DIA_API_URL =
    'https://api.diadata.org/v1/assetQuotation/Kadena/0x0000000000000000000000000000000000000000';

  private constructor() {
    this.priceService = PriceService.getInstance();
    this.startPriceUpdates();
  }

  public static getInstance(): PriceUpdaterService {
    if (!PriceUpdaterService.instance) {
      PriceUpdaterService.instance = new PriceUpdaterService();
    }
    return PriceUpdaterService.instance;
  }

  public isDiaPriceResponse(value: unknown): value is DiaPriceResponse {
    const v = value as any;
    return !!v && typeof v.Price === 'number' && Number.isFinite(v.Price);
  }

  private async updatePrice(): Promise<void> {
    try {
      const data = await fetchWithRetry<DiaPriceResponse>(this.DIA_API_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'node-fetch',
        },
        operation: 'price.update',
        parseAs: 'json',
      });

      if (!this.isDiaPriceResponse(data)) {
        throw new Error('Invalid DIA response: Price must be a finite number');
      }

      this.priceService.setKdaUsdPrice(data.Price);
    } catch (error) {
      console.warn('[WARN][INT][INT_API] Failed to update KDA/USD price:', error);
    }
  }

  private startPriceUpdates(): void {
    // Initial update
    this.updatePrice();

    // Schedule periodic updates
    setInterval(() => {
      this.updatePrice();
    }, this.UPDATE_INTERVAL);
  }
}
