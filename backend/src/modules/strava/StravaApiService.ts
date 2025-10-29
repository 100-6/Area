import 'colors';

interface StravaAthlete {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile: string;
    city: string;
    state: string;
    country: string;
}

interface StravaActivity {
    id: number;
    name: string;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    total_elevation_gain: number;
    type: string;
    sport_type: string;
    start_date: string;
    start_date_local: string;
    timezone: string;
    average_speed: number;
    max_speed: number;
    average_heartrate?: number;
    max_heartrate?: number;
    calories?: number;
    description?: string;
    map?: {
        id: string;
        summary_polyline: string;
    };
}

interface StravaStats {
    recent_run_totals: {
        count: number;
        distance: number;
        moving_time: number;
        elapsed_time: number;
        elevation_gain: number;
    };
    recent_ride_totals: {
        count: number;
        distance: number;
        moving_time: number;
        elapsed_time: number;
        elevation_gain: number;
    };
    all_run_totals: {
        count: number;
        distance: number;
        moving_time: number;
    };
    all_ride_totals: {
        count: number;
        distance: number;
        moving_time: number;
    };
}

/**
 * Strava API Service
 * Handles all interactions with Strava API v3
 */
export class StravaApiService {
    private readonly BASE_URL = 'https://www.strava.com/api/v3';

    /**
     * Get current athlete's profile
     * @param accessToken - User's access token
     * @returns Athlete profile data
     */
    async getAthlete(accessToken: string): Promise<StravaAthlete> {
        try {
            const response = await fetch(`${this.BASE_URL}/athlete`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get athlete: ${response.statusText}`);
            }

            return await response.json() as StravaAthlete;
        } catch (error) {
            console.error('[Strava] Error getting athlete:'.red, error);
            throw error;
        }
    }

    /**
     * Get athlete's activities
     * @param accessToken - User's access token
     * @param page - Page number (default: 1)
     * @param perPage - Results per page (default: 30, max: 200)
     * @param before - Epoch timestamp to use for filtering activities before a certain time
     * @param after - Epoch timestamp to use for filtering activities after a certain time
     * @returns Array of activities
     */
    async getActivities(
        accessToken: string,
        page: number = 1,
        perPage: number = 30,
        before?: number,
        after?: number
    ): Promise<StravaActivity[]> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            });

            if (before) params.append('before', before.toString());
            if (after) params.append('after', after.toString());

            const response = await fetch(`${this.BASE_URL}/athlete/activities?${params}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get activities: ${response.statusText}`);
            }

            return await response.json() as StravaActivity[];
        } catch (error) {
            console.error('[Strava] Error getting activities:'.red, error);
            throw error;
        }
    }

    /**
     * Get a specific activity by ID
     * @param accessToken - User's access token
     * @param activityId - Activity ID
     * @returns Activity details
     */
    async getActivity(accessToken: string, activityId: number): Promise<StravaActivity> {
        try {
            const response = await fetch(`${this.BASE_URL}/activities/${activityId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get activity: ${response.statusText}`);
            }

            return await response.json() as StravaActivity;
        } catch (error) {
            console.error('[Strava] Error getting activity:'.red, error);
            throw error;
        }
    }

    /**
     * Create a new activity
     * @param accessToken - User's access token
     * @param activityData - Activity data
     * @returns Created activity
     */
    async createActivity(
        accessToken: string,
        activityData: {
            name: string;
            type: string;
            sport_type: string;
            start_date_local: string;
            elapsed_time: number;
            description?: string;
            distance?: number;
            trainer?: boolean;
            commute?: boolean;
        }
    ): Promise<StravaActivity> {
        try {
            console.log('[Strava] Creating activity with data:'.cyan, JSON.stringify(activityData, null, 2));
            
            const response = await fetch(`${this.BASE_URL}/activities`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activityData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                    console.error('[Strava] API Error Response:'.red, JSON.stringify(errorData, null, 2));
                    
                    // Provide more helpful error messages
                    let errorMessage = `Failed to create activity: ${response.statusText}`;
                    if (response.status === 409) {
                        errorMessage = 'Activity creation failed: Conflict - An activity with similar data may already exist at this time';
                    } else if (errorData.message) {
                        errorMessage = `Failed to create activity: ${errorData.message}`;
                    }
                    
                    throw new Error(errorMessage);
                } catch (parseError) {
                    console.error('[Strava] API Error (raw):'.red, errorText);
                    throw new Error(`Failed to create activity: ${response.statusText} - ${errorText}`);
                }
            }

            console.log('[Strava] ✓ Activity created'.green);
            return await response.json() as StravaActivity;
        } catch (error) {
            console.error('[Strava] Error creating activity:'.red, error);
            throw error;
        }
    }

    /**
     * Update an existing activity
     * @param accessToken - User's access token
     * @param activityId - Activity ID
     * @param updates - Fields to update
     * @returns Updated activity
     */
    async updateActivity(
        accessToken: string,
        activityId: number,
        updates: {
            name?: string;
            type?: string;
            sport_type?: string;
            description?: string;
            trainer?: boolean;
            commute?: boolean;
            gear_id?: string;
        }
    ): Promise<StravaActivity> {
        try {
            const response = await fetch(`${this.BASE_URL}/activities/${activityId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`Failed to update activity: ${response.statusText}`);
            }

            console.log('[Strava] ✓ Activity updated'.green);
            return await response.json() as StravaActivity;
        } catch (error) {
            console.error('[Strava] Error updating activity:'.red, error);
            throw error;
        }
    }

    /**
     * Get athlete's stats
     * @param accessToken - User's access token
     * @param athleteId - Athlete ID
     * @returns Athlete statistics
     */
    async getAthleteStats(accessToken: string, athleteId: number): Promise<StravaStats> {
        try {
            const response = await fetch(`${this.BASE_URL}/athletes/${athleteId}/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get athlete stats: ${response.statusText}`);
            }

            return await response.json() as StravaStats;
        } catch (error) {
            console.error('[Strava] Error getting athlete stats:'.red, error);
            throw error;
        }
    }

