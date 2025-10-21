import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { OutlookService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un nouvel événement de calendrier est créé
 * Utilise le polling pour vérifier les nouveaux événements
 */
export class OnCalendarEventCreatedTrigger extends BaseTrigger {
    private outlookService: OutlookService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedEventId: Map<string, string> = new Map();

    constructor() {
        super();
        this.outlookService = new OutlookService();
    }

    getName(): string {
        return 'on_calendar_event_created';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new calendar event is created';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                calendarId: { type: 'string', description: 'Monitor a specific calendar (leave empty for default calendar)' },
                pollingInterval: { type: 'number', default: 30000, description: 'Polling interval in milliseconds (default: 5 minutes)' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Event ID' },
                subject: { type: 'string', description: 'Event title/subject' },
                bodyPreview: { type: 'string', description: 'Event description preview' },
                start: {
                    type: 'object',
                    properties: {
                        dateTime: { type: 'string', format: 'date-time', description: 'Start date and time' },
                        timeZone: { type: 'string', description: 'Time zone' }
                    }
                },
                end: {
                    type: 'object',
                    properties: {
                        dateTime: { type: 'string', format: 'date-time', description: 'End date and time' },
                        timeZone: { type: 'string', description: 'Time zone' }
                    }
                },
                location: { type: 'string', description: 'Event location' },
                organizerName: { type: 'string', description: 'Organizer name' },
                organizerEmail: { type: 'string', description: 'Organizer email' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnCalendarEventCreated] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnCalendarEventCreated] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeLastCheckedId(areaId, config);
        const pollingInterval = config.pollingInterval || 300000;
        const interval = setInterval(async () => {
            await this.checkForNewCalendarEvents(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnCalendarEventCreated] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnCalendarEventCreated] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedEventId.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnCalendarEventCreated] Trigger stopped for AREA ${areaId}`.green);
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
                maxResults: 1,
                refreshToken
            };
            if (config.calendarId)
                filters.calendarId = config.calendarId;
            const events = await this.outlookService.listCalendarEvents(accessToken, filters);
            if (events.length > 0) {
                this.lastCheckedEventId.set(areaId, events[0].id);
                console.log(`[OnCalendarEventCreated] Initialized with last event ID: ${events[0].id}`.gray);
            }
        } catch (error) {
            console.error(`[OnCalendarEventCreated] Error initializing last checked ID:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux événements de calendrier
     */
    private async checkForNewCalendarEvents(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area) {
                console.error(`[OnCalendarEventCreated] AREA ${areaId} not found`.red);
                return;
            }
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token) {
                console.error(`[OnCalendarEventCreated] Outlook not connected for user ${area.user_id}`.red);
                return;
            }
            const accessToken = outlookAuth.access_token;
            const refreshToken = outlookAuth.refresh_token;
            console.log(`[OnCalendarEventCreated] Checking for new calendar events for AREA ${areaId}`.gray);
            const filters: any = {
                maxResults: 5,
                refreshToken
            };
            if (config.calendarId)
                filters.calendarId = config.calendarId;
            const events = await this.outlookService.listCalendarEvents(accessToken, filters);
            const lastCheckedId = this.lastCheckedEventId.get(areaId);
            for (const event of events) {
                if (lastCheckedId && event.id === lastCheckedId) {
                    console.log(`[OnCalendarEventCreated] Already processed event ${event.id}, stopping`.gray);
                    break;
                }
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: event
                };
                await this.emitTrigger(payload);
                console.log(`[OnCalendarEventCreated] New calendar event detected: ${event.subject}`.green);
            }
            if (events.length > 0)
                this.lastCheckedEventId.set(areaId, events[0].id);
        } catch (error) {
            console.error(`[OnCalendarEventCreated] Error checking for new calendar events:`.red, error);
        }
    }
}
