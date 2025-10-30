import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface DeleteListConfig extends ActionConfig {
    listId: string;
}

/**
 * Action to archive (delete) a Trello list
 */
export class DeleteListAction extends BaseAction {
    private trelloApi: TrelloApiService;

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'list.delete';
    }

    getDescription(): string {
        return 'Archive (close) a list in Trello';
    }

    getRequiredScopes(): string[] {
        return ['read', 'write'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['listId'],
            properties: {
                listId: {
                    type: 'string',
                    title: 'List ID',
                    description: 'ID of the list to archive',
                    example: '5f4dcc3b5aa765416c5f2ba1'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as DeleteListConfig;
        if (!cfg.listId || cfg.listId.trim() === '') {
            throw new Error('listId is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const cfg = this.replaceVariablesInConfig(config, context) as DeleteListConfig;

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            throw new Error('TRELLO_API_KEY not configured');
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            throw new Error('Trello not connected for this user');
        }

        const token = trelloAuth.access_token;

        console.log(`[Trello] Archiving list ${cfg.listId}`.cyan);

        await this.trelloApi.deleteList(apiKey, token, cfg.listId);

        console.log(`[Trello] ✓ List archived successfully`.green);

        return {
            success: true,
            data: {
                listId: cfg.listId,
                archived: true
            }
        };
    }
}
