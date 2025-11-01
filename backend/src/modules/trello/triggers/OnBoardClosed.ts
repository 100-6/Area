import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface OnBoardClosedConfig extends TriggerConfig {
    boardId: string;
}

/**
 * Trello board closed detection trigger
 */
export class OnBoardClosedTrigger extends BaseTrigger {
    private trelloApi: TrelloApiService;
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private wasOpen: Map<string, boolean> = new Map();

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'board.closed';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a board is archived/closed';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['boardId'],
            properties: {
                boardId: {
                    type: 'string',
                    title: 'Board ID',
                    description: 'Trello board ID to monitor',
                    example: '5f4dcc3b5aa765416c5f2ba1'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                boardId: {
                    type: 'string',
                    description: 'ID of the closed board'
                },
                boardName: {
                    type: 'string',
                    description: 'Name of the closed board'
                },
                closed: {
                    type: 'boolean',
                    description: 'Board closed status (always true)'
                },
                closedAt: {
                    type: 'string',
                    description: 'Timestamp when the board was closed'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnBoardClosedConfig;
        if (!cfg.boardId) {
            throw new Error('boardId is required');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnBoardClosedConfig;
        this.validate(cfg);

        const area = await Area.findById(areaId);
        if (!area) {
            throw new Error(`AREA ${areaId} not found`);
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            throw new Error('Trello not connected for this user');
        }

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            throw new Error('TRELLO_API_KEY not configured');
        }

        const token = trelloAuth.access_token;
        const boardId = cfg.boardId;
        console.log(`[Trello] Starting board_closed trigger for board ${boardId}`.green);

        try {
            const board = await this.trelloApi.getBoard(boardId, apiKey, token);
            this.wasOpen.set(areaId, !board.closed);
            console.log(`[Trello] Initial board status: ${board.closed ? 'closed' : 'open'}`.cyan);
        } catch (error) {
            console.error(`[Trello] Error fetching initial board:`.red, error);
            throw error;
        }

        const pollInterval = setInterval(async () => {
            try {
                const board = await this.trelloApi.getBoard(boardId, apiKey, token);
                const wasOpenBefore = this.wasOpen.get(areaId);

                if (wasOpenBefore && board.closed) {
                    console.log(`[Trello] Board closed: ${board.name}`.cyan);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            boardId: board.id,
                            boardName: board.name,
                            closed: true,
                            closedAt: new Date().toISOString()
                        }
                    };

                    await this.emitTrigger(payload);
                    this.wasOpen.set(areaId, false);
                }
            } catch (error) {
                console.error(`[Trello] Error polling board:`.red, error);
            }
        }, 60000);

        this.activePolls.set(areaId, pollInterval);
        this.isRunning = true;
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Trello] Stopping board_closed trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.wasOpen.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}