    /**
     * Give kudos to an activity
     * @param accessToken - User's access token
     * @param activityId - Activity ID
     */
    async giveKudos(accessToken: string, activityId: number): Promise<void> {
        try {
            const response = await fetch(`${this.BASE_URL}/activities/${activityId}/kudos`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok && response.status !== 201) {
                throw new Error(`Failed to give kudos: ${response.statusText}`);
            }

            console.log('[Strava] ✓ Kudos given'.green);
        } catch (error) {
            console.error('[Strava] Error giving kudos:'.red, error);
            throw error;
        }
    }

    /**
     * Create a comment on an activity
     * @param accessToken - User's access token
     * @param activityId - Activity ID
     * @param text - Comment text
     */
    async createComment(accessToken: string, activityId: number, text: string): Promise<void> {
        try {
            const response = await fetch(`${this.BASE_URL}/activities/${activityId}/comments`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`Failed to create comment: ${response.statusText}`);
            }

            console.log('[Strava] ✓ Comment created'.green);
        } catch (error) {
            console.error('[Strava] Error creating comment:'.red, error);
            throw error;
        }
    }

    /**
     * Get activity comments
     * @param accessToken - User's access token
     * @param activityId - Activity ID
     * @returns Array of comments
     */
    async getComments(accessToken: string, activityId: number): Promise<any[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/activities/${activityId}/comments`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get comments: ${response.statusText}`);
            }

            return await response.json() as any[];
        } catch (error) {
            console.error('[Strava] Error getting comments:'.red, error);
            throw error;
        }
    }

    /**
     * Get activity kudos
     * @param accessToken - User's access token
     * @param activityId - Activity ID
     * @returns Array of athletes who gave kudos
     */
    async getKudos(accessToken: string, activityId: number): Promise<any[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/activities/${activityId}/kudos`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get kudos: ${response.statusText}`);
            }

            return await response.json() as any[];
        } catch (error) {
            console.error('[Strava] Error getting kudos:'.red, error);
            throw error;
        }
    }
}
