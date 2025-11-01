import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface CreateListConfig extends ActionConfig {
    boardId: string;
    name: string;
    position?: 'top' | 'bottom';
}

/**
 * Action to create a new list in a Trello board
 */
export class CreateListAction extends BaseAction {
    private trelloApi: TrelloApiService;

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'list.create';
    }

    getDescription(): string {
        return 'Create a new list in a Trello board';
    }

    getRequiredScopes(): string[] {
        return ['read', 'write'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['boardId', 'name'],
            properties: {
                boardId: {
                    type: 'string',
                    title: 'Board ID',
                    description: 'ID of the board where to create the list',
                    example: '5f4dcc3b5aa765416c5f2ba1'
                },
                name: {
                    type: 'string',
                    title: 'List Name',
                    description: 'Name of the new list',
                    example: 'To Do'
                },
                position: {
                    type: 'string',
                    enum: ['top', 'bottom'],
                    title: 'Position',
                    description: 'Where to place the list in the board',
                    default: 'bottom'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as CreateListConfig;
        if (!cfg.boardId || cfg.boardId.trim() === '') {
            throw new Error('boardId is required');
        }
        if (!cfg.name || cfg.name.trim() === '') {
            throw new Error('List name is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = this.replaceVariablesInConfig(config, context) as CreateListConfig;

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            throw new Error('TRELLO_API_KEY not configured');
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            throw new Error('Trello not connected for this user');
        }

        const token = trelloAuth.access_token;

        console.log(`[Trello] Creating list: "${cfg.name}" in board ${cfg.boardId}`.cyan);

        const list = await this.trelloApi.createList(
            apiKey,
            token,
            cfg.boardId,
            cfg.name,
            cfg.position || 'bottom'
        );

        console.log(`[Trello] ✓ List created: ${list.name}`.green);

        return {
            success: true,
            data: {
                listId: list.id,
                listName: list.name,
                boardId: list.idBoard
            }
        };
    }
}
