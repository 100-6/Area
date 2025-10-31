import axios from 'axios';
import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import 'colors';

interface GetPriceSnapshotConfig extends ActionConfig {
    coinId: string;
    vsCurrency: string;
    includeMarketCap?: boolean;
    includeVolume?: boolean;
}

// Mapping of common coin names to CoinGecko IDs
const COIN_NAME_MAP: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'usdt': 'tether',
    'bnb': 'binancecoin',
    'sol': 'solana',
    'xrp': 'ripple',
    'usdc': 'usd-coin',
    'ada': 'cardano',
    'doge': 'dogecoin',
    'avax': 'avalanche-2',
    'dot': 'polkadot',
    'matic': 'matic-network',
    'link': 'chainlink',
    'uni': 'uniswap',
    'atom': 'cosmos'
};

export class GetPriceSnapshot extends BaseAction {
    getName(): string {
        return 'get_price_snapshot';
    }

    getDescription(): string {
        return 'Get current cryptocurrency price and market data from CoinGecko (free API, no key required).';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['coinId', 'vsCurrency'],
            properties: {
                coinId: {
                    type: 'string',
                    title: 'Cryptocurrency',
                    description: 'CoinGecko ID or ticker (e.g., bitcoin, eth, cardano)'
                },
                vsCurrency: {
                    type: 'string',
                    title: 'Currency',
                    description: 'Target currency code (e.g., usd, eur, btc)',
                    default: 'usd'
                },
                includeMarketCap: {
                    type: 'boolean',
                    title: 'Include Market Cap',
                    default: true
                },
                includeVolume: {
                    type: 'boolean',
                    title: 'Include 24h Volume',
                    default: true
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                coinId: { type: 'string', description: 'Cryptocurrency ID' },
                coinName: { type: 'string', description: 'Cryptocurrency name' },
                currency: { type: 'string', description: 'Target currency' },
                price: { type: 'number', description: 'Current price' },
                priceFormatted: { type: 'string', description: 'Formatted price' },
                change24h: { type: 'number', description: '24h change percentage' },
                change24hFormatted: { type: 'string', description: 'Formatted 24h change' },
                marketCap: { type: 'number', description: 'Market capitalization' },
                marketCapFormatted: { type: 'string', description: 'Formatted market cap' },
                volume24h: { type: 'number', description: '24h trading volume' },
                volume24hFormatted: { type: 'string', description: 'Formatted 24h volume' },
                lastUpdatedAt: { type: 'string', description: 'Last update timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as GetPriceSnapshotConfig;

        if (!cfg.coinId || typeof cfg.coinId !== 'string' || cfg.coinId.trim() === '')
            throw new Error('coinId is required and must be a non-empty string');
        if (!cfg.vsCurrency || typeof cfg.vsCurrency !== 'string' || cfg.vsCurrency.trim() === '')
            throw new Error('vsCurrency is required and must be a non-empty string');

        return true;
    }

    private formatPrice(price: number, currency: string): string {
        const currencyUpper = currency.toUpperCase();
        const symbol = currencyUpper === 'USD' ? '$' : currencyUpper === 'EUR' ? '€' : currencyUpper === 'GBP' ? '£' : '';
        
        if (price >= 1) {
            return symbol ? `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                         : `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyUpper}`;
        } else {
            // For small prices, show more decimals
            const decimals = price < 0.01 ? 6 : 4;
            return symbol ? `${symbol}${price.toFixed(decimals)}` 
                         : `${price.toFixed(decimals)} ${currencyUpper}`;
        }
    }

    private formatChange(change: number): string {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
    }

    private formatLargeNumber(num: number | null, currency?: string): string {
        if (num === null) return 'N/A';
        
        const currencyUpper = currency?.toUpperCase() || '';
        const symbol = currencyUpper === 'USD' ? '$' : currencyUpper === 'EUR' ? '€' : currencyUpper === 'GBP' ? '£' : '';
        
        if (num >= 1e12) {
            return symbol ? `${symbol}${(num / 1e12).toFixed(2)}T` : `${(num / 1e12).toFixed(2)}T ${currencyUpper}`;
        } else if (num >= 1e9) {
            return symbol ? `${symbol}${(num / 1e9).toFixed(2)}B` : `${(num / 1e9).toFixed(2)}B ${currencyUpper}`;
        } else if (num >= 1e6) {
            return symbol ? `${symbol}${(num / 1e6).toFixed(2)}M` : `${(num / 1e6).toFixed(2)}M ${currencyUpper}`;
        } else {
            return symbol ? `${symbol}${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}` 
                         : `${num.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currencyUpper}`;
        }
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const resolved = this.replaceVariablesInConfig(config, context) as GetPriceSnapshotConfig;
        this.validate(resolved);

        // Normalize coin ID (handle both tickers and full IDs)
        let coinId = resolved.coinId.toLowerCase().trim();
        if (COIN_NAME_MAP[coinId]) {
            coinId = COIN_NAME_MAP[coinId];
        }

        const vsCurrency = resolved.vsCurrency.toLowerCase().trim();

        // Force market cap and volume to be included by default
        const includeMarketCap = resolved.includeMarketCap !== false;
        const includeVolume = resolved.includeVolume !== false;

        const params: Record<string, any> = {
            ids: coinId,
            vs_currencies: vsCurrency,
            include_24hr_change: true,
            include_last_updated_at: true,
            include_market_cap: includeMarketCap,
            include_24hr_vol: includeVolume
        };

        console.log(`[Crypto] Fetching price for ${coinId} in ${vsCurrency}`.cyan);
        console.log(`[Crypto] Market Cap: ${includeMarketCap}, Volume: ${includeVolume}`.gray);

        try {
            // Use the detailed coins endpoint instead of simple/price for more reliable data
            // The simple/price endpoint often doesn't return market_cap and volume for free tier
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
                params: {
                    localization: false,
                    tickers: false,
                    community_data: false,
                    developer_data: false,
                    sparkline: false
                }
            });
            
            const data = response.data;

            if (!data || !data.market_data) {
                throw new Error(`Market data not available for ${resolved.coinId}`);
            }

            const marketData = data.market_data;
            const currencyKey = vsCurrency;
            
            const price = marketData.current_price?.[currencyKey];
            const change24h = marketData.price_change_percentage_24h ?? null;
            const marketCap = includeMarketCap ? (marketData.market_cap?.[currencyKey] ?? null) : null;
            const volume24h = includeVolume ? (marketData.total_volume?.[currencyKey] ?? null) : null;
            
            console.log(`[Crypto] Extracted - Price: ${price}, MarketCap: ${marketCap}, Volume: ${volume24h}`.gray);
            
            const lastUpdated = data.last_updated 
                ? new Date(data.last_updated).toISOString() 
                : new Date().toISOString();

            if (price === undefined || price === null) {
                throw new Error(`Price not available for ${resolved.coinId} in ${vsCurrency.toUpperCase()}`);
            }

            const coinName = data.name || (coinId.charAt(0).toUpperCase() + coinId.slice(1));

            console.log(`[Crypto] ✓ ${coinName}: ${this.formatPrice(price, vsCurrency)}`.green);

            return {
                success: true,
                data: {
                    coinId,
                    coinName,
                    currency: vsCurrency.toUpperCase(),
                    price,
                    priceFormatted: this.formatPrice(price, vsCurrency),
                    change24h: change24h ?? 0,
                    change24hFormatted: change24h !== null ? this.formatChange(change24h) : 'N/A',
                    marketCap: marketCap ?? 0,
                    marketCapFormatted: this.formatLargeNumber(marketCap, vsCurrency),
                    volume24h: volume24h ?? 0,
                    volume24hFormatted: this.formatLargeNumber(volume24h, vsCurrency),
                    lastUpdatedAt: lastUpdated
                }
            };
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('not available')) {
                throw error;
            }
            const message = error?.response?.data?.error || error?.message || 'Failed to retrieve crypto price';
            throw new Error(message);
        }
    }
}
