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
     * Uploads a file to Dropbox
     * 
     * @async
     * @param {string} path - Destination path (including filename)
     * @param {string} content - File content
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @param {string} mode - 'add', 'overwrite', or 'update'
     * @param {boolean} autorename - Auto-rename if file exists
     * @returns {Promise<DropboxFile>} Metadata of the uploaded file
     * @throws {Error} If the Dropbox API returns an error
     */
    async uploadFile(
        path: string,
        content: string,
        accessToken: string,
        mode: 'add' | 'overwrite' | 'update' = 'add',
        autorename: boolean = false
    ): Promise<DropboxFile> {
        try {
            const url = 'https://content.dropboxapi.com/2/files/upload';
            
            const dropboxApiArg = JSON.stringify({
                path,
                mode,
                autorename,
                mute: false
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': dropboxApiArg
                },
                body: content
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            return await response.json() as DropboxFile;
        } catch (error) {
            console.error('[Dropbox API] Error uploading file:'.red, error);
            throw error;
        }
    }

    /**
     * Creates a shared link for a file
     * 
     * @async
     * @param {string} path - Path to the file
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @returns {Promise<{url: string}>} Shared link URL
     * @throws {Error} If the Dropbox API returns an error
     */
    async createSharedLink(path: string, accessToken: string): Promise<{url: string}> {
        try {
            const url = `${this.baseUrl}/sharing/create_shared_link_with_settings`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path,
                    settings: {
                        requested_visibility: 'public'
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as { url: string };
            return { url: data.url };
        } catch (error) {
            console.error('[Dropbox API] Error creating shared link:'.red, error);
            throw error;
        }
    }

    /**
     * Deletes a file or folder
     * 
     * @async
     * @param {string} path - Path to the file or folder
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @returns {Promise<{path: string}>} Deleted path
     * @throws {Error} If the Dropbox API returns an error
     */
    async deleteFile(path: string, accessToken: string): Promise<{path: string}> {
        try {
            const url = `${this.baseUrl}/files/delete_v2`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as { metadata: { path_display: string } };
            return { path: data.metadata.path_display };
        } catch (error) {
            console.error('[Dropbox API] Error deleting file:'.red, error);
            throw error;
        }
    }

    /**
     * Moves a file or folder
     * 
     * @async
     * @param {string} fromPath - Source path
     * @param {string} toPath - Destination path
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @param {boolean} autorename - Auto-rename if destination exists
     * @returns {Promise<DropboxFile>} Metadata of moved file
     * @throws {Error} If the Dropbox API returns an error
     */
    async moveFile(
        fromPath: string,
        toPath: string,
        accessToken: string,
        autorename: boolean = false
    ): Promise<DropboxFile> {
        try {
            const url = `${this.baseUrl}/files/move_v2`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_path: fromPath,
                    to_path: toPath,
                    autorename
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as { metadata: DropboxFile };
            return data.metadata as DropboxFile;
        } catch (error) {
            console.error('[Dropbox API] Error moving file:'.red, error);
            throw error;
        }
    }

    /**
     * Copies a file or folder
     * 
     * @async
     * @param {string} fromPath - Source path
     * @param {string} toPath - Destination path
     * @param {string} accessToken - User's Dropbox OAuth access token
     * @param {boolean} autorename - Auto-rename if destination exists
     * @returns {Promise<DropboxFile>} Metadata of copied file
     * @throws {Error} If the Dropbox API returns an error
     */
    async copyFile(
        fromPath: string,
        toPath: string,
        accessToken: string,
        autorename: boolean = false
    ): Promise<DropboxFile> {
        try {
            const url = `${this.baseUrl}/files/copy_v2`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_path: fromPath,
                    to_path: toPath,
                    autorename
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as { metadata: DropboxFile };
            return data.metadata as DropboxFile;
        } catch (error) {
            console.error('[Dropbox API] Error copying file:'.red, error);
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

