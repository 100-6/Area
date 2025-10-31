import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OutlookService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action: Créer un événement de calendrier via Outlook
 * Crée un événement avec date, heure, lieu et participants
 */
export class CreateCalendarEvent extends BaseAction {
    private outlookService: OutlookService;

    constructor() {
        super();
        this.outlookService = new OutlookService();
    }

    getName(): string {
        return 'create_calendar_event';
    }

    getDescription(): string {
        return 'Create a new event in Outlook calendar';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['subject', 'start', 'end'],
            properties: {
                subject: { type: 'string', maxLength: 255 },
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' },
                location: { type: 'string' },
                body: { type: 'string', maxLength: 5000 },
                attendees: { type: 'string' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Created event ID' },
                webLink: { type: 'string', description: 'Link to view event' },
                createdDateTime: { type: 'string', format: 'date-time', description: 'Creation date and time' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['https://graph.microsoft.com/Calendars.ReadWrite'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.subject || !config.start || !config.end)
            throw new Error('Les champs "subject", "start" et "end" sont requis');

        // Validate ISO 8601 date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
        if (!dateRegex.test(config.start) && !config.start.includes('{{'))
            throw new Error('Le format de "start" doit être ISO 8601 (ex: 2024-01-15T10:00:00)');
        if (!dateRegex.test(config.end) && !config.end.includes('{{'))
            throw new Error('Le format de "end" doit être ISO 8601 (ex: 2024-01-15T11:00:00)');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[CreateCalendarEvent] Executing for AREA ${context.areaId}`.cyan);
            const area = await Area.findById(context.areaId);
            if (!area)
                throw new Error(`AREA ${context.areaId} not found`);
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token)
                throw new Error('Outlook not connected for this user. Please connect your Outlook account.');
            const accessToken = outlookAuth.access_token;
            const refreshToken = outlookAuth.refresh_token;
            // Use the standard replaceVariables method from BaseAction
            const subject = this.replaceVariables(config.subject, context, true);
            const start = this.replaceVariables(config.start, context, true);
            const end = this.replaceVariables(config.end, context, true);
            const location = config.location ? this.replaceVariables(config.location, context) : undefined;
            const body = config.body ? this.replaceVariables(config.body, context) : undefined;
            const attendees = config.attendees ? this.replaceVariables(config.attendees, context) : undefined;
            const result = await this.outlookService.createCalendarEvent(accessToken, subject, start, end, { location, body, attendees, refreshToken });
            const executionTime = Date.now() - startTime;
            console.log(`[CreateCalendarEvent] ✓ Calendar event created: ${subject}`.green);
            return {
                success: true,
                data: {
                    id: result.id,
                    webLink: result.webLink,
                    createdDateTime: result.createdDateTime
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[CreateCalendarEvent] ❌ Failed to create calendar event:`.red, error);
            return { success: false, error: (error as Error).message, executionTime };
        }
    }
}
