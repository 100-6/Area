import { BaseTrigger, TriggerConfig } from '../../_base/BaseTrigger';
import { ShodanApiService, ShodanAlert } from '../ShodanApiService';
import 'colors';

/**
 * Configuration du trigger AlertTrigger
 */
interface AlertTriggerConfig extends TriggerConfig {
    apiKey: string;
    alertId: string;
    pollInterval?: number;
}

/**
 * Trigger qui surveille les alertes réseau Shodan
 * Se déclenche quand une alerte détecte un changement sur une IP surveillée
 */
export class AlertTrigger extends BaseTrigger {
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private lastChecked: Map<string, Date> = new Map();
    private shodanServices: Map<string, ShodanApiService> = new Map();

    getName(): string {
        return 'alert_trigger';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggered when a Shodan network alert fires (monitors IP ranges for changes)';
    }

    /**
     * Schéma de configuration
     * L'utilisateur doit fournir son API key et l'ID de l'alerte à surveiller
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['apiKey', 'alertId'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'Shodan API Key',
                    description: 'Your Shodan API key',
                    minLength: 32,
                    maxLength: 32
                },
                alertId: {
                    type: 'string',
                    title: 'Alert ID',
                    description: 'Shodan alert ID to monitor'
                },
                pollInterval: {
                    type: 'number',
                    title: 'Poll Interval (seconds)',
                    description: 'How often to check for alerts',
                    default: 300,
                    minimum: 60,
                    maximum: 3600
                }
            }
        };
    }

    /**
     * Schéma des données retournées quand le trigger se déclenche
     * Ces données seront disponibles dans context.triggerData pour les actions
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                alertId: {
                    type: 'string',
                    description: 'Shodan alert identifier'
                },
                alertName: {
                    type: 'string',
                    description: 'Name of the alert'
                },
                trigger: {
                    type: 'object',
                    description: 'Alert trigger details',
                    properties: {
                        ip: { type: 'string' },
                        port: { type: 'number' },
                        transport: { type: 'string' }
                    }
                },
                ip: {
                    type: 'string',
                    description: 'IP address that triggered the alert'
                },
                ports: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Open ports detected'
                },
                hostnames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Associated hostnames'
                },
                timestamp: {
                    type: 'string',
                    description: 'When the alert fired'
                }
            }
        };
    }

    /**
     * Valider la configuration fournie par l'utilisateur
     */
    validate(config: TriggerConfig): boolean {
        const cfg = config as AlertTriggerConfig;

        if (!cfg.apiKey || cfg.apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }

        if (!cfg.alertId || cfg.alertId.trim() === '') {
            throw new Error('Alert ID is required');
        }

        if (cfg.pollInterval && (cfg.pollInterval < 60 || cfg.pollInterval > 3600)) {
            throw new Error('Poll interval must be between 60 and 3600 seconds');
        }

        return true;
    }

    /**
     * Démarrer le trigger pour une AREA spécifique
     * Configure le polling pour vérifier les alertes périodiquement
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as AlertTriggerConfig;
        this.validate(cfg);

        console.log(`[Shodan AlertTrigger] Starting for AREA ${areaId}`.cyan);

        try {
            // Créer le service Shodan
            const shodanService = new ShodanApiService(cfg.apiKey);
            this.shodanServices.set(areaId, shodanService);

            // Vérifier que l'alerte existe
            await shodanService.getAlert(cfg.alertId);
            console.log(`[Shodan AlertTrigger] Alert ${cfg.alertId} found`.green);

            // Initialiser la date de dernière vérification
            this.lastChecked.set(areaId, new Date());

            // Démarrer le polling
            const pollInterval = (cfg.pollInterval || 300) * 1000;
            const interval = setInterval(async () => {
                await this.checkAlert(areaId, cfg);
            }, pollInterval);

            this.intervals.set(areaId, interval);
            this.isRunning = true;

            console.log(`[Shodan AlertTrigger] Started polling every ${cfg.pollInterval || 300}s`.green);
        } catch (error: any) {
            console.error(`[Shodan AlertTrigger] Failed to start:`.red, error.message);
            throw error;
        }
    }

    /**
     * Arrêter le trigger
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[Shodan AlertTrigger] Stopping for AREA ${areaId}`.yellow);

        const interval = this.intervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(areaId);
        }

        this.shodanServices.delete(areaId);
        this.lastChecked.delete(areaId);

        if (this.intervals.size === 0) {
            this.isRunning = false;
        }

        console.log(`[Shodan AlertTrigger] Stopped`.green);
    }

    /**
     * Vérifier si l'alerte a été déclenchée
     * @private
     */
    private async checkAlert(areaId: string, config: AlertTriggerConfig): Promise<void> {
        try {
            const shodanService = this.shodanServices.get(areaId);
            if (!shodanService) {
                console.error(`[Shodan AlertTrigger] No Shodan service found for AREA ${areaId}`.red);
                return;
            }

            console.log(`[Shodan AlertTrigger] Checking alert ${config.alertId}`.cyan);

            // Récupérer les informations de l'alerte
            const alert: ShodanAlert = await shodanService.getAlert(config.alertId);

            // Dans une vraie implémentation, Shodan fournirait les triggers récents
            // Ici on simule la vérification en recherchant les IPs de l'alerte
            if (alert.filters?.ip && alert.filters.ip.length > 0) {
                // Pour chaque IP surveillée, vérifier les changements
                for (const ip of alert.filters.ip) {
                    try {
                        const hostInfo = await shodanService.getHostInfo(ip);
                        
                        // Vérifier si c'est une mise à jour récente
                        const lastUpdate = hostInfo.last_update ? new Date(hostInfo.last_update) : null;
                        const lastCheckedDate = this.lastChecked.get(areaId);

                        if (lastUpdate && lastCheckedDate && lastUpdate > lastCheckedDate) {
                            // L'host a été mis à jour depuis la dernière vérification
                            console.log(`[Shodan AlertTrigger] Alert fired for IP ${ip}`.green.bold);

                            await this.emitTrigger({
                                areaId,
                                triggerName: this.getName(),
                                triggerType: this.getType(),
                                timestamp: new Date().toISOString(),
                                data: {
                                    alertId: alert.id,
                                    alertName: alert.name,
                                    trigger: {
                                        ip: hostInfo.ip_str,
                                        port: hostInfo.ports[0] || null,
                                        transport: 'tcp'
                                    },
                                    ip: hostInfo.ip_str,
                                    ports: hostInfo.ports,
                                    hostnames: hostInfo.hostnames || [],
                                    timestamp: new Date().toISOString()
                                }
                            });
                        }
                    } catch (error: any) {
                        // L'IP pourrait ne pas être dans Shodan
                        console.log(`[Shodan AlertTrigger] IP ${ip} not found or error: ${error.message}`.yellow);
                    }
                }
            }

            // Mettre à jour la date de dernière vérification
            this.lastChecked.set(areaId, new Date());

        } catch (error: any) {
            console.error(`[Shodan AlertTrigger] Check failed:`.red, error.message);
        }
    }
}
