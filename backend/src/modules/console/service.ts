import { BaseModule } from '../_base/BaseModule';
import { ConsoleLogAction } from './actions';
import consoleConfig from './config';
import 'colors';

export class ConsoleModule extends BaseModule {
    constructor() {
        super({
            name: consoleConfig.name,
            displayName: consoleConfig.displayName,
            description: consoleConfig.description,
            iconUrl: consoleConfig.iconUrl,
            color: consoleConfig.color,
            authType: consoleConfig.authType as 'none',
            isActive: consoleConfig.isActive
        });
    }

    getName(): string {
        return 'console';
    }

    async initialize(): Promise<void> {
        console.log('[Console] Initializing Console module...'.cyan);
        this.registerAction(new ConsoleLogAction());
        console.log('[Console] Module initialized successfully'.green);
    }
}

export const consoleModule = new ConsoleModule();
