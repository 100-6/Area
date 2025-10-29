import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { StravaModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to create a new activity on Strava
 */
export class CreateActivityAction extends BaseAction {
    private stravaModule: StravaModule;

    constructor(stravaModule: StravaModule) {
        super();
        this.stravaModule = stravaModule;
    }

    getName(): string {
        return 'create_activity';
    }

    getDescription(): string {
        return 'Create a new manual activity on Strava';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['name', 'type', 'start_date_local', 'elapsed_time'],
            properties: {
                name: {
                    type: 'string',
                    title: 'Activity Name',
                    description: 'Name of the activity'
                },
                type: {
                    type: 'string',
                    title: 'Activity Type',
                    enum: ['Run', 'Ride', 'Swim', 'Walk', 'Hike', 'AlpineSki', 'BackcountrySki', 'Canoeing', 'Crossfit', 'EBikeRide', 'Elliptical', 'Golf', 'Handcycle', 'IceSkate', 'InlineSkate', 'Kayaking', 'Kitesurf', 'NordicSki', 'RockClimbing', 'RollerSki', 'Rowing', 'Snowboard', 'Snowshoe', 'Soccer', 'StairStepper', 'StandUpPaddling', 'Surfing', 'VirtualRide', 'VirtualRun', 'WeightTraining', 'Wheelchair', 'Windsurf', 'Workout', 'Yoga'],
                    description: 'Type of activity'
                },
                start_date_local: {
                    type: 'string',
                    format: 'date-time',
                    title: 'Start Date/Time',
                    description: 'Activity start date and time (date et heure)',
                    example: '2025-10-29T14:30:00',
                    default: new Date().toISOString()
                },
                elapsed_time: {
                    type: 'number',
                    title: 'Elapsed Time',
                    description: 'Total elapsed time in seconds',
                    minimum: 1
                },
                description: {
                    type: 'string',
                    title: 'Description',
                    description: 'Activity description (optional)'
                },
                distance: {
                    type: 'number',
                    title: 'Distance',
                    description: 'Distance in meters (optional)',
                    minimum: 0
                },
                trainer: {
                    type: 'boolean',
                    title: 'Trainer',
                    description: 'Was this activity on a trainer? (optional)',
                    default: false
                },
                commute: {
                    type: 'boolean',
                    title: 'Commute',
                    description: 'Was this a commute? (optional)',
                    default: false
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the activity was created successfully' },
                message: { type: 'string', description: 'Status message' },
                activityId: { type: 'number', description: 'ID of the created activity' },
                activityName: { type: 'string', description: 'Name of the created activity' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['activity:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
            throw new Error('Activity name is required');
        }
        if (!config.type || typeof config.type !== 'string') {
            throw new Error('Activity type is required');
        }
        if (!config.start_date_local || typeof config.start_date_local !== 'string') {
            throw new Error('Start date is required');
        }
        if (!config.elapsed_time || typeof config.elapsed_time !== 'number' || config.elapsed_time < 1) {
            throw new Error('Elapsed time must be at least 1 second');
        }
        return true;
    }

    /**
     * Execute the create activity action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreateActivity] Executing action for user ${context.userId}`.cyan);

            // Get user's Strava access token
            const stravaAuth = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'strava'
            );

            if (!stravaAuth || !stravaAuth.access_token) {
                throw new Error('Strava not connected. Please authenticate with Strava.');
            }

            // Log scopes for debugging
            if (stravaAuth.provider_data) {
                console.log('[CreateActivity] User scopes:'.cyan, (stravaAuth.provider_data as any).scope || 'No scope info');
            }

            const accessToken = stravaAuth.access_token;
            const apiService = this.stravaModule.getApiService();

            // Replace variables in configuration
            const activityType = this.replaceVariables(config.type, context);
            const baseName = this.replaceVariables(config.name, context);
            
            const activityData = {
                name: baseName,
                type: activityType,
                sport_type: activityType, // Use same value as type
                start_date_local: this.replaceVariables(config.start_date_local, context),
                elapsed_time: config.elapsed_time as number,
                description: config.description ? this.replaceVariables(config.description, context) : undefined,
                distance: config.distance as number | undefined,
                trainer: config.trainer as boolean | undefined,
                commute: config.commute as boolean | undefined
            };

            console.log('[CreateActivity] Activity data before API call:'.cyan, JSON.stringify(activityData, null, 2));

            try {
                // Try to create activity
                const createdActivity = await apiService.createActivity(accessToken, activityData);
                
                console.log(`[CreateActivity] ✅ Successfully created activity: ${createdActivity.name}`.green);

                return {
                    success: true,
                    data: {
                        success: true,
                        message: 'Successfully created activity',
                        activityId: createdActivity.id,
                        activityName: createdActivity.name
                    }
                };
            } catch (error: any) {
                // If conflict error, try again with timestamp in name
                if (error.message && error.message.includes('Conflict')) {
                    console.log('[CreateActivity] Conflict detected, retrying with unique name...'.yellow);
                    
                    activityData.name = `${baseName} - ${new Date().toISOString()}`;
                    
                    try {
                        const createdActivity = await apiService.createActivity(accessToken, activityData);
                        
                        console.log(`[CreateActivity] ✅ Successfully created activity with unique name: ${createdActivity.name}`.green);

                        return {
                            success: true,
                            data: {
                                success: true,
                                message: 'Successfully created activity (name was modified to avoid conflict)',
                                activityId: createdActivity.id,
                                activityName: createdActivity.name
                            }
                        };
                    } catch (retryError: any) {
                        console.error(`[CreateActivity] ❌ Retry failed:`.red, retryError);
                        throw retryError;
                    }
                }
                throw error;
            }
        } catch (error: any) {
            console.error(`[CreateActivity] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to create activity'
            };
        }
    }
}
