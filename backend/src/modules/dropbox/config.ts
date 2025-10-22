/**
 * Configuration for the Dropbox module
 * Contains declaration of all triggers and actions
 */
export default {
    name: 'dropbox',
    displayName: 'Dropbox',
    description: 'Automate your Dropbox workflows with file upload detection and file management',
    iconUrl: 'https://cfl.dropboxstatic.com/static/images/logo_catalog/dropbox_webclip_152.png',
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

    reactions: []
};

