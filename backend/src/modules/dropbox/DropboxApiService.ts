import 'colors';

/**
 * Interface representing a Dropbox file metadata
 * @interface DropboxFile
 * @property {string} id - Unique file ID
 * @property {string} name - File name
 * @property {string} path_lower - Lowercase path
 * @property {string} path_display - Display path
 * @property {string} client_modified - Client modification time (ISO 8601)
 * @property {string} server_modified - Server modification time (ISO 8601)
 * @property {number} size - File size in bytes
 * @property {string} rev - Revision identifier
 */
export interface DropboxFile {
    id: string;
    name: string;
    path_lower: string;
    path_display: string;
    client_modified: string;
    server_modified: string;
    size: number;
    rev: string;
    '.tag': 'file';
}

/**
 * Interface representing a Dropbox folder metadata
 * @interface DropboxFolder
 * @property {string} id - Unique folder ID
 * @property {string} name - Folder name
 * @property {string} path_lower - Lowercase path
 * @property {string} path_display - Display path
 */
export interface DropboxFolder {
    id: string;
    name: string;
    path_lower: string;
    path_display: string;
    '.tag': 'folder';
}

/**
 * Union type for Dropbox entries (files or folders)
 */
export type DropboxEntry = DropboxFile | DropboxFolder;

/**
 * Interface for list_folder response
 */
export interface DropboxListFolderResponse {
    entries: DropboxEntry[];
    cursor: string;
    has_more: boolean;
}

/**
 * Abstraction service to interact with the Dropbox API v2
 * Centralizes all API calls to Dropbox to facilitate maintenance
 * and error handling.
 * 
 * @class DropboxApiService
 * @example
 * const dropboxApi = new DropboxApiService();
 * const files = await dropboxApi.listFolder('/Documents', token);
 */
export class DropboxApiService {
    /**
     * Base URL of the Dropbox API v2
     * @private
     * @readonly
     */
    private baseUrl = 'https://api.dropboxapi.com/2';

    /**
     * Lists files and folders in a Dropbox folder
     * 
     * @async
     * @param {string} path - Path to the folder (use "" for root)
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @param {boolean} [recursive=false] - List folder recursively
     * @returns {Promise<DropboxEntry[]>} List of files and folders
     * @throws {Error} If the Dropbox API returns an error
     * @example
     * const entries = await dropboxApi.listFolder('/Documents', 'sl.abc123...');
     * console.log(entries.filter(e => e['.tag'] === 'file').map(f => f.name));
     */
    async listFolder(
        path: string,
        accessToken: string,
        recursive: boolean = false
    ): Promise<DropboxEntry[]> {
        try {
            const url = `${this.baseUrl}/files/list_folder`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: path || '',
                    recursive,
                    include_deleted: false,
                    include_has_explicit_shared_members: false,
                    include_mounted_folders: true
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as DropboxListFolderResponse;
            
            // Handle pagination if has_more is true
            let allEntries = data.entries;
            let cursor = data.cursor;
            let hasMore = data.has_more;

            while (hasMore) {
                const continueResponse = await this.listFolderContinue(cursor, accessToken);
                allEntries = allEntries.concat(continueResponse.entries);
                cursor = continueResponse.cursor;
                hasMore = continueResponse.has_more;
            }

            return allEntries;
        } catch (error) {
            console.error('[Dropbox API] Error listing folder:'.red, error);
            throw error;
        }
    }

    /**
     * Continues a list_folder operation
     * 
     * @async
     * @param {string} cursor - Cursor from previous list_folder call
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @returns {Promise<DropboxListFolderResponse>} Continuation of folder listing
     * @throws {Error} If the Dropbox API returns an error
     */
    private async listFolderContinue(
        cursor: string,
        accessToken: string
    ): Promise<DropboxListFolderResponse> {
        try {
            const url = `${this.baseUrl}/files/list_folder/continue`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cursor })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            return await response.json() as DropboxListFolderResponse;
        } catch (error) {
            console.error('[Dropbox API] Error continuing folder list:'.red, error);
            throw error;
        }
    }

    /**
     * Verifies the validity of a Dropbox OAuth token
     * Makes a call to check the current account
     * 
     * @async
     * @param {string} accessToken - Dropbox OAuth token to verify
     * @returns {Promise<boolean>} true if the token is valid, false otherwise
     * @example
     * const isValid = await dropboxApi.verifyToken('sl.abc123...');
     * if (isValid) {
     *   console.log('Token is valid');
     * }
     */
    async verifyToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/users/get_current_account`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(null)
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

