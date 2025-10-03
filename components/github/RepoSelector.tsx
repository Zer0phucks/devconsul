'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Github, RefreshCw, ExternalLink } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at: string;
}

interface RepoSelectorProps {
  projectId: string;
  userId: string;
  currentRepo?: {
    owner: string;
    name: string;
  };
  onConnect: (owner: string, repo: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function RepoSelector({
  projectId,
  userId,
  currentRepo,
  onConnect,
  onDisconnect,
}: RepoSelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any>(null);

  const isConnected = !!currentRepo;

  // Fetch repositories when dialog opens
  useEffect(() => {
    if (isDialogOpen && !isConnected) {
      fetchRepositories();
    }
  }, [isDialogOpen, isConnected]);

  // Fetch recent activity when connected
  useEffect(() => {
    if (isConnected && currentRepo) {
      fetchRecentActivity();
    }
  }, [isConnected, currentRepo]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/repos?userId=${userId}&sort=updated&direction=desc&perPage=50`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch repositories');
      }

      const data = await response.json();
      setRepositories(data.data || []);
    } catch (err: any) {
      console.error('Error fetching repositories:', err);
      setError(err.message || 'Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!currentRepo) return;

    try {
      const response = await fetch(
        `/api/github/activity?userId=${userId}&owner=${currentRepo.owner}&repo=${currentRepo.name}&aggregate=true`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.data);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  };

  const handleConnect = async () => {
    if (!selectedRepo) return;

    setIsConnecting(true);
    setError(null);

    try {
      const [owner, repo] = selectedRepo.split('/');
      await onConnect(owner, repo);
      setIsDialogOpen(false);
      setSelectedRepo('');
    } catch (err: any) {
      console.error('Error connecting repository:', err);
      setError(err.message || 'Failed to connect repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await onDisconnect();
      setRecentActivity(null);
    } catch (err: any) {
      console.error('Error disconnecting repository:', err);
      setError(err.message || 'Failed to disconnect repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredRepos = repositories.filter(
    repo =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Connection Status Display */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Github className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium">GitHub Repository</h3>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <a
                  href={`https://github.com/${currentRepo.owner}/${currentRepo.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {currentRepo.owner}/{currentRepo.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <XCircle className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">No repository connected</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Github className="h-4 w-4 mr-2" />
                  Connect Repository
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Connect GitHub Repository</DialogTitle>
                  <DialogDescription>
                    Select a repository to monitor for activity and generate content
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Search Input */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Repositories</Label>
                    <Input
                      id="search"
                      placeholder="Search by name or description..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Repository Select */}
                  <div className="space-y-2">
                    <Label htmlFor="repo">Repository</Label>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading repositories...
                      </div>
                    ) : error ? (
                      <div className="text-sm text-red-600">{error}</div>
                    ) : (
                      <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                        <SelectTrigger id="repo">
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {filteredRepos.length === 0 ? (
                            <div className="p-4 text-sm text-center text-gray-500">
                              No repositories found
                            </div>
                          ) : (
                            filteredRepos.map(repo => (
                              <SelectItem key={repo.id} value={repo.full_name}>
                                <div className="flex flex-col">
                                  <div className="font-medium">{repo.full_name}</div>
                                  {repo.description && (
                                    <div className="text-xs text-gray-500 truncate max-w-[400px]">
                                      {repo.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    {repo.language && <span>{repo.language}</span>}
                                    <span>⭐ {repo.stargazers_count}</span>
                                    {repo.private && (
                                      <span className="text-orange-600">Private</span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={!selectedRepo || isConnecting}>
                    {isConnecting ? 'Connecting...' : 'Connect Repository'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Recent Activity Preview */}
      {isConnected && recentActivity && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium mb-3">Recent Activity (Last 30 Days)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {recentActivity.aggregation?.total?.commits || 0}
              </div>
              <div className="text-xs text-gray-600">Commits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(recentActivity.aggregation?.total?.pullRequests?.merged || 0) +
                  (recentActivity.aggregation?.total?.pullRequests?.closed || 0)}
              </div>
              <div className="text-xs text-gray-600">Pull Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recentActivity.aggregation?.total?.issues?.opened || 0}
              </div>
              <div className="text-xs text-gray-600">Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {recentActivity.aggregation?.total?.releases || 0}
              </div>
              <div className="text-xs text-gray-600">Releases</div>
            </div>
          </div>
          {recentActivity.aggregation?.total?.contributors && (
            <div className="mt-3 text-xs text-gray-600 text-center">
              {recentActivity.aggregation.total.contributors.length} contributor
              {recentActivity.aggregation.total.contributors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
