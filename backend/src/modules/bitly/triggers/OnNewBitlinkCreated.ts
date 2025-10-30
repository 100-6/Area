import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { BitlyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import type { BitlyBitlink } from '../BitlyApiService';
import 'colors';

interface NewBitlinkTriggerConfig extends TriggerConfig {
    pollingInterval?: number;
    groupGuid?: string;
}

/**
 * Trigger that fires when a new Bitly link is created
 */
export class OnNewBitlinkCreatedTrigger extends BaseTrigger {
    private bitlyModule: BitlyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private knownBitlinkIds: Map<string, Set<string>> = new Map();
    private groupGuids: Map<string, string> = new Map();
    private areaUsers: Map<string, string> = new Map();

    constructor(bitlyModule: BitlyModule) {
        super();
        this.bitlyModule = bitlyModule;
    }

    getName(): string {
        return 'on_new_bitlink';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new Bitly link is created in your account';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                pollingInterval: {
                    type: 'number',
                    title: 'Polling interval (ms)',
                    description: 'How often to check for new Bitly links (minimum 60 seconds)',
                    default: 120000,
                    minimum: 60000
                },
                groupGuid: {
                    type: 'string',
                    title: 'Group GUID (optional)',
                    description: 'Bitly group GUID to monitor. Leave empty to use your default group.'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Bitlink identifier (e.g., bit.ly/abc123)' },
                link: { type: 'string', description: 'Full short link URL' },
                longUrl: { type: 'string', description: 'Original long URL' },
                title: { type: 'string', description: 'Bitlink title' },
                createdAt: { type: 'string', description: 'Creation timestamp' },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags assigned to the bitlink'
                },
                groupGuid: { type: 'string', description: 'Group GUID where the bitlink was created' },
                deeplinks: {
                    type: 'array',
                    description: 'Associated deep links',
                    items: {
                        type: 'object',
                        properties: {
                            guid: { type: 'string' },
                            bitlink: { type: 'string' },
                            appUriPath: { type: 'string' }
                        }
                    }
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const pollingInterval = (config as NewBitlinkTriggerConfig).pollingInterval;
        if (pollingInterval && pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[Bitly:OnNewBitlink] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[Bitly:OnNewBitlink] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);

        const typedConfig = config as NewBitlinkTriggerConfig;
        const pollingInterval = typedConfig.pollingInterval || 120000;

        try {
            const area = await Area.findById(areaId);
            if (!area) {
                throw new Error(`AREA ${areaId} not found`);
            }

            this.areaUsers.set(areaId, area.user_id);

            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                throw new Error(`Bitly not connected for user ${area.user_id}`);
            }

            const accessToken = bitlyAuth.access_token;
            const apiService = this.bitlyModule.getApiService();

            const resolvedGroupGuid = await this.resolveGroupGuid(accessToken, typedConfig.groupGuid);
            if (!resolvedGroupGuid) {
                throw new Error('Unable to determine Bitly group to monitor');
            }
            this.groupGuids.set(areaId, resolvedGroupGuid);

            await this.initializeKnownBitlinks(areaId, accessToken, resolvedGroupGuid);

            const interval = setInterval(async () => {
                await this.checkForNewBitlinks(areaId);
            }, pollingInterval);

            this.pollingIntervals.set(areaId, interval);
            this.isRunning = true;
            console.log(`[Bitly:OnNewBitlink] Trigger started for AREA ${areaId} (interval ${pollingInterval}ms)`.green);
        } catch (error) {
            console.error(`[Bitly:OnNewBitlink] Failed to start trigger for AREA ${areaId}:`.red, error);
            this.isRunning = false;
            throw error;
        }
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Bitly:OnNewBitlink] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
        }

        this.pollingIntervals.delete(areaId);
        this.knownBitlinkIds.delete(areaId);
        this.groupGuids.delete(areaId);
        this.areaUsers.delete(areaId);

        if (this.pollingIntervals.size === 0) {
            this.isRunning = false;
        }

        console.log(`[Bitly:OnNewBitlink] Trigger stopped for AREA ${areaId}`.green);
    }

    private async resolveGroupGuid(accessToken: string, provided?: string): Promise<string | null> {
        if (provided && provided.trim().length > 0) {
            return provided.trim();
        }
        const apiService = this.bitlyModule.getApiService();
        return await apiService.getDefaultGroupGuid(accessToken);
    }

    private async initializeKnownBitlinks(areaId: string, accessToken: string, groupGuid: string): Promise<void> {
        try {
            const apiService = this.bitlyModule.getApiService();
            const bitlinks = await apiService.getGroupBitlinks(accessToken, groupGuid, 50);
            const ids = new Set<string>(bitlinks.map(bitlink => bitlink.id));
            this.knownBitlinkIds.set(areaId, ids);
            console.log(`[Bitly:OnNewBitlink] Initialized with ${ids.size} existing bitlinks`.gray);
        } catch (error) {
            console.error('[Bitly:OnNewBitlink] Failed to initialize known bitlinks:'.red, error);
            this.knownBitlinkIds.set(areaId, new Set());
        }
    }

    private async checkForNewBitlinks(areaId: string): Promise<void> {
        const userId = this.areaUsers.get(areaId);
        const groupGuid = this.groupGuids.get(areaId);
        if (!userId || !groupGuid) {
            console.warn(`[Bitly:OnNewBitlink] Missing user or group for AREA ${areaId}, stopping trigger`.yellow);
            await this.stop(areaId);
            return;
        }

        try {
            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                console.warn(`[Bitly:OnNewBitlink] Bitly not connected for user ${userId}, stopping trigger`.yellow);
                await this.stop(areaId);
                return;
            }

            const apiService = this.bitlyModule.getApiService();
            const latestBitlinks = await apiService.getGroupBitlinks(bitlyAuth.access_token, groupGuid, 50);
            const knownIds = this.knownBitlinkIds.get(areaId) || new Set<string>();
            const newBitlinks = latestBitlinks.filter(bitlink => !knownIds.has(bitlink.id));

            if (newBitlinks.length > 0) {
                console.log(`[Bitly:OnNewBitlink] Detected ${newBitlinks.length} new bitlink(s)`.green);
            }

            for (const bitlink of newBitlinks.reverse()) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: this.normalizeBitlinkPayload(bitlink, groupGuid)
                };

                await this.emitTrigger(payload);

                knownIds.add(bitlink.id);
            }

            // Keep known IDs manageable (retain most recent 200)
            const retainedIds = latestBitlinks.slice(0, 200).map(bitlink => bitlink.id);
            const trimmedSet = new Set<string>(retainedIds);
            for (const id of knownIds) {
                if (trimmedSet.size >= 200) {
                    break;
                }
                trimmedSet.add(id);
            }
            this.knownBitlinkIds.set(areaId, trimmedSet);
        } catch (error) {
            console.error(`[Bitly:OnNewBitlink] Error while checking for new bitlinks (AREA ${areaId}):`.red, error);
        }
    }

    private normalizeBitlinkPayload(bitlink: BitlyBitlink, groupGuid: string) {
        return {
            id: bitlink.id,
            link: bitlink.link,
            longUrl: bitlink.long_url,
            title: bitlink.title || '',
            createdAt: bitlink.created_at,
            tags: bitlink.tags || [],
            groupGuid,
            deeplinks: (bitlink.deep_links || []).map(deeplink => ({
                guid: deeplink.guid,
                bitlink: deeplink.bitlink,
                appUriPath: deeplink.app_uri_path
            }))
        };
    }
}
