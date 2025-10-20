import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { ShodanApiService, ShodanHostInfo } from '../ShodanApiService';
import 'colors';

/**
 * Configuration de l'action GetHostInfo
 */
interface GetHostInfoConfig extends ActionConfig {
    apiKey: string;
    ip: string;
    history?: boolean;
}

/**
 * Action pour obtenir les informations détaillées d'un host
 * Supporte le templating de variables pour l'IP (ex: {{trigger.ip}})
 */
export class GetHostInfo extends BaseAction {
    getName(): string {
        return 'get_host_info';
    }

    getDescription(): string {
        return 'Get detailed information about a specific IP address';
    }

    /**
     * Schéma de configuration
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['apiKey', 'ip'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'Shodan API Key',
                    description: 'Your Shodan API key',
                    minLength: 32,
                    maxLength: 32
                },
                ip: {
                    type: 'string',
                    title: 'IP Address',
                    description: 'IP address to lookup (supports {{trigger.ip}})',
                    pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
                    example: '8.8.8.8'
                },
                history: {
                    type: 'boolean',
                    title: 'Include History',
                    description: 'Include historical data',
                    default: false
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
                ip: { type: 'string' },
                ports: { type: 'array', items: { type: 'number' } },
                hostnames: { type: 'array', items: { type: 'string' } },
                domains: { type: 'array', items: { type: 'string' } },
                vulns: { type: 'array', items: { type: 'string' } },
                country: { type: 'string' },
                city: { type: 'string' },
                organization: { type: 'string' },
                isp: { type: 'string' },
                asn: { type: 'string' },
                lastUpdate: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
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
        const cfg = config as GetHostInfoConfig;

        if (!cfg.apiKey || cfg.apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }

        if (!cfg.ip || cfg.ip.trim() === '') {
            throw new Error('IP address is required');
        }

        // Validation basique de l'IP (sera validée plus en détail après le remplacement des variables)
        const ipPattern = /^(?:\{\{.*\}\}|(?:[0-9]{1,3}\.){3}[0-9]{1,3})$/;
        if (!ipPattern.test(cfg.ip)) {
            throw new Error('Invalid IP address format');
        }

        return true;
    }

    /**
     * Exécuter l'action
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = config as GetHostInfoConfig;

        console.log(`[Shodan GetHostInfo] Executing for AREA ${context.areaId}`.cyan);

        try {
            // Remplacer les variables dans l'IP
            const ip = this.replaceVariables(cfg.ip, context);
            console.log(`[Shodan GetHostInfo] Looking up IP: ${ip}`.cyan);

            // Valider l'IP après remplacement
            const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
            if (!ipPattern.test(ip)) {
                throw new Error(`Invalid IP address after variable replacement: ${ip}`);
            }

            // Créer le service Shodan
            const shodanService = new ShodanApiService(cfg.apiKey);

            // Obtenir les informations du host
            const hostInfo: ShodanHostInfo = await shodanService.getHostInfo(ip, {
                history: cfg.history || false
            });

            console.log(`[Shodan GetHostInfo] Host info retrieved for ${ip}`.green);
            console.log(`[Shodan GetHostInfo] Ports: ${hostInfo.ports?.join(', ') || 'none'}`.gray);
            console.log(`[Shodan GetHostInfo] Vulns: ${hostInfo.vulns?.length || 0}`.gray);

            return {
                success: true,
                data: {
                    ip: hostInfo.ip_str,
                    ports: hostInfo.ports || [],
                    hostnames: hostInfo.hostnames || [],
                    domains: hostInfo.domains || [],
                    vulns: hostInfo.vulns || [],
                    country: hostInfo.country_code || 'Unknown',
                    city: hostInfo.city || 'Unknown',
                    organization: hostInfo.org || 'Unknown',
                    isp: hostInfo.isp || 'Unknown',
                    asn: hostInfo.asn || 'Unknown',
                    lastUpdate: hostInfo.last_update || new Date().toISOString(),
                    tags: hostInfo.tags || [],
                    services: hostInfo.data?.map(service => ({
                        port: service.port,
                        transport: service.transport,
                        product: service.product || 'Unknown',
                        version: service.version || 'Unknown'
                    })) || []
                }
            };

        } catch (error: any) {
            console.error(`[Shodan GetHostInfo] Execution failed:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
