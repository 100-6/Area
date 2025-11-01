import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface MoveCardConfig extends ActionConfig {
    cardId: string;
    listId: string;
    position?: 'top' | 'bottom';
}

/**
 * Action to move a card to another list
 */
export class MoveCardAction extends BaseAction {
    private trelloApi: TrelloApiService;

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'card.move';
    }

    getDescription(): string {
        return 'Move a card to another list';
    }

    getRequiredScopes(): string[] {
        return ['read', 'write'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['cardId', 'listId'],
            properties: {
                cardId: {
                    type: 'string',
                    title: 'Card ID',
                    description: 'ID of the card to move',
                    example: '5f4dcc3b5aa765416c5f2ba1'
                },
                listId: {
                    type: 'string',
                    title: 'Destination List ID',
                    description: 'ID of the list where to move the card',
                    example: '5f4dcc3b5aa765416c5f2ba2'
                },
                position: {
                    type: 'string',
                    enum: ['top', 'bottom'],
                    title: 'Position',
                    description: 'Where to place the card in the list',
                    default: 'bottom'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as MoveCardConfig;
        if (!cfg.cardId || cfg.cardId.trim() === '') {
            throw new Error('cardId is required');
        }
        if (!cfg.listId || cfg.listId.trim() === '') {
            throw new Error('listId is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = this.replaceVariablesInConfig(config, context) as MoveCardConfig;

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            throw new Error('TRELLO_API_KEY not configured');
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            throw new Error('Trello not connected for this user');
        }

        const token = trelloAuth.access_token;

        console.log(`[Trello] Moving card ${cfg.cardId} to list ${cfg.listId}`.cyan);

        const card = await this.trelloApi.moveCard(
            apiKey,
            token,
            cfg.cardId,
            cfg.listId,
            cfg.position || 'bottom'
        );

        console.log(`[Trello] ✓ Card moved successfully`.green);

        return {
            success: true,
            data: {
                cardId: card.id,
                cardName: card.name,
                cardUrl: card.url,
                newListId: card.idList
            }
        };
    }
}
