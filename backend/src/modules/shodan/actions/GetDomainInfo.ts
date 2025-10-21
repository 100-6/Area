import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { ShodanApiService, ShodanDomainInfo } from '../ShodanApiService';
import 'colors';

/**
 * Configuration de l'action GetDomainInfo
 */
interface GetDomainInfoConfig extends ActionConfig {
    apiKey: string;
    domain: string;
}

/**
 * Action pour obtenir les informations d'un domaine
 * Récupère les subdomains, DNS records, et IPs associés
 */
export class GetDomainInfo extends BaseAction {
    getName(): string {
        return 'get_domain_info';
    }

    getDescription(): string {
        return 'Get information about a domain (subdomains, DNS records, IPs)';
    }

    /**
     * Schéma de configuration
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['apiKey', 'domain'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'Shodan API Key',
                    description: 'Your Shodan API key',
                    minLength: 32,
                    maxLength: 32
                },
                domain: {
                    type: 'string',
                    title: 'Domain',
                    description: 'Domain name to lookup (supports {{trigger.domain}})',
                    example: 'example.com'
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
                domain: { type: 'string' },
                subdomains: { type: 'array', items: { type: 'string' } },
                ips: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } },
                subdomainCount: { type: 'number' }
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
        const cfg = config as GetDomainInfoConfig;

        if (!cfg.apiKey || cfg.apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }

        if (!cfg.domain || cfg.domain.trim() === '') {
            throw new Error('Domain is required');
        }

        return true;
    }

    /**
     * Exécuter l'action
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = config as GetDomainInfoConfig;

        console.log(`[Shodan GetDomainInfo] Executing for AREA ${context.areaId}`.cyan);

        try {
            // Remplacer les variables dans le domaine
            const domain = this.replaceVariables(cfg.domain, context);
            console.log(`[Shodan GetDomainInfo] Looking up domain: ${domain}`.cyan);

            // Valider le format du domaine
            const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
            if (!domainPattern.test(domain)) {
                throw new Error(`Invalid domain format: ${domain}`);
            }

            // Créer le service Shodan
            const shodanService = new ShodanApiService(cfg.apiKey);

            // Obtenir les informations du domaine
            const domainInfo: ShodanDomainInfo = await shodanService.getDomainInfo(domain);

            console.log(`[Shodan GetDomainInfo] Domain info retrieved for ${domain}`.green);
            console.log(`[Shodan GetDomainInfo] Subdomains found: ${domainInfo.subdomains?.length || 0}`.gray);

            // Extraire les IPs uniques
            const ips: string[] = [];
            if (domainInfo.data) {
                domainInfo.data.forEach(record => {
                    if (record.type === 'A' && record.value && !ips.includes(record.value)) {
                        ips.push(record.value);
                    }
                });
            }

            return {
                success: true,
                data: {
                    domain: domainInfo.domain,
                    subdomains: domainInfo.subdomains || [],
                    ips,
                    tags: domainInfo.tags || [],
                    subdomainCount: domainInfo.subdomains?.length || 0,
                    ipCount: ips.length
                }
            };

        } catch (error: any) {
            console.error(`[Shodan GetDomainInfo] Execution failed:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
