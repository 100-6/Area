import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { GmailService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un nouvel email est reçu
 * Utilise le polling pour vérifier les nouveaux emails
 */
export class OnNewEmailTrigger extends BaseTrigger {
    private gmailService: GmailService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedHistoryId: Map<string, string> = new Map();

    constructor() {
        super();
        this.gmailService = new GmailService();
    }

    getName(): string {
        return 'on_new_email';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new email is received in your inbox';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                from: { type: 'string', format: 'email' },
                subject: { type: 'string', maxLength: 200 },
                hasAttachment: { type: 'boolean', default: false },
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
                to: { type: 'string', description: 'Recipient email address' },
                subject: { type: 'string', description: 'Email subject' },
                snippet: { type: 'string', description: 'Email preview snippet' },
                body: { type: 'string', description: 'Email body content' },
                date: { type: 'string', format: 'date-time', description: 'Email date' },
                labels: { type: 'array', items: { type: 'string' }, description: 'Email labels' },
                hasAttachments: { type: 'boolean', description: 'Whether email has attachments' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.from && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.from)) {
            throw new Error('L\'adresse email "from" est invalide');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewEmail] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewEmail] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeLastCheckedId(areaId, config);
        const pollingInterval = config.pollingInterval || 60000;
        const interval = setInterval(async () => {
            await this.checkForNewEmails(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewEmail] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewEmail] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedHistoryId.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnNewEmail] Trigger stopped for AREA ${areaId}`.green);
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
                refreshToken
            };
            if (config.labelId)
                filters.labelIds = [config.labelId];
            else
                filters.labelIds = ['INBOX'];
            const messages = await this.gmailService.listMessages(accessToken, filters);
            if (messages.length > 0) {
                this.lastCheckedHistoryId.set(areaId, messages[0].id);
                console.log(`[OnNewEmail] Initialized with last message ID: ${messages[0].id}`.gray);
            }
        } catch (error) {
            console.error(`[OnNewEmail] Error initializing last checked ID:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux emails
     */
    private async checkForNewEmails(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area) {
                console.error(`[OnNewEmail] AREA ${areaId} not found`.red);
                return;
            }
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token) {
                console.error(`[OnNewEmail] Gmail not connected for user ${area.user_id}`.red);
                return;
            }
            const accessToken = gmailAuth.access_token;
            const refreshToken = gmailAuth.refresh_token;
            console.log(`[OnNewEmail] Checking for new emails for AREA ${areaId}`.gray);
            const filters: any = {
                maxResults: 5,
                refreshToken
            };
            if (config.from)
                filters.from = config.from;
            if (config.subject)
                filters.subject = config.subject;
            if (config.hasAttachment)
                filters.hasAttachment = config.hasAttachment;
            if (config.labelId)
                filters.labelIds = [config.labelId];
            else
                filters.labelIds = ['INBOX'];
            const messages = await this.gmailService.listMessages(accessToken, filters);
            const lastCheckedId = this.lastCheckedHistoryId.get(areaId);
            for (const message of messages) {
                if (lastCheckedId && message.id === lastCheckedId) {
                    console.log(`[OnNewEmail] Already processed message ${message.id}, stopping`.gray);
                    break;
                }
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: message
                };
                await this.emitTrigger(payload);
                console.log(`[OnNewEmail] New email detected: ${message.subject}`.green);
            }
            if (messages.length > 0)
                this.lastCheckedHistoryId.set(areaId, messages[0].id);
        } catch (error) {
            console.error(`[OnNewEmail] Error checking for new emails:`.red, error);
        }
    }
}
