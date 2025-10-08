import { BaseAction } from '../_base/BaseAction';
import 'colors';

export class ConsoleLogAction extends BaseAction {
    getName(): string {
        return 'log';
    }

    getDescription(): string {
        return 'Affiche un message dans la console du serveur';
    }

    getConfigSchema(): any {
        return {
            message: {
                type: 'string',
                required: true,
                description: 'Le message à afficher dans la console'
            },
            level: {
                type: 'string',
                enum: ['info', 'warn', 'error', 'success'],
                default: 'info',
                description: 'Niveau de log'
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: 'Message affiché (après résolution des placeholders)'
                },
                level: {
                    type: 'string',
                    description: 'Niveau de log utilisé'
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: any): boolean {
        if (!config.message || typeof config.message !== 'string')
            throw new Error('Le champ "message" est requis et doit être une string');
        return true;
    }

    async execute(config: any, context: any): Promise<any> {
        let message = config.message || 'No message provided';
        const level = config.level || 'info';

        // ✨ Support des placeholders avec les outputs précédents
        const previousOutputs = context.previousOutputs || {};
        
        // Collecter toutes les données disponibles
        const allData: any = {};
        for (const nodeId in previousOutputs) {
            Object.assign(allData, previousOutputs[nodeId]);
        }

        // Remplacer les placeholders {{key}} par les valeurs
        for (const [key, value] of Object.entries(allData)) {
            const placeholder = `{{${key}}}`;
            if (message.includes(placeholder)) {
                message = message.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
            }
        }

        switch (level) {
            case 'success':
                console.log(`[Console Action] ${message}`.green);
                break;
            case 'warn':
                console.log(`[Console Action] ${message}`.yellow);
                break;
            case 'error':
                console.log(`[Console Action] ${message}`.red);
                break;
            default:
                console.log(`[Console Action] ${message}`.cyan);
        }
        return { 
            success: true,
            data: { message, level } 
        };
    }
}
