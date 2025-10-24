import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DropboxApiService } from '../DropboxApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

export class MoveFileAction extends BaseAction {
    private dropboxApi: DropboxApiService;

    constructor() {
        super();
        this.dropboxApi = new DropboxApiService();
    }

    getName(): string {
        return 'move_file';
    }

    getDescription(): string {
        return 'Move or rename a file in Dropbox';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['fromPath', 'toPath'],
            properties: {
                fromPath: {
                    type: 'string',
                    title: 'Source Path',
                    description: 'Current path of the file. Use {{variable}} for dynamic data.',
                    example: '/Upload/file.pdf'
                },
                toPath: {
                    type: 'string',
                    title: 'Destination Path',
                    description: 'New path for the file. Use {{variable}} for dynamic data.',
                    example: '/Archive/file.pdf'
                },
                autorename: {
                    type: 'boolean',
                    title: 'Auto-rename',
                    description: 'Rename file if destination already exists',
                    default: false
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['files.content.write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.fromPath || typeof config.fromPath !== 'string') {
            throw new Error('fromPath is required and must be a string');
        }

        if (!config.toPath || typeof config.toPath !== 'string') {
            throw new Error('toPath is required and must be a string');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[MoveFile] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const dropboxAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'dropbox');
            if (!dropboxAuth || !dropboxAuth.access_token) {
                throw new Error('Dropbox not connected for this user');
            }

            // Replace variables
            const fromPath = this.replaceVariables(config.fromPath, context);
            const toPath = this.replaceVariables(config.toPath, context);
            const autorename = config.autorename || false;

            const result = await this.dropboxApi.moveFile(
                fromPath,
                toPath,
                dropboxAuth.access_token,
                autorename
            );

            console.log(`[Dropbox] ✓ File moved: ${fromPath} → ${result.path_display}`.green);

            return {
                success: true,
                data: {
                    fromPath: fromPath,
                    toPath: result.path_display
                }
            };
        } catch (error) {
            console.error(`[MoveFile] ❌ Failed to move file:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

