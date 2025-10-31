# Strava Triggers

## Available Triggers

### OnNewActivity
Fires when a new activity is recorded on Strava.

**Polling Interval**: Configurable (minimum 1 minute recommended)

**Output Data**:
- Activity ID, name, type
- Distance, duration, elevation
- Speed statistics
- Heart rate data (if available)
- Calories burned

**Use Cases**:
- Auto-comment on new activities
- Send notifications for achievements
- Track training progress
- Sync with other fitness apps
