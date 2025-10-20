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
        },
        {
            name: 'on_branch_created',
            displayName: 'Branch Created',
            description: 'Triggers when a new branch is created in a repository',
            configSchema: {
                type: 'object',
                required: ['owner', 'repo'],
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
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    branchName: {
                        type: 'string',
                        description: 'Name of the newly created branch'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository full name (owner/repo)'
                    },
                    createdAt: {
                        type: 'string',
                        description: 'Timestamp when the branch was detected'
                    },
                    latestCommitSha: {
                        type: 'string',
                        description: 'SHA of the latest commit on the new branch'
                    }
                }
            }
        },
        {
            name: 'on_branch_deleted',
            displayName: 'Branch Deleted',
            description: 'Triggers when a branch is deleted from a repository',
            configSchema: {
                type: 'object',
                required: ['owner', 'repo'],
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
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    branchName: {
                        type: 'string',
                        description: 'Name of the deleted branch'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository full name (owner/repo)'
                    },
                    deletedAt: {
                        type: 'string',
                        description: 'Timestamp when the branch deletion was detected'
                    }
                }
            }
        }
    ],

    reactions: []
};



 