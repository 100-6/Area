import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { OutlookService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un email avec pièce jointe est reçu
 * Utilise le polling pour vérifier les nouveaux emails avec pièces jointes
 */
export class OnEmailWithAttachmentTrigger extends BaseTrigger {
    private outlookService: OutlookService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedMessageId: Map<string, string> = new Map();

    constructor() {
        super();
        this.outlookService = new OutlookService();
    }

    getName(): string {
        return 'on_email_with_attachment';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when an email with attachments is received';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                fileExtension: { type: 'string', description: 'File extension to filter (e.g., .pdf, .docx)' },
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
                subject: { type: 'string', description: 'Email subject' },
                attachments: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Attachment ID' },
                            name: { type: 'string', description: 'Attachment filename' },
                            contentType: { type: 'string', description: 'MIME type' },
                            size: { type: 'number', description: 'Size in bytes' }
                        }
                    },
                    description: 'List of attachments'
                },
                attachmentNames: { type: 'string', description: 'Comma-separated list of all attachment filenames' },
                attachmentCount: { type: 'number', description: 'Total number of attachments' },
                receivedDateTime: { type: 'string', format: 'date-time', description: 'Email received date' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.fileExtension && !config.fileExtension.startsWith('.')) {
            throw new Error('File extension must start with a dot (e.g., .pdf)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnEmailWithAttachment] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnEmailWithAttachment] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeLastCheckedId(areaId, config);
        const pollingInterval = config.pollingInterval || 60000;
        const interval = setInterval(async () => {
            await this.checkForNewEmailsWithAttachments(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnEmailWithAttachment] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnEmailWithAttachment] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedMessageId.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnEmailWithAttachment] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser le dernier ID vérifié
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
                hasAttachment: true,
                maxResults: 1,
                refreshToken
            };
            const messages = await this.outlookService.listMessages(accessToken, filters);
            if (messages.length > 0) {
                this.lastCheckedMessageId.set(areaId, messages[0].id);
                console.log(`[OnEmailWithAttachment] Initialized with last message ID: ${messages[0].id}`.gray);
            }
        } catch (error) {
            console.error(`[OnEmailWithAttachment] Error initializing last checked ID:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux emails avec pièces jointes
     */
    private async checkForNewEmailsWithAttachments(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area) {
                console.error(`[OnEmailWithAttachment] AREA ${areaId} not found`.red);
                return;
            }
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token) {
                console.error(`[OnEmailWithAttachment] Outlook not connected for user ${area.user_id}`.red);
                return;
            }
            const accessToken = outlookAuth.access_token;
            const refreshToken = outlookAuth.refresh_token;
            console.log(`[OnEmailWithAttachment] Checking for new emails with attachments for AREA ${areaId}`.gray);
            const filters: any = {
                hasAttachment: true,
                maxResults: 5,
                refreshToken
            };
            const messages = await this.outlookService.listMessages(accessToken, filters);
            const lastCheckedId = this.lastCheckedMessageId.get(areaId);
            for (const message of messages) {
                if (lastCheckedId && message.id === lastCheckedId) {
                    console.log(`[OnEmailWithAttachment] Already processed message ${message.id}, stopping`.gray);
                    break;
                }
                const attachments = await this.outlookService.getAttachments(accessToken, message.id, refreshToken);
                if (config.fileExtension) {
                    const filteredAttachments = attachments.filter(att =>
                        att.name.toLowerCase().endsWith(config.fileExtension.toLowerCase())
                    );
                    if (filteredAttachments.length === 0) {
                        console.log(`[OnEmailWithAttachment] No attachments with extension ${config.fileExtension} found, skipping`.gray);
                        continue;
                    }
                }
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: message.id,
                        from: message.from,
                        subject: message.subject,
                        attachments: attachments,
                        attachmentNames: attachments.map(att => att.name).join(', '),
                        attachmentCount: attachments.length,
                        receivedDateTime: message.receivedDateTime
                    }
                };
                await this.emitTrigger(payload);
                console.log(`[OnEmailWithAttachment] New email with attachment detected: ${message.subject}`.green);
            }
            if (messages.length > 0)
                this.lastCheckedMessageId.set(areaId, messages[0].id);
        } catch (error) {
            console.error(`[OnEmailWithAttachment] Error checking for new emails:`.red, error);
        }
    }
}
