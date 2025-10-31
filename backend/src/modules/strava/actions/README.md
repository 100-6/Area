# Strava Actions

## Available Actions

### CreateActivity
Create a new manual activity on Strava.

**Required Fields**:
- name: Activity name
- type: Activity type (Run, Ride, etc.)
- start_date_local: Start date/time (ISO format)
- elapsed_time: Duration in seconds

**Optional Fields**:
- description: Activity description
- distance: Distance in meters
- trainer: Indoor trainer activity
- commute: Commute activity

**Note**: `sport_type` is automatically set to the same value as `type`.

### UpdateActivity
Update an existing activity on Strava.

**Required Fields**:
- activityId: ID of activity to update

**Optional Fields**:
- name, type, description
- trainer, commute, gear_id

**Note**: When updating `type`, `sport_type` is automatically updated to match.

### GiveKudos
Give kudos to an activity.

**Required Fields**:
- activityId: ID of activity to give kudos

### CreateComment
Post a comment on an activity.

**Required Fields**:
- activityId: ID of activity to comment on
- text: Comment text

**Supports variable templating** from trigger data.
