/**
 * Configuration for the Dropbox module
 * Contains declaration of all triggers and actions
 */
export default {
    name: 'dropbox',
    displayName: 'Dropbox',
    description: 'Automate your Dropbox workflows with file upload detection and file management',
    iconUrl: 'https://cdn.prod.website-files.com/66c503d081b2f012369fc5d2/674000d6c0a42d41f8c331be_dropbox-2-logo-png-transparent.png',
    color: '#0061FF',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_file_uploaded',
            displayName: 'File Uploaded',
            description: 'Triggers when a new file is uploaded to a Dropbox folder',
            configSchema: {
                type: 'object',
                required: ['folderPath'],
                properties: {
                    folderPath: {
                        type: 'string',
                        title: 'Folder Path',
                        description: 'Dropbox folder path to monitor (use "" or "/" for root folder)',
                        default: '',
                        example: '/Logs'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    fileName: {
                        type: 'string',
                        description: 'Name of the uploaded file'
                    },
                    filePath: {
                        type: 'string',
                        description: 'Full path to the file in Dropbox'
                    },
                    fileSize: {
                        type: 'number',
                        description: 'File size in bytes'
                    },
                    fileSizeFormatted: {
                        type: 'string',
                        description: 'File size formatted (e.g., "1.5 MB")'
                    },
                    uploadedAt: {
                        type: 'string',
                        description: 'Server modification timestamp'
                    },
                    folderPath: {
                        type: 'string',
                        description: 'Folder being monitored'
                    }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'upload_file',
            displayName: 'Upload File',
            description: 'Upload a text file to Dropbox',
            configSchema: {
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
                        example: 'Report: {{fileName}} uploaded successfully'
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
            }
        },
        {
            name: 'create_shared_link',
            displayName: 'Create Shared Link',
            description: 'Create a public shared link for a Dropbox file',
            configSchema: {
                type: 'object',
                required: ['path'],
                properties: {
                    path: {
                        type: 'string',
                        title: 'File Path',
                        description: 'Path to the file to share. Use {{variable}} for dynamic data.',
                        example: '/Reports/{{fileName}}'
                    }
                }
            }
        },
        {
            name: 'delete_file',
            displayName: 'Delete File',
            description: 'Delete a file or folder from Dropbox',
            configSchema: {
                type: 'object',
                required: ['path'],
                properties: {
                    path: {
                        type: 'string',
                        title: 'File Path',
                        description: 'Path to the file or folder to delete. Use {{variable}} for dynamic data.',
                        example: '/Temp/{{fileName}}'
                    }
                }
            }
        },
        {
            name: 'move_file',
            displayName: 'Move File',
            description: 'Move or rename a file in Dropbox',
            configSchema: {
                type: 'object',
                required: ['fromPath', 'toPath'],
                properties: {
                    fromPath: {
                        type: 'string',
                        title: 'Source Path',
                        description: 'Current path of the file. Use {{variable}} for dynamic data.',
                        example: '/Upload/{{fileName}}'
                    },
                    toPath: {
                        type: 'string',
                        title: 'Destination Path',
                        description: 'New path for the file',
                        example: '/Archive/{{fileName}}'
                    },
                    autorename: {
                        type: 'boolean',
                        title: 'Auto-rename',
                        description: 'Rename file if destination already exists',
                        default: false
                    }
                }
            }
        },
        {
            name: 'copy_file',
            displayName: 'Copy File',
            description: 'Copy a file in Dropbox',
            configSchema: {
                type: 'object',
                required: ['fromPath', 'toPath'],
                properties: {
                    fromPath: {
                        type: 'string',
                        title: 'Source Path',
                        description: 'Path of the file to copy. Use {{variable}} for dynamic data.',
                        example: '/Important/{{fileName}}'
                    },
                    toPath: {
                        type: 'string',
                        title: 'Destination Path',
                        description: 'Path for the copy',
                        example: '/Backup/{{fileName}}-backup.txt'
                    },
                    autorename: {
                        type: 'boolean',
                        title: 'Auto-rename',
                        description: 'Rename file if destination already exists',
                        default: false
                    }
                }
            }
        }
    ]
};

