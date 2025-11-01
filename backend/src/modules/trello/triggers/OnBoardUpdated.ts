import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TrelloApiService } from '../TrelloApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface OnBoardUpdatedConfig extends TriggerConfig {
    boardId: string;
}

interface BoardSnapshot {
    name: string;
    desc: string;
}

/**
 * Trello board update detection trigger
 */
export class OnBoardUpdatedTrigger extends BaseTrigger {
    private trelloApi: TrelloApiService;
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private boardSnapshots: Map<string, BoardSnapshot> = new Map();

    constructor() {
        super();
        this.trelloApi = new TrelloApiService();
    }

    getName(): string {
        return 'board.updated';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a board name or description is modified';
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
                    description: 'ID of the updated board'
                },
                boardName: {
                    type: 'string',
                    description: 'Current name of the board'
                },
                changes: {
                    type: 'object',
                    description: 'Object containing the changes'
                },
                updatedAt: {
                    type: 'string',
                    description: 'Timestamp when the update was detected'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnBoardUpdatedConfig;
        if (!cfg.boardId) {
            throw new Error('boardId is required');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnBoardUpdatedConfig;
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
        console.log(`[Trello] Starting board_updated trigger for board ${boardId}`.green);

        try {
            const board = await this.trelloApi.getBoard(boardId, apiKey, token);
            this.boardSnapshots.set(areaId, {
                name: board.name,
                desc: board.desc
            });
            console.log(`[Trello] Initial snapshot: ${board.name}`.cyan);
        } catch (error) {
            console.error(`[Trello] Error fetching initial board:`.red, error);
            throw error;
        }

        const pollInterval = setInterval(async () => {
            try {
                const board = await this.trelloApi.getBoard(boardId, apiKey, token);
                const snapshot = this.boardSnapshots.get(areaId);

                if (!snapshot) return;

                const changes: any = {};
                let hasChanges = false;

                if (board.name !== snapshot.name) {
                    changes.name = { old: snapshot.name, new: board.name };
                    hasChanges = true;
                }

                if (board.desc !== snapshot.desc) {
                    changes.desc = { old: snapshot.desc, new: board.desc };
                    hasChanges = true;
                }

                if (hasChanges) {
                    console.log(`[Trello] Board updated: ${board.name}`.cyan);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            boardId: board.id,
                            boardName: board.name,
                            changes,
                            updatedAt: new Date().toISOString()
                        }
                    };

                    await this.emitTrigger(payload);

                    this.boardSnapshots.set(areaId, {
                        name: board.name,
                        desc: board.desc
                    });
                }
            } catch (error) {
                console.error(`[Trello] Error polling board:`.red, error);
            }
        }, 60000);

        this.activePolls.set(areaId, pollInterval);
        this.isRunning = true;
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Trello] Stopping board_updated trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.boardSnapshots.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}
