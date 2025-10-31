import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TwitchApiService } from '../TwitchApiService';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a Twitch stream goes live
 * Uses polling to check stream status
 */
export class OnStreamStartTrigger extends BaseTrigger {
    private apiService: TwitchApiService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private streamStates: Map<string, boolean> = new Map(); // Track if stream is live

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'on_stream_start';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when your Twitch stream goes live';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                checkInterval: {
                    type: 'number',
                    default: 60,
                    minimum: 30,
                    maximum: 300,
                    description: 'Check interval in seconds (30-300)'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Stream ID' },
                user_id: { type: 'string', description: 'Broadcaster user ID' },
                user_login: { type: 'string', description: 'Broadcaster login name' },
                user_name: { type: 'string', description: 'Broadcaster display name' },
                game_id: { type: 'string', description: 'Game/Category ID' },
                game_name: { type: 'string', description: 'Game/Category name' },
                type: { type: 'string', description: 'Stream type' },
                title: { type: 'string', description: 'Stream title' },
                viewer_count: { type: 'number', description: 'Current viewer count' },
                started_at: { type: 'string', format: 'date-time', description: 'Stream start time' },
                language: { type: 'string', description: 'Stream language' },
                thumbnail_url: { type: 'string', description: 'Stream thumbnail URL' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const interval = config.checkInterval || 60;
        if (interval < 30 || interval > 300) {
            throw new Error('Check interval must be between 30 and 300 seconds');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnStreamStart] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnStreamStart] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize stream state
        await this.initializeStreamState(areaId);

        const checkInterval = (config.checkInterval || 60) * 1000;

        const interval = setInterval(async () => {
            await this.checkStreamStatus(areaId);
        }, checkInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnStreamStart] Trigger started for AREA ${areaId} with interval ${checkInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnStreamStart] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.streamStates.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnStreamStart] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the current stream state to avoid triggering on already live streams
     */
    private async initializeStreamState(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) return;

            const userData = twitchAuth.provider_data as any;
            const userId = userData.id;

            const stream = await this.apiService.getStream(twitchAuth.access_token, userId);
            this.streamStates.set(areaId, !!stream);

            console.log(`[OnStreamStart] Initialized stream state: ${stream ? 'LIVE' : 'OFFLINE'}`.gray);
        } catch (error) {
            console.error(`[OnStreamStart] Error initializing stream state:`.red, error);
            this.streamStates.set(areaId, false);
        }
    }

    /**
     * Check if stream status has changed
     */
    private async checkStreamStatus(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnStreamStart] AREA ${areaId} not found`.red);
                return;
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                console.error(`[OnStreamStart] Twitch not connected for user ${area.user_id}`.red);
                return;
            }

            const userData = twitchAuth.provider_data as any;
            const userId = userData.id;

            console.log(`[OnStreamStart] Checking stream status for AREA ${areaId}`.gray);

            const stream = await this.apiService.getStream(twitchAuth.access_token, userId);
            const wasLive = this.streamStates.get(areaId) || false;
            const isLive = !!stream;

            // Stream just went live
            if (isLive && !wasLive) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: stream!.id,
                        user_id: stream!.user_id,
                        user_login: stream!.user_login,
                        user_name: stream!.user_name,
                        game_id: stream!.game_id,
                        game_name: stream!.game_name,
                        type: stream!.type,
                        title: stream!.title,
                        viewer_count: stream!.viewer_count,
                        started_at: stream!.started_at,
                        language: stream!.language,
                        thumbnail_url: stream!.thumbnail_url
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnStreamStart] Stream went LIVE: ${stream!.title} - ${stream!.game_name}`.green);
            }

            // Update state
            this.streamStates.set(areaId, isLive);
        } catch (error) {
            console.error(`[OnStreamStart] Error checking stream status:`.red, error);
        }
    }
}
