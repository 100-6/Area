import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface DeleteCardConfig extends ActionConfig {
    cardId: string;
}

/**
 * Action to delete a Trello card
 */
export class DeleteCardAction extends BaseAction {
    private trelloApi: TrelloApiService;

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'card.delete';
    }

    getDescription(): string {
        return 'Delete a card from Trello';
    }

    getRequiredScopes(): string[] {
        return ['read', 'write'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['cardId'],
            properties: {
                cardId: {
                    type: 'string',
                    title: 'Card ID',
                    description: 'ID of the card to delete',
                    example: '5f4dcc3b5aa765416c5f2ba1'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as DeleteCardConfig;
        if (!cfg.cardId || cfg.cardId.trim() === '') {
            throw new Error('cardId is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = this.replaceVariablesInConfig(config, context) as DeleteCardConfig;

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            throw new Error('TRELLO_API_KEY not configured');
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            throw new Error('Trello not connected for this user');
        }

        const token = trelloAuth.access_token;

        console.log(`[Trello] Deleting card ${cfg.cardId}`.cyan);

        await this.trelloApi.deleteCard(apiKey, token, cfg.cardId);

        console.log(`[Trello] ✓ Card deleted successfully`.green);

        return {
            success: true,
            data: {
                cardId: cfg.cardId,
                deleted: true
            }
        };
    }
}
