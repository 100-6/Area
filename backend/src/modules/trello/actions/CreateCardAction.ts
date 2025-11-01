import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface CreateCardConfig extends ActionConfig {
    listId: string;
    name: string;
    desc?: string;
    position?: 'top' | 'bottom';
}

/**
 * Action to create a new card in a Trello list
 */
export class CreateCardAction extends BaseAction {
    private trelloApi: TrelloApiService;

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'card.create';
    }

    getDescription(): string {
        return 'Create a new card in a Trello list';
    }

    getRequiredScopes(): string[] {
        return ['read', 'write'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['listId', 'name'],
            properties: {
                listId: {
                    type: 'string',
                    title: 'List ID',
                    description: 'ID of the list where to create the card',
                    example: '5f4dcc3b5aa765416c5f2ba1'
                },
                name: {
                    type: 'string',
                    title: 'Card Name',
                    description: 'Title of the card',
                    example: 'New task to complete'
                },
                desc: {
                    type: 'string',
                    title: 'Description',
                    description: 'Card description (optional)',
                    example: 'This is a detailed description of the task'
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
        const cfg = config as CreateCardConfig;
        if (!cfg.listId || cfg.listId.trim() === '') {
            throw new Error('listId is required');
        }
        if (!cfg.name || cfg.name.trim() === '') {
            throw new Error('Card name is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = this.replaceVariablesInConfig(config, context) as CreateCardConfig;

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            throw new Error('TRELLO_API_KEY not configured');
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            throw new Error('Trello not connected for this user');
        }

        const token = trelloAuth.access_token;

        console.log(`[Trello] Creating card: "${cfg.name}" in list ${cfg.listId}`.cyan);

        const card = await this.trelloApi.createCard(
            apiKey,
            token,
            cfg.listId,
            cfg.name,
            cfg.desc,
            cfg.position || 'bottom'
        );

        console.log(`[Trello] ✓ Card created: ${card.url}`.green);

        return {
            success: true,
            data: {
                cardId: card.id,
                cardName: card.name,
                cardUrl: card.url,
                listId: card.idList,
                boardId: card.idBoard
            }
        };
    }
}
