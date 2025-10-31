import { BaseModule } from '../_base/BaseModule';
import { GetCurrentWeather } from './actions/GetCurrentWeather';
import weatherConfig from './config';
import 'colors';

export class WeatherModule extends BaseModule {
    constructor() {
        super({
            name: weatherConfig.name,
            displayName: weatherConfig.displayName,
            description: weatherConfig.description,
            iconUrl: weatherConfig.iconUrl,
            color: weatherConfig.color,
            authType: weatherConfig.authType as 'none',
            isActive: weatherConfig.isActive
        });
    }

    getName(): string {
        return 'weather';
    }

    async initialize(): Promise<void> {
        console.log('[Weather] Initializing Weather module...'.cyan);
        try {
            this.registerAction(new GetCurrentWeather());
            console.log(`[Weather] Module initialized successfully with ${this.actions.size} action(s)`.green);
        } catch (error) {
            console.error('[Weather] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    async cleanup(): Promise<void> {
        console.log('[Weather] Cleaning up Weather module...'.yellow);
        await super.cleanup();
    }
}

export const weatherModule = new WeatherModule();
