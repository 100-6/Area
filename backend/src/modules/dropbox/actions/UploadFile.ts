import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DropboxApiService } from '../DropboxApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

export class UploadFileAction extends BaseAction {
    private dropboxApi: DropboxApiService;

    constructor() {
        super();
        this.dropboxApi = new DropboxApiService();
    }

    getName(): string {
        return 'upload_file';
    }

    getDescription(): string {
        return 'Upload a text file to Dropbox';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['path', 'content'],
            properties: {
                path: {
                    type: 'string',
                    title: 'File Path',
                    description: 'Destination path including filename (e.g., /Logs/report.txt)',
                    example: '/Reports/daily-report.txt'
                },
                content: {
                    type: 'string',
                    title: 'File Content',
                    description: 'Content of the file to upload. Use {{variable}} for dynamic data.',
                    example: 'This is the file content'
                },
                mode: {
                    type: 'string',
                    title: 'Upload Mode',
                    description: 'add (default) or overwrite',
                    enum: ['add', 'overwrite'],
                    default: 'add'
                },
                autorename: {
                    type: 'boolean',
                    title: 'Auto-rename',
                    description: 'Rename file if it already exists',
                    default: false
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

        if (!config.content || typeof config.content !== 'string') {
            throw new Error('content is required and must be a string');
        }

        if (config.mode && !['add', 'overwrite'].includes(config.mode)) {
            throw new Error('mode must be either "add" or "overwrite"');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[UploadFile] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const dropboxAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'dropbox');
            if (!dropboxAuth || !dropboxAuth.access_token) {
                throw new Error('Dropbox not connected for this user');
            }

            // Replace variables in path and content
            const path = this.replaceVariables(config.path, context);
            const content = this.replaceVariables(config.content, context);
            const mode = config.mode || 'add';
            const autorename = config.autorename || false;

            const result = await this.dropboxApi.uploadFile(
                path,
                content,
                dropboxAuth.access_token,
                mode as 'add' | 'overwrite',
                autorename
            );

            console.log(`[Dropbox] ✓ File uploaded: ${result.path_display} (${result.size} bytes)`.green);

            return {
                success: true,
                data: {
                    path: result.path_display,
                    size: result.size,
                    id: result.id
                }
            };
        } catch (error) {
            console.error(`[UploadFile] ❌ Failed to upload file:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

