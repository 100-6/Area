import { BaseTrigger, TriggerConfig } from '../../_base/BaseTrigger';
import { ShodanApiService, ShodanSearchResult } from '../ShodanApiService';
import 'colors';

/**
 * Configuration du trigger QueryMonitorTrigger
 */
interface QueryMonitorConfig extends TriggerConfig {
    apiKey: string;
    query: string;
    pollInterval?: number;
    maxResults?: number;
}

/**
 * Trigger qui surveille une requête de recherche Shodan
 * Se déclenche quand de nouveaux hosts correspondent à la requête
 */
export class QueryMonitorTrigger extends BaseTrigger {
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private seenHosts: Map<string, Set<string>> = new Map(); // areaId -> Set<ip:port>
    private shodanServices: Map<string, ShodanApiService> = new Map();

    getName(): string {
        return 'query_monitor';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Monitor a Shodan search query for new results';
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
                    description: 'Shodan search query (e.g., "apache country:FR", "MongoDB")',
                    minLength: 1,
                    maxLength: 500
                },
                pollInterval: {
                    type: 'number',
                    title: 'Poll Interval (seconds)',
                    description: 'How often to check for new results',
                    default: 3600,
                    minimum: 300,
                    maximum: 86400
                },
                maxResults: {
                    type: 'number',
                    title: 'Max Results',
                    description: 'Maximum number of results to check',
                    default: 100,
                    minimum: 1,
                    maximum: 1000
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
                query: {
                    type: 'string',
                    description: 'Original search query'
                },
                newHosts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            ip: { type: 'string' },
                            port: { type: 'number' },
                            hostnames: { type: 'array', items: { type: 'string' } },
                            location: {
                                type: 'object',
                                properties: {
                                    country: { type: 'string' },
                                    city: { type: 'string' }
                                }
                            },
                            product: { type: 'string' },
                            version: { type: 'string' }
                        }
                    },
                    description: 'Newly discovered hosts'
                },
                totalResults: {
                    type: 'number',
                    description: 'Current total matching hosts'
                },
                newCount: {
                    type: 'number',
                    description: 'Number of new hosts found'
                }
            }
        };
    }

    /**
     * Valider la configuration
     */
    validate(config: TriggerConfig): boolean {
        const cfg = config as QueryMonitorConfig;

        if (!cfg.apiKey || cfg.apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }

        if (!cfg.query || cfg.query.trim() === '') {
            throw new Error('Search query is required');
        }

        if (cfg.pollInterval && (cfg.pollInterval < 300 || cfg.pollInterval > 86400)) {
            throw new Error('Poll interval must be between 300 and 86400 seconds');
        }

        if (cfg.maxResults && (cfg.maxResults < 1 || cfg.maxResults > 1000)) {
            throw new Error('Max results must be between 1 and 1000');
        }

        return true;
    }

    /**
     * Démarrer le trigger
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as QueryMonitorConfig;
        this.validate(cfg);

        console.log(`[Shodan QueryMonitor] Starting for AREA ${areaId}`.cyan);
        console.log(`[Shodan QueryMonitor] Query: "${cfg.query}"`.cyan);

        try {
            // Créer le service Shodan
            const shodanService = new ShodanApiService(cfg.apiKey);
            this.shodanServices.set(areaId, shodanService);

            // Initialiser le set des hosts déjà vus
            this.seenHosts.set(areaId, new Set<string>());

            // Faire une première recherche pour initialiser les hosts vus
            await this.initializeSeenHosts(areaId, cfg, shodanService);

            // Démarrer le polling
            const pollInterval = (cfg.pollInterval || 3600) * 1000;
            const interval = setInterval(async () => {
                await this.checkForNewHosts(areaId, cfg);
            }, pollInterval);

            this.intervals.set(areaId, interval);
            this.isRunning = true;

            console.log(`[Shodan QueryMonitor] Started polling every ${cfg.pollInterval || 3600}s`.green);
        } catch (error: any) {
            console.error(`[Shodan QueryMonitor] Failed to start:`.red, error.message);
            throw error;
        }
    }

    /**
     * Arrêter le trigger
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[Shodan QueryMonitor] Stopping for AREA ${areaId}`.yellow);

        const interval = this.intervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(areaId);
        }

        this.shodanServices.delete(areaId);
        this.seenHosts.delete(areaId);

        if (this.intervals.size === 0) {
            this.isRunning = false;
        }

        console.log(`[Shodan QueryMonitor] Stopped`.green);
    }

    /**
     * Initialiser la liste des hosts déjà vus
     * @private
     */
    private async initializeSeenHosts(
        areaId: string, 
        config: QueryMonitorConfig, 
        shodanService: ShodanApiService
    ): Promise<void> {
        try {
            console.log(`[Shodan QueryMonitor] Initializing seen hosts...`.cyan);
            
            const result: ShodanSearchResult = await shodanService.searchHosts(
                config.query, 
                { page: 1 }
            );

            const seenSet = this.seenHosts.get(areaId);
            if (!seenSet) return;

            // Marquer tous les hosts actuels comme déjà vus
            const maxResults = Math.min(config.maxResults || 100, result.matches.length);
            for (let i = 0; i < maxResults; i++) {
                const host = result.matches[i];
                const hostKey = `${host.ip_str}:${host.port}`;
                seenSet.add(hostKey);
            }

            console.log(`[Shodan QueryMonitor] Initialized with ${seenSet.size} seen hosts`.green);
        } catch (error: any) {
            console.error(`[Shodan QueryMonitor] Initialization failed:`.red, error.message);
            throw error;
        }
    }

    /**
     * Vérifier s'il y a de nouveaux hosts
     * @private
     */
    private async checkForNewHosts(areaId: string, config: QueryMonitorConfig): Promise<void> {
        try {
            const shodanService = this.shodanServices.get(areaId);
            if (!shodanService) {
                console.error(`[Shodan QueryMonitor] No Shodan service found for AREA ${areaId}`.red);
                return;
            }

            console.log(`[Shodan QueryMonitor] Checking for new hosts...`.cyan);

            const result: ShodanSearchResult = await shodanService.searchHosts(
                config.query,
                { page: 1 }
            );

            const seenSet = this.seenHosts.get(areaId);
            if (!seenSet) return;

            const newHosts: any[] = [];
            const maxResults = Math.min(config.maxResults || 100, result.matches.length);

            // Vérifier chaque host
            for (let i = 0; i < maxResults; i++) {
                const host = result.matches[i];
                const hostKey = `${host.ip_str}:${host.port}`;

                if (!seenSet.has(hostKey)) {
                    // Nouveau host détecté !
                    console.log(`[Shodan QueryMonitor] New host found: ${hostKey}`.green.bold);
                    
                    newHosts.push({
                        ip: host.ip_str,
                        port: host.port,
                        hostnames: host.hostnames || [],
                        location: {
                            country: host.location?.country_code || host.location?.country_name || 'Unknown',
                            city: host.location?.city || 'Unknown'
                        },
                        product: host.product || 'Unknown',
                        version: host.version || 'Unknown',
                        org: host.org || 'Unknown',
                        isp: host.isp || 'Unknown'
                    });

                    seenSet.add(hostKey);
                }
            }

            // Si de nouveaux hosts ont été trouvés, émettre le trigger
            if (newHosts.length > 0) {
                console.log(`[Shodan QueryMonitor] Found ${newHosts.length} new host(s)`.green.bold);

                await this.emitTrigger({
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        query: config.query,
                        newHosts,
                        totalResults: result.total,
                        newCount: newHosts.length
                    }
                });
            } else {
                console.log(`[Shodan QueryMonitor] No new hosts found`.gray);
            }

        } catch (error: any) {
            console.error(`[Shodan QueryMonitor] Check failed:`.red, error.message);
        }
    }
}
