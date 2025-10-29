import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { StravaModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new activity is recorded on Strava
 * Uses polling to check for newly created activities
 */
export class OnNewActivityTrigger extends BaseTrigger {
    private stravaModule: StravaModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownActivityIds: Map<string, Set<number>> = new Map();

    constructor(stravaModule: StravaModule) {
        super();
        this.stravaModule = stravaModule;
    }

    getName(): string {
        return 'on_new_activity';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you record a new activity on Strava (run, ride, swim, etc.)';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                pollingInterval: { 
                    type: 'number', 
                    default: 300000, 
                    minimum: 60000,
                    description: 'Polling interval in milliseconds (minimum 1 minute)'
                },
                activityType: {
                    type: 'string',
                    enum: ['', 'Run', 'Ride', 'Swim', 'Walk', 'Hike', 'AlpineSki', 'BackcountrySki', 'Canoeing', 'Crossfit', 'EBikeRide', 'Elliptical', 'Golf', 'Handcycle', 'IceSkate', 'InlineSkate', 'Kayaking', 'Kitesurf', 'NordicSki', 'RockClimbing', 'RollerSki', 'Rowing', 'Snowboard', 'Snowshoe', 'Soccer', 'StairStepper', 'StandUpPaddling', 'Surfing', 'VirtualRide', 'VirtualRun', 'WeightTraining', 'Wheelchair', 'Windsurf', 'Workout', 'Yoga'],
                    default: '',
                    description: 'Filter by activity type (empty = all types)'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'number', description: 'Activity ID' },
                name: { type: 'string', description: 'Activity name' },
                type: { type: 'string', description: 'Activity type (Run, Ride, etc.)' },
                sport_type: { type: 'string', description: 'Detailed sport type' },
                distance: { type: 'number', description: 'Distance in meters' },
                moving_time: { type: 'number', description: 'Moving time in seconds' },
                elapsed_time: { type: 'number', description: 'Elapsed time in seconds' },
                total_elevation_gain: { type: 'number', description: 'Total elevation gain in meters' },
                start_date: { type: 'string', description: 'Start date/time (ISO format)' },
                start_date_local: { type: 'string', description: 'Local start date/time' },
                average_speed: { type: 'number', description: 'Average speed in m/s' },
                max_speed: { type: 'number', description: 'Max speed in m/s' },
                average_heartrate: { type: 'number', description: 'Average heart rate (if available)' },
                max_heartrate: { type: 'number', description: 'Max heart rate (if available)' },
                calories: { type: 'number', description: 'Calories burned (if available)' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.pollingInterval && config.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 1 minute (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewActivity] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewActivity] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current activities to avoid triggering on existing ones
        await this.initializeKnownActivities(areaId);

        const pollingInterval = config.pollingInterval || 300000;

        const interval = setInterval(async () => {
            await this.checkForNewActivities(areaId, config);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewActivity] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewActivity] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownActivityIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewActivity] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of current activities to avoid triggering on existing ones
     */
    private async initializeKnownActivities(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const stravaAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'strava');
            if (!stravaAuth || !stravaAuth.access_token) return;

            const accessToken = stravaAuth.access_token;
            const apiService = this.stravaModule.getApiService();

            // Get current activities (last 30)
            const activities = await apiService.getActivities(accessToken, 1, 30);
            const activityIds = new Set(activities.map(activity => activity.id));

            this.lastKnownActivityIds.set(areaId, activityIds);
            console.log(`[OnNewActivity] Initialized with ${activityIds.size} existing activities`.gray);
        } catch (error) {
            console.error(`[OnNewActivity] Error initializing known activities:`.red, error);
        }
    }

    /**
     * Check for newly created activities
     */
    private async checkForNewActivities(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewActivity] AREA ${areaId} not found`.red);
                return;
            }

            const stravaAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'strava');
            if (!stravaAuth || !stravaAuth.access_token) {
                console.error(`[OnNewActivity] Strava not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = stravaAuth.access_token;
            const apiService = this.stravaModule.getApiService();

            console.log(`[OnNewActivity] Checking for new activities for AREA ${areaId}`.gray);

            // Get recent activities
            const currentActivities = await apiService.getActivities(accessToken, 1, 30);
            const currentActivityIds = new Set(currentActivities.map(activity => activity.id));
            const lastKnownIds = this.lastKnownActivityIds.get(areaId) || new Set<number>();

            // Find new activities (in current but not in last known)
            const newActivities = currentActivities.filter(activity => !lastKnownIds.has(activity.id));

            // Apply activity type filter if specified
            const activityTypeFilter = config.activityType as string;
            const filteredActivities = activityTypeFilter 
                ? newActivities.filter(activity => activity.type === activityTypeFilter)
                : newActivities;

            // Emit trigger for each new activity
            for (const activity of filteredActivities) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: activity.id,
                        name: activity.name,
                        type: activity.type,
                        sport_type: activity.sport_type,
                        distance: activity.distance,
                        moving_time: activity.moving_time,
                        elapsed_time: activity.elapsed_time,
                        total_elevation_gain: activity.total_elevation_gain,
                        start_date: activity.start_date,
                        start_date_local: activity.start_date_local,
                        average_speed: activity.average_speed,
                        max_speed: activity.max_speed,
                        average_heartrate: activity.average_heartrate,
                        max_heartrate: activity.max_heartrate,
                        calories: activity.calories
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewActivity] New activity detected: ${activity.name} (${activity.type})`.green);
            }

            // Update last known activity IDs
            this.lastKnownActivityIds.set(areaId, currentActivityIds);
        } catch (error) {
            console.error(`[OnNewActivity] Error checking for new activities:`.red, error);
        }
    }
}
