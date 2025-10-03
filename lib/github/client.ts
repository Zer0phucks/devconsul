import { Octokit } from '@octokit/rest';
import { kv } from '@/lib/supabase/kv';

// Cache TTL for repository lists (15 minutes)
const REPO_CACHE_TTL = 15 * 60;

// GitHub API client wrapper with rate limit handling
export class GitHubClient {
  private octokit: Octokit;
  private userId?: string;

  constructor(accessToken: string, userId?: string) {
    this.octokit = new Octokit({
      auth: accessToken,
      userAgent: 'fullselfpublishing-app',
    });
    this.userId = userId;
  }

  /**
   * Get user's repositories with caching
   */
  async getRepositories(options: {
    page?: number;
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
  } = {}) {
    const { page = 1, perPage = 30, sort = 'updated', direction = 'desc' } = options;

    // Check cache first
    const cacheKey = `gh:repos:${this.userId}:${page}:${perPage}:${sort}:${direction}`;
    const cached = await kv.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        page,
        per_page: perPage,
        sort,
        direction,
      });

      const result = {
        data: response.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          private: repo.private,
          fork: repo.fork,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
        })),
        pagination: {
          page,
          perPage,
          hasNext: response.data.length === perPage,
        },
      };

      // Cache for 15 minutes
      await kv.set(cacheKey, result, { ex: REPO_CACHE_TTL });

      return result;
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error('GitHub token is invalid or expired. Please reconnect your account.');
      }
      if (error.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  /**
   * Get commits for a repository since a specific date
   */
  async getCommits(
    owner: string,
    repo: string,
    options: {
      since?: Date;
      until?: Date;
      sha?: string; // branch name
      author?: string;
      page?: number;
      perPage?: number;
    } = {}
  ) {
    const { since, until, sha, author, page = 1, perPage = 100 } = options;

    try {
      const response = await this.octokit.repos.listCommits({
        owner,
        repo,
        since: since?.toISOString(),
        until: until?.toISOString(),
        sha,
        author,
        page,
        per_page: perPage,
      });

      return response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          login: commit.author?.login || commit.commit.author?.name || 'unknown',
          avatar_url: commit.author?.avatar_url,
          html_url: commit.author?.html_url,
        },
        date: new Date(commit.commit.author?.date || Date.now()),
        html_url: commit.html_url,
        stats: commit.stats,
        files: commit.files?.map(f => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
        })),
      }));
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or not accessible.`);
      }
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  /**
   * Get pull requests for a repository
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      since?: Date;
      page?: number;
      perPage?: number;
    } = {}
  ) {
    const { state = 'all', page = 1, perPage = 100 } = options;

    try {
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        page,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      });

      // Filter by date if since is provided
      let pulls = response.data;
      if (options.since) {
        pulls = pulls.filter(pr => new Date(pr.updated_at) >= options.since!);
      }

      return pulls.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        merged: pr.merged_at !== null,
        merged_at: pr.merged_at ? new Date(pr.merged_at) : undefined,
        created_at: new Date(pr.created_at),
        updated_at: new Date(pr.updated_at),
        closed_at: pr.closed_at ? new Date(pr.closed_at) : undefined,
        user: {
          login: pr.user?.login || 'unknown',
          avatar_url: pr.user?.avatar_url,
          html_url: pr.user?.html_url,
        },
        html_url: pr.html_url,
        draft: pr.draft,
        labels: pr.labels?.map(l => l.name) || [],
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  /**
   * Get issues for a repository
   */
  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      since?: Date;
      creator?: string;
      page?: number;
      perPage?: number;
    } = {}
  ) {
    const { state = 'all', since, creator, page = 1, perPage = 100 } = options;

    try {
      const response = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state,
        since: since?.toISOString(),
        creator,
        page,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      });

      // Filter out pull requests (GitHub treats PRs as issues)
      const issues = response.data.filter(issue => !issue.pull_request);

      return issues.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: new Date(issue.created_at),
        updated_at: new Date(issue.updated_at),
        closed_at: issue.closed_at ? new Date(issue.closed_at) : undefined,
        user: {
          login: issue.user?.login || 'unknown',
          avatar_url: issue.user?.avatar_url,
          html_url: issue.user?.html_url,
        },
        html_url: issue.html_url,
        labels: issue.labels?.map(l => (typeof l === 'string' ? l : l.name)) || [],
        comments: issue.comments,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  }

  /**
   * Get releases for a repository
   */
  async getReleases(
    owner: string,
    repo: string,
    options: {
      page?: number;
      perPage?: number;
    } = {}
  ) {
    const { page = 1, perPage = 100 } = options;

    try {
      const response = await this.octokit.repos.listReleases({
        owner,
        repo,
        page,
        per_page: perPage,
      });

      return response.data.map(release => ({
        id: release.id,
        tag_name: release.tag_name,
        name: release.name || release.tag_name,
        body: release.body || '',
        draft: release.draft,
        prerelease: release.prerelease,
        created_at: new Date(release.created_at),
        published_at: release.published_at ? new Date(release.published_at) : undefined,
        author: {
          login: release.author?.login || 'unknown',
          avatar_url: release.author?.avatar_url,
          html_url: release.author?.html_url,
        },
        html_url: release.html_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch releases: ${error.message}`);
    }
  }

  /**
   * Validate that the token is still valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the authenticated user's information
   */
  async getAuthenticatedUser() {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return {
        id: response.data.id,
        login: response.data.login,
        name: response.data.name,
        email: response.data.email,
        avatar_url: response.data.avatar_url,
        html_url: response.data.html_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch user information: ${error.message}`);
    }
  }
}

/**
 * Create a GitHub client instance with error handling for token issues
 */
export async function createGitHubClient(accessToken: string, userId?: string): Promise<GitHubClient> {
  const client = new GitHubClient(accessToken, userId);

  // Validate token on creation
  const isValid = await client.validateToken();
  if (!isValid) {
    throw new Error('GitHub token is invalid or expired. Please reconnect your account.');
  }

  return client;
}
