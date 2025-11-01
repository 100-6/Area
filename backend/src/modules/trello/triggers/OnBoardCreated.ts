import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TrelloApiService, TrelloBoard } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface OnBoardCreatedConfig extends TriggerConfig {
    boardId?: string;
}

/**
 * Trello board creation detection trigger
 */
export class OnBoardCreatedTrigger extends BaseTrigger {
    private trelloApi: TrelloApiService;
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private knownBoards: Map<string, Set<string>> = new Map();

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'board.created';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new board is created in Trello';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: [],
            properties: {
                boardId: {
                    type: 'string',
                    title: 'Board ID',
                    description: 'Optional: Monitor a specific board (leave empty for all boards)',
                    default: ''
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
                    description: 'ID of the created board'
                },
                boardName: {
                    type: 'string',
                    description: 'Name of the created board'
                },
                boardUrl: {
                    type: 'string',
                    description: 'URL to the board'
                },
                boardDesc: {
                    type: 'string',
                    description: 'Board description'
                },
                createdAt: {
                    type: 'string',
                    description: 'Timestamp when detected'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnBoardCreatedConfig;
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

        try {
            const boards = await this.trelloApi.getBoards(apiKey, token);
            const boardIds = new Set(boards.map(b => b.id));
            this.knownBoards.set(areaId, boardIds);
        } catch (error) {
            console.error(`[Trello] Error fetching initial boards:`.red, error);
            throw error;
        }

        const pollInterval = setInterval(async () => {
            try {
                const boards = await this.trelloApi.getBoards(apiKey, token);
                const currentBoardIds = new Set(boards.map(b => b.id));
                const knownBoardIds = this.knownBoards.get(areaId);

                if (!knownBoardIds) return;

                const newBoardIds = Array.from(currentBoardIds).filter(id => !knownBoardIds.has(id));

                for (const boardId of newBoardIds) {
                    const board = boards.find(b => b.id === boardId);
                    if (!board) continue;

                    console.log(`[Trello] New board created: ${board.name}`.cyan);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            boardId: board.id,
                            boardName: board.name,
                            boardUrl: board.url,
                            boardDesc: board.desc || '',
                            createdAt: new Date().toISOString()
                        }
                    };

                    await this.emitTrigger(payload);
                }

                this.knownBoards.set(areaId, currentBoardIds);
            } catch (error) {
                console.error(`[Trello] Error polling boards:`.red, error);
            }
        }, 60000);

        this.activePolls.set(areaId, pollInterval);
        this.isRunning = true;
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Trello] Stopping board_created trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.knownBoards.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}
