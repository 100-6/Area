import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { StravaModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to give kudos to a Strava activity
 */
export class GiveKudosAction extends BaseAction {
    private stravaModule: StravaModule;

    constructor(stravaModule: StravaModule) {
        super();
        this.stravaModule = stravaModule;
    }

    getName(): string {
        return 'give_kudos';
    }

    getDescription(): string {
        return 'Give kudos to a Strava activity';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['activityId'],
            properties: {
                activityId: {
                    type: 'number',
                    title: 'Activity ID',
                    description: 'ID of the activity to give kudos to'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether kudos was given successfully' },
                message: { type: 'string', description: 'Status message' },
                activityId: { type: 'number', description: 'ID of the activity' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['activity:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.activityId || typeof config.activityId !== 'number') {
            throw new Error('Activity ID is required and must be a number');
        }
        return true;
    }

    /**
     * Execute the give kudos action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[GiveKudos] Executing action for user ${context.userId}`.cyan);

            // Get user's Strava access token
            const stravaAuth = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'strava'
            );

            if (!stravaAuth || !stravaAuth.access_token) {
                throw new Error('Strava not connected. Please authenticate with Strava.');
            }

            const accessToken = stravaAuth.access_token;
            const apiService = this.stravaModule.getApiService();

            const activityId = config.activityId as number;

            // Give kudos
            await apiService.giveKudos(accessToken, activityId);

            console.log(`[GiveKudos] ✅ Successfully gave kudos to activity ${activityId}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully gave kudos',
                    activityId: activityId
                }
            };
        } catch (error: any) {
            console.error(`[GiveKudos] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to give kudos'
            };
        }
    }
}
