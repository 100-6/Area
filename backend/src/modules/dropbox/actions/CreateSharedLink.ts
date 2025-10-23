import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DropboxApiService } from '../DropboxApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

export class CreateSharedLinkAction extends BaseAction {
    private dropboxApi: DropboxApiService;

    constructor() {
        super();
        this.dropboxApi = new DropboxApiService();
    }

    getName(): string {
        return 'create_shared_link';
    }

    getDescription(): string {
        return 'Create a public shared link for a Dropbox file';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['path'],
            properties: {
                path: {
                    type: 'string',
                    title: 'File Path',
                    description: 'Path to the file to share. Use {{variable}} for dynamic data.',
                    example: '/Reports/report.pdf'
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['sharing.write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.path || typeof config.path !== 'string') {
            throw new Error('path is required and must be a string');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreateSharedLink] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const dropboxAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'dropbox');
            if (!dropboxAuth || !dropboxAuth.access_token) {
                throw new Error('Dropbox not connected for this user');
            }

            // Replace variables in path
            const path = this.replaceVariables(config.path, context);

            const result = await this.dropboxApi.createSharedLink(
                path,
                dropboxAuth.access_token
            );

            console.log(`[Dropbox] ✓ Shared link created for ${path}: ${result.url}`.green);

            return {
                success: true,
                data: {
                    url: result.url,
                    path: path
                }
            };
        } catch (error) {
            console.error(`[CreateSharedLink] ❌ Failed to create shared link:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

