import axios from 'axios';
import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';

interface ConvertAmountConfig extends ActionConfig {
    amount: number | string;
    fromCurrency: string;
    toCurrency: string;
    date?: string;
}

export class ConvertAmount extends BaseAction {
    getName(): string {
        return 'convert_amount';
    }

    getDescription(): string {
        return 'Convert an amount between currencies using Frankfurter API (free, no API key required).';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['amount', 'fromCurrency', 'toCurrency'],
            properties: {
                amount: {
                    type: 'number',
                    title: 'Amount',
                    description: 'Numeric amount to convert'
                },
                fromCurrency: {
                    type: 'string',
                    title: 'From currency',
                    description: 'Three-letter ISO currency code for the source amount',
                    minLength: 3,
                    maxLength: 3
                },
                toCurrency: {
                    type: 'string',
                    title: 'To currency',
                    description: 'Three-letter ISO currency code for the converted amount',
                    minLength: 3,
                    maxLength: 3
                },
                date: {
                    type: 'string',
                    title: 'Historical date',
                    description: 'Optional historical date (YYYY-MM-DD)',
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                amount: { type: 'number' },
                fromCurrency: { type: 'string' },
                toCurrency: { type: 'string' },
                convertedAmount: {
                    anyOf: [
                        { type: 'number' },
                        { type: 'null' }
                    ]
                },
                rate: {
                    anyOf: [
                        { type: 'number' },
                        { type: 'null' }
                    ]
                },
                date: {
                    anyOf: [
                        { type: 'string' },
                        { type: 'null' }
                    ]
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as ConvertAmountConfig;

        const amount = Number(cfg.amount);
        if (Number.isNaN(amount))
            throw new Error('amount is required and must be a number');
        if (amount < 0)
            throw new Error('amount must be a positive number');

        if (!cfg.fromCurrency || typeof cfg.fromCurrency !== 'string' || cfg.fromCurrency.length !== 3)
            throw new Error('fromCurrency must be a 3-letter ISO code');
        if (!cfg.toCurrency || typeof cfg.toCurrency !== 'string' || cfg.toCurrency.length !== 3)
            throw new Error('toCurrency must be a 3-letter ISO code');

        if (cfg.date) {
            const pattern = /^\d{4}-\d{2}-\d{2}$/;
            if (!pattern.test(cfg.date))
                throw new Error('date must follow YYYY-MM-DD format');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const resolved = this.replaceVariablesInConfig(config, context) as ConvertAmountConfig;
        this.validate(resolved);

        const amount = Number(resolved.amount);
        const fromCurrency = resolved.fromCurrency.toUpperCase();
        const toCurrency = resolved.toCurrency.toUpperCase();

        try {
            // Use Frankfurter API - free and no API key required
            // Supports both latest and historical rates
            let url: string;
            let targetDate = resolved.date && resolved.date.trim() !== '' ? resolved.date : 'latest';
            
            // Build URL: https://api.frankfurter.app/latest?from=USD&to=EUR
            // or historical: https://api.frankfurter.app/2020-01-01?from=USD&to=EUR
            url = `https://api.frankfurter.app/${targetDate}`;

            const params: Record<string, string> = {
                from: fromCurrency,
                to: toCurrency
            };

            const response = await axios.get(url, { params });
            const data = response.data;

            if (!data || !data.rates || !data.rates[toCurrency]) {
                throw new Error(`Unable to get exchange rate from ${fromCurrency} to ${toCurrency}`);
            }

            // Frankfurter returns rate for amount=1, so we multiply by our amount
            const rate = data.rates[toCurrency];
            const convertedAmount = amount * rate;

            return {
                success: true,
                data: {
                    amount,
                    fromCurrency,
                    toCurrency,
                    convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
                    rate: Math.round(rate * 10000) / 10000, // Round to 4 decimals
                    date: data.date || targetDate
                }
            };
        } catch (error: any) {
            // Handle specific error messages
            if (error?.response?.status === 404) {
                throw new Error(`Currency conversion not available. Check that ${resolved.fromCurrency} and ${resolved.toCurrency} are valid currency codes.`);
            }
            const message = error?.response?.data?.message || error?.message || 'Unable to convert currency';
            throw new Error(message);
        }
    }
}
