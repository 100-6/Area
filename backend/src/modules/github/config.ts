/**
 * Configuration du module GitHub
 * Contient la déclaration de tous les triggers et actions
 */
export default {
    name: 'github',
    displayName: 'GitHub',
    description: 'Automate your GitHub workflows with repository events, issues, and commits',
    iconUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    color: '#181717',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_push',
            displayName: 'New Push to Repository',
            description: 'Triggers when new commits are pushed to a repository branch',
            configSchema: {
                type: 'object',
                required: ['owner', 'repo', 'branch'],
                properties: {
                    owner: {
                        type: 'string',
                        title: 'Repository Owner',
                        description: 'GitHub username or organization',
                        example: 'octocat'
                    },
                    repo: {
                        type: 'string',
                        title: 'Repository Name',
                        description: 'Name of the repository',
                        example: 'Hello-World'
                    },
                    branch: {
                        type: 'string',
                        title: 'Branch',
                        description: 'Branch to monitor',
                        default: 'main',
                        example: 'main'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    pusher: {
                        type: 'string',
                        description: 'Username of the person who pushed'
                    },
                    commitMessage: {
                        type: 'string',
                        description: 'Latest commit message'
                    },
                    commitSha: {
                        type: 'string',
                        description: 'Commit SHA hash'
                    },
                    commitUrl: {
                        type: 'string',
                        description: 'URL to the commit'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository full name (owner/repo)'
                    },
                    branch: {
                        type: 'string',
                        description: 'Branch name'
                    }
                }
            }
        }
    ],

    reactions: []
};



 