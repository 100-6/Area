import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { OutlookService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un nouvel email est reçu
 * Utilise le polling pour vérifier les nouveaux emails
 */
export class OnNewEmailTrigger extends BaseTrigger {
    private outlookService: OutlookService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedMessageId: Map<string, string> = new Map();

    constructor() {
        super();
        this.outlookService = new OutlookService();
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
                folderName: { type: 'string' },
                from: { type: 'string', format: 'email' },
                subject: { type: 'string', maxLength: 200 },
                hasAttachment: { type: 'boolean', default: false },
                pollingInterval: { type: 'number', default: 60000, description: 'Polling interval in milliseconds' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Email message ID' },
                from: { type: 'string', description: 'Sender email address' },
                fromName: { type: 'string', description: 'Sender name' },
                to: { type: 'string', description: 'Recipient email address' },
                subject: { type: 'string', description: 'Email subject' },
                bodyPreview: { type: 'string', description: 'Email preview snippet' },
                body: { type: 'string', description: 'Email body content' },
                receivedDateTime: { type: 'string', format: 'date-time', description: 'Email received date' },
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
            this.lastCheckedMessageId.delete(areaId);
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
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token)
                return;
            const accessToken = outlookAuth.access_token;
            const refreshToken = outlookAuth.refresh_token;
            const filters: any = {
                maxResults: 1,
                refreshToken
            };
            if (config.folderName)
                filters.folderName = config.folderName;
            const messages = await this.outlookService.listMessages(accessToken, filters);
            if (messages.length > 0) {
                this.lastCheckedMessageId.set(areaId, messages[0].id);
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
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token) {
                console.error(`[OnNewEmail] Outlook not connected for user ${area.user_id}`.red);
                return;
            }
            const accessToken = outlookAuth.access_token;
            const refreshToken = outlookAuth.refresh_token;
            console.log(`[OnNewEmail] Checking for new emails for AREA ${areaId}`.gray);
            const filters: any = {
                maxResults: 5,
                refreshToken
            };
            if (config.folderName)
                filters.folderName = config.folderName;
            if (config.from)
                filters.from = config.from;
            if (config.subject)
                filters.subject = config.subject;
            if (config.hasAttachment)
                filters.hasAttachment = config.hasAttachment;
            const messages = await this.outlookService.listMessages(accessToken, filters);
            const lastCheckedId = this.lastCheckedMessageId.get(areaId);
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
                this.lastCheckedMessageId.set(areaId, messages[0].id);
        } catch (error) {
            console.error(`[OnNewEmail] Error checking for new emails:`.red, error);
        }
    }
}
