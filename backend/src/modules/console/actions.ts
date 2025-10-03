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

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: any): boolean {
        if (!config.message || typeof config.message !== 'string')
            throw new Error('Le champ "message" est requis et doit être une string');
        return true;
    }

    async execute(config: any, context: any): Promise<any> {
        const message = config.message || 'No message provided';
        const level = config.level || 'info';

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
        return { success: true, message, level };
    }
}
