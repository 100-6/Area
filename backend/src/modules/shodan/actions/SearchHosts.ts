import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { ShodanApiService, ShodanSearchResult } from '../ShodanApiService';
import 'colors';

/**
 * Configuration de l'action SearchHosts
 */
interface SearchHostsConfig extends ActionConfig {
    apiKey: string;
    query: string;
    maxResults?: number;
    page?: number;
}

/**
 * Action pour rechercher des hosts sur Shodan
 * Supporte le templating de variables dans la requête
 */
export class SearchHosts extends BaseAction {
    getName(): string {
        return 'search_hosts';
    }

    getDescription(): string {
        return 'Execute a Shodan search query to find hosts';
    }

    /**
     * Schéma de configuration
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['apiKey', 'query'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'Shodan API Key',
                    description: 'Your Shodan API key',
                    minLength: 32,
                    maxLength: 32
                },
                query: {
                    type: 'string',
                    title: 'Search Query',
                    description: 'Shodan search query (supports variable templating)',
                    minLength: 1,
                    maxLength: 500,
                    example: 'apache country:{{trigger.country}}'
                },
                maxResults: {
                    type: 'number',
                    title: 'Max Results',
                    description: 'Maximum number of results to return',
                    default: 100,
                    minimum: 1,
                    maximum: 1000
                },
                page: {
                    type: 'number',
                    title: 'Page',
                    description: 'Page number for pagination',
                    default: 1,
                    minimum: 1,
                    maximum: 100
                }
            }
        };
    }

    /**
     * Schéma des données retournées
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                hosts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            ip: { type: 'string' },
                            port: { type: 'number' },
                            hostnames: { type: 'array', items: { type: 'string' } },
                            domains: { type: 'array', items: { type: 'string' } },
                            org: { type: 'string' },
                            isp: { type: 'string' },
                            location: {
                                type: 'object',
                                properties: {
                                    country: { type: 'string' },
                                    city: { type: 'string' },
                                    latitude: { type: 'number' },
                                    longitude: { type: 'number' }
                                }
                            },
                            product: { type: 'string' },
                            version: { type: 'string' }
                        }
                    }
                },
                totalResults: { type: 'number' },
                resultsCount: { type: 'number' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    /**
     * Valider la configuration
     */
    validate(config: ActionConfig): boolean {
        const cfg = config as SearchHostsConfig;

        if (!cfg.apiKey || cfg.apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }

        if (!cfg.query || cfg.query.trim() === '') {
            throw new Error('Search query is required');
        }

        if (cfg.maxResults && (cfg.maxResults < 1 || cfg.maxResults > 1000)) {
            throw new Error('Max results must be between 1 and 1000');
        }

        if (cfg.page && (cfg.page < 1 || cfg.page > 100)) {
            throw new Error('Page must be between 1 and 100');
        }

        return true;
    }

    /**
     * Exécuter l'action
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = config as SearchHostsConfig;

        console.log(`[Shodan SearchHosts] Executing for AREA ${context.areaId}`.cyan);

        try {
            // Remplacer les variables dans la requête
            const query = this.replaceVariables(cfg.query, context);
            console.log(`[Shodan SearchHosts] Query: "${query}"`.cyan);

            // Créer le service Shodan
            const shodanService = new ShodanApiService(cfg.apiKey);

            // Effectuer la recherche
            const result: ShodanSearchResult = await shodanService.searchHosts(query, {
                page: cfg.page || 1
            });

            // Limiter le nombre de résultats
            const maxResults = Math.min(cfg.maxResults || 100, result.matches.length);
            const hosts = result.matches.slice(0, maxResults).map(host => ({
                ip: host.ip_str,
                port: host.port,
                hostnames: host.hostnames || [],
                domains: host.domains || [],
                org: host.org || 'Unknown',
                isp: host.isp || 'Unknown',
                location: {
                    country: host.location?.country_code || host.location?.country_name || 'Unknown',
                    city: host.location?.city || 'Unknown',
                    latitude: host.location?.latitude || null,
                    longitude: host.location?.longitude || null
                },
                product: host.product || 'Unknown',
                version: host.version || 'Unknown',
                transport: host.transport || 'tcp',
                timestamp: host.timestamp || new Date().toISOString()
            }));

            console.log(`[Shodan SearchHosts] Found ${hosts.length} hosts (${result.total} total)`.green);

            return {
                success: true,
                data: {
                    hosts,
                    totalResults: result.total,
                    resultsCount: hosts.length
                }
            };

        } catch (error: any) {
            console.error(`[Shodan SearchHosts] Execution failed:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
