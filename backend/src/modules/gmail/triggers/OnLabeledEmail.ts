import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { GmailService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un email reçoit un label spécifique
 * Utilise le polling pour vérifier les emails avec ce label
 */
export class OnLabeledEmailTrigger extends BaseTrigger {
    private gmailService: GmailService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedHistoryId: Map<string, string> = new Map();

    constructor() {
        super();
        this.gmailService = new GmailService();
    }

    getName(): string {
        return 'on_labeled_email';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when an email receives a specific label';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['labelId'],
            properties: {
                labelId: { type: 'string' },
                pollingInterval: { type: 'number', default: 60000, description: 'Polling interval in milliseconds' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Email message ID' },
                threadId: { type: 'string', description: 'Thread ID' },
                from: { type: 'string', description: 'Sender email address' },
                subject: { type: 'string', description: 'Email subject' },
                snippet: { type: 'string', description: 'Email preview snippet' },
                labelId: { type: 'string', description: 'Label that was added' },
                date: { type: 'string', format: 'date-time', description: 'Email date' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.labelId)
            throw new Error('Le champ "labelId" est requis');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnLabeledEmail] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnLabeledEmail] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeLastCheckedId(areaId, config);
        const pollingInterval = config.pollingInterval || 60000;
        const interval = setInterval(async () => {
            await this.checkForLabeledEmails(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnLabeledEmail] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnLabeledEmail] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedHistoryId.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnLabeledEmail] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser le dernier ID vérifié pour éviter de traiter les anciens emails
     */
    private async initializeLastCheckedId(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token)
                return;
            const accessToken = gmailAuth.access_token;
            const refreshToken = gmailAuth.refresh_token;
            const filters: any = {
                maxResults: 1,
                labelIds: [config.labelId],
                refreshToken
            };
            const messages = await this.gmailService.listMessages(accessToken, filters);
            if (messages.length > 0) {
                this.lastCheckedHistoryId.set(areaId, messages[0].id);
                console.log(`[OnLabeledEmail] Initialized with last message ID: ${messages[0].id}`.gray);
            }
        } catch (error) {
            console.error(`[OnLabeledEmail] Error initializing last checked ID:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux emails avec le label spécifique
     */
    private async checkForLabeledEmails(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area) {
                console.error(`[OnLabeledEmail] AREA ${areaId} not found`.red);
                return;
            }
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token) {
                console.error(`[OnLabeledEmail] Gmail not connected for user ${area.user_id}`.red);
                return;
            }
            const accessToken = gmailAuth.access_token;
            const refreshToken = gmailAuth.refresh_token;
            console.log(`[OnLabeledEmail] Checking for labeled emails for AREA ${areaId}`.gray);
            const messages = await this.gmailService.listMessages(accessToken, {
                labelIds: [config.labelId],
                maxResults: 5,
                refreshToken
            });
            const lastCheckedId = this.lastCheckedHistoryId.get(areaId);
            for (const message of messages) {
                if (lastCheckedId && message.id === lastCheckedId) {
                    console.log(`[OnLabeledEmail] Already processed message ${message.id}, stopping`.gray);
                    break;
                }
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: message.id,
                        threadId: message.threadId,
                        from: message.from,
                        subject: message.subject,
                        snippet: message.snippet,
                        labelId: config.labelId,
                        date: message.date
                    }
                };
                await this.emitTrigger(payload);
                console.log(`[OnLabeledEmail] Email with label detected: ${message.subject}`.green);
            }
            if (messages.length > 0)
                this.lastCheckedHistoryId.set(areaId, messages[0].id);
        } catch (error) {
            console.error(`[OnLabeledEmail] Error checking for labeled emails:`.red, error);
        }
    }
}
