import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { ShodanApiService, ShodanAlert } from '../ShodanApiService';
import 'colors';

/**
 * Configuration de l'action CreateAlert
 */
interface CreateAlertConfig extends ActionConfig {
    apiKey: string;
    name: string;
    ipRange: string;
    expires?: number;
}

/**
 * Action pour créer une alerte réseau sur Shodan
 * Permet de surveiller des IPs/CIDR ranges pour détecter des changements
 */
export class CreateAlert extends BaseAction {
    getName(): string {
        return 'create_alert';
    }

    getDescription(): string {
        return 'Create a network monitoring alert on Shodan';
    }

    /**
     * Schéma de configuration
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['apiKey', 'name', 'ipRange'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'Shodan API Key',
                    description: 'Your Shodan API key (requires membership)',
                    minLength: 32,
                    maxLength: 32
                },
                name: {
                    type: 'string',
                    title: 'Alert Name',
                    description: 'Name for the alert',
                    minLength: 1,
                    maxLength: 100,
                    example: 'My Infrastructure Alert'
                },
                ipRange: {
                    type: 'string',
                    title: 'IP/CIDR Range',
                    description: 'IP address or CIDR range to monitor (supports {{trigger.ip}})',
                    example: '192.168.1.0/24'
                },
                expires: {
                    type: 'number',
                    title: 'Expires (days)',
                    description: 'Number of days until alert expires (0 = never)',
                    default: 0,
                    minimum: 0,
                    maximum: 365
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
                alertId: { type: 'string' },
                name: { type: 'string' },
                ipRange: { type: 'string' },
                created: { type: 'string' },
                expires: { type: 'string' }
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
        const cfg = config as CreateAlertConfig;

        if (!cfg.apiKey || cfg.apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }

        if (!cfg.name || cfg.name.trim() === '') {
            throw new Error('Alert name is required');
        }

        if (cfg.name.length > 100) {
            throw new Error('Alert name must be 100 characters or less');
        }

        if (!cfg.ipRange || cfg.ipRange.trim() === '') {
            throw new Error('IP/CIDR range is required');
        }

        if (cfg.expires !== undefined && (cfg.expires < 0 || cfg.expires > 365)) {
            throw new Error('Expires must be between 0 and 365 days');
        }

        return true;
    }

    /**
     * Exécuter l'action
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = config as CreateAlertConfig;

        console.log(`[Shodan CreateAlert] Executing for AREA ${context.areaId}`.cyan);

        try {
            // Remplacer les variables dans le nom et l'IP range
            const name = this.replaceVariables(cfg.name, context);
            const ipRange = this.replaceVariables(cfg.ipRange, context);

            console.log(`[Shodan CreateAlert] Creating alert: "${name}" for ${ipRange}`.cyan);

            // Valider le format IP/CIDR
            const ipPattern = /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[0-9]{1,2})?)$/;
            if (!ipPattern.test(ipRange)) {
                throw new Error(`Invalid IP/CIDR format: ${ipRange}`);
            }

            // Créer le service Shodan
            const shodanService = new ShodanApiService(cfg.apiKey);

            // Créer l'alerte
            const alert: ShodanAlert = await shodanService.createAlert(
                name,
                ipRange,
                cfg.expires || 0
            );

            console.log(`[Shodan CreateAlert] Alert created with ID: ${alert.id}`.green);

            // Calculer la date d'expiration
            let expiresDate: string | null = null;
            if (cfg.expires && cfg.expires > 0) {
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + cfg.expires);
                expiresDate = expirationDate.toISOString();
            }

            return {
                success: true,
                data: {
                    alertId: alert.id,
                    name: alert.name,
                    ipRange,
                    created: alert.created || new Date().toISOString(),
                    expires: expiresDate
                }
            };

        } catch (error: any) {
            console.error(`[Shodan CreateAlert] Execution failed:`.red, error.message);
            
            // Messages d'erreur spécifiques
            if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('402')) {
                return {
                    success: false,
                    error: 'Shodan API quota exceeded or membership required for alerts'
                };
            }

            return {
                success: false,
                error: error.message
            };
        }
    }
}
