import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { StravaModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to update an existing Strava activity
 */
export class UpdateActivityAction extends BaseAction {
    private stravaModule: StravaModule;

    constructor(stravaModule: StravaModule) {
        super();
        this.stravaModule = stravaModule;
    }

    getName(): string {
        return 'update_activity';
    }

    getDescription(): string {
        return 'Update an existing activity on Strava';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['activityId'],
            properties: {
                activityId: {
                    type: 'number',
                    title: 'Activity ID',
                    description: 'ID of the activity to update'
                },
                name: {
                    type: 'string',
                    title: 'Activity Name',
                    description: 'New name for the activity (optional)'
                },
                type: {
                    type: 'string',
                    title: 'Activity Type',
                    enum: ['Run', 'Ride', 'Swim', 'Walk', 'Hike', 'AlpineSki', 'BackcountrySki', 'Canoeing', 'Crossfit', 'EBikeRide', 'Elliptical', 'Golf', 'Handcycle', 'IceSkate', 'InlineSkate', 'Kayaking', 'Kitesurf', 'NordicSki', 'RockClimbing', 'RollerSki', 'Rowing', 'Snowboard', 'Snowshoe', 'Soccer', 'StairStepper', 'StandUpPaddling', 'Surfing', 'VirtualRide', 'VirtualRun', 'WeightTraining', 'Wheelchair', 'Windsurf', 'Workout', 'Yoga'],
                    description: 'New type of activity (optional)'
                },
                description: {
                    type: 'string',
                    title: 'Description',
                    description: 'New activity description (optional)'
                },
                trainer: {
                    type: 'boolean',
                    title: 'Trainer',
                    description: 'Was this activity on a trainer? (optional)'
                },
                commute: {
                    type: 'boolean',
                    title: 'Commute',
                    description: 'Was this a commute? (optional)'
                },
                gear_id: {
                    type: 'string',
                    title: 'Gear ID',
                    description: 'ID of the gear used (optional)'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the activity was updated successfully' },
                message: { type: 'string', description: 'Status message' },
                activityId: { type: 'number', description: 'ID of the updated activity' },
                activityName: { type: 'string', description: 'Name of the updated activity' }
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
     * Execute the update activity action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[UpdateActivity] Executing action for user ${context.userId}`.cyan);

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

            // Build update object with only provided fields
            const updates: any = {};
            
            if (config.name) {
                updates.name = this.replaceVariables(config.name, context);
            }
            if (config.type) {
                const activityType = this.replaceVariables(config.type, context);
                updates.type = activityType;
                updates.sport_type = activityType; // Use same value as type
            }
            if (config.description) {
                updates.description = this.replaceVariables(config.description, context);
            }
            if (config.trainer !== undefined) {
                updates.trainer = config.trainer;
            }
            if (config.commute !== undefined) {
                updates.commute = config.commute;
            }
            if (config.gear_id) {
                updates.gear_id = this.replaceVariables(config.gear_id, context);
            }

            // Update activity
            const activityId = config.activityId as number;
            const updatedActivity = await apiService.updateActivity(accessToken, activityId, updates);

            console.log(`[UpdateActivity] ✅ Successfully updated activity: ${updatedActivity.name}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully updated activity',
                    activityId: updatedActivity.id,
                    activityName: updatedActivity.name
                }
            };
        } catch (error: any) {
            console.error(`[UpdateActivity] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to update activity'
            };
        }
    }
}
