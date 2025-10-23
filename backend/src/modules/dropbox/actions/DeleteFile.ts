import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DropboxApiService } from '../DropboxApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

export class DeleteFileAction extends BaseAction {
    private dropboxApi: DropboxApiService;

    constructor() {
        super();
        this.dropboxApi = new DropboxApiService();
    }

    getName(): string {
        return 'delete_file';
    }

    getDescription(): string {
        return 'Delete a file or folder from Dropbox';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['path'],
            properties: {
                path: {
                    type: 'string',
                    title: 'File Path',
                    description: 'Path to the file or folder to delete. Use {{variable}} for dynamic data.',
                    example: '/Temp/old-file.txt'
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['files.content.write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.path || typeof config.path !== 'string') {
            throw new Error('path is required and must be a string');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[DeleteFile] Executing for AREA ${context.areaId}`.cyan);

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

            const result = await this.dropboxApi.deleteFile(
                path,
                dropboxAuth.access_token
            );

            console.log(`[Dropbox] ✓ File deleted: ${result.path}`.green);

            return {
                success: true,
                data: {
                    path: result.path
                }
            };
        } catch (error) {
            console.error(`[DeleteFile] ❌ Failed to delete file:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

