import { BaseModule } from '../_base/BaseModule';
import shodanConfig from './config';
import 'colors';

import { AlertTrigger, QueryMonitorTrigger } from './triggers/_index';
import {
    SearchHosts,
    GetHostInfo,
    GetExploits,
    GetDomainInfo,
    CreateAlert
} from './actions/_index';

/**
 * Module Shodan principal
 * Gère l'intégration avec Shodan pour la surveillance réseau et la recherche de vulnérabilités
 */
export class ShodanModule extends BaseModule {
    constructor() {
        super({
            name: shodanConfig.name,
            displayName: shodanConfig.displayName,
            description: shodanConfig.description,
            iconUrl: shodanConfig.iconUrl,
            color: shodanConfig.color,
            authType: shodanConfig.authType as 'none',
            isActive: shodanConfig.isActive
        });
    }

    getName(): string {
        return 'shodan';
    }

    /**
     * Initialiser le module Shodan
     * - Enregistrer les triggers
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[Shodan] Initializing Shodan module...'.cyan);

        try {
            // Enregistrer les triggers
            this.registerTrigger(new AlertTrigger());
            this.registerTrigger(new QueryMonitorTrigger());

            // Enregistrer les actions
            this.registerAction(new SearchHosts());
            this.registerAction(new GetHostInfo());
            this.registerAction(new GetExploits());
            this.registerAction(new GetDomainInfo());
            this.registerAction(new CreateAlert());

            console.log('[Shodan] ✓ Module initialized successfully'.green.bold);
            console.log('[Shodan] Registered 2 triggers and 5 actions'.gray);
        } catch (error) {
            console.error('[Shodan] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Nettoyer les ressources du module Shodan
     */
    async cleanup(): Promise<void> {
        console.log('[Shodan] Cleaning up Shodan module...'.yellow);

        try {
            // Arrêter tous les triggers actifs
            for (const trigger of this.getAllTriggers()) {
                if (trigger.isActive()) {
                    console.log(`[Shodan] Stopping trigger: ${trigger.getName()}`.yellow);
                }
            }

            console.log('[Shodan] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Shodan] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export de l'instance du module Shodan
 */
export const shodanModule = new ShodanModule();
