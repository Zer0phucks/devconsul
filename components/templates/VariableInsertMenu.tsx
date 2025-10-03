'use client';

/**
 * Variable Insert Menu Component
 * Dropdown menu for inserting template variables
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AtSign,
  Calendar,
  FileText,
  GitBranch,
  Hash,
  LinkIcon,
  Sparkles,
  Type,
  Variable,
} from 'lucide-react';

const VARIABLE_GROUPS = [
  {
    label: 'Project',
    icon: FileText,
    variables: [
      { name: 'projectName', description: 'Project name', icon: Type },
      { name: 'repository', description: 'Repository (owner/repo)', icon: GitBranch },
      { name: 'repositoryUrl', description: 'Full repository URL', icon: LinkIcon },
      { name: 'websiteUrl', description: 'Project website', icon: LinkIcon },
    ],
  },
  {
    label: 'Activity',
    icon: Sparkles,
    variables: [
      { name: 'activity', description: 'Activity summary', icon: Sparkles },
      { name: 'activityType', description: 'Type of activity', icon: Type },
      { name: 'activityDate', description: 'Activity date', icon: Calendar },
    ],
  },
  {
    label: 'Commits',
    icon: GitBranch,
    variables: [
      { name: 'latestCommit', description: 'Latest commit message', icon: GitBranch },
      { name: 'latestCommitSha', description: 'Latest commit SHA', icon: Hash },
      { name: 'allCommits', description: 'All commits', icon: GitBranch },
      { name: 'commitCount', description: 'Number of commits', icon: Hash },
    ],
  },
  {
    label: 'Releases',
    icon: FileText,
    variables: [
      { name: 'latestRelease', description: 'Latest release tag', icon: FileText },
      { name: 'latestReleaseVersion', description: 'Version number', icon: Hash },
      { name: 'latestReleaseNotes', description: 'Release notes', icon: FileText },
    ],
  },
  {
    label: 'Issues',
    icon: Hash,
    variables: [
      { name: 'issueNumber', description: 'Issue number', icon: Hash },
      { name: 'issueTitle', description: 'Issue title', icon: Type },
      { name: 'issueBody', description: 'Issue description', icon: FileText },
      { name: 'issueAuthor', description: 'Issue author', icon: AtSign },
    ],
  },
  {
    label: 'Pull Requests',
    icon: GitBranch,
    variables: [
      { name: 'prNumber', description: 'PR number', icon: Hash },
      { name: 'prTitle', description: 'PR title', icon: Type },
      { name: 'prBody', description: 'PR description', icon: FileText },
      { name: 'prAuthor', description: 'PR author', icon: AtSign },
    ],
  },
  {
    label: 'Time',
    icon: Calendar,
    variables: [
      { name: 'today', description: 'Current date', icon: Calendar },
      { name: 'weekRange', description: 'Current week', icon: Calendar },
      { name: 'monthRange', description: 'Current month', icon: Calendar },
    ],
  },
];

interface VariableInsertMenuProps {
  onInsert: (variableName: string) => void;
}

export function VariableInsertMenu({ onInsert }: VariableInsertMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Variable className="w-4 h-4 mr-2" />
          Insert Variable
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[500px] overflow-y-auto">
        {VARIABLE_GROUPS.map((group, groupIndex) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.label}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-2">
                <GroupIcon className="w-4 h-4" />
                {group.label}
              </DropdownMenuLabel>
              {group.variables.map((variable) => {
                const VariableIcon = variable.icon;
                return (
                  <DropdownMenuItem
                    key={variable.name}
                    onClick={() => onInsert(variable.name)}
                    className="pl-8"
                  >
                    <VariableIcon className="w-3 h-3 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">{`{{${variable.name}}}`}</span>
                      <span className="text-xs text-gray-500">{variable.description}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
