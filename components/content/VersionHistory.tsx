'use client';

/**
 * Version History - Version management with diff viewer
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw, Trash2, GitCompare } from 'lucide-react';
import * as Diff from 'diff-match-patch';

interface Version {
  id: string;
  version: number;
  content: string;
  createdAt: Date;
  aiModel?: string;
  refinementPrompt?: string;
  isCurrent: boolean;
}

interface VersionHistoryProps {
  versions: Version[];
  onPreview: (versionId: string) => void;
  onRestore: (versionId: string) => Promise<void>;
  onDelete: (versionId: string) => Promise<void>;
  className?: string;
}

export function VersionHistory({
  versions,
  onPreview,
  onRestore,
  onDelete,
  className = '',
}: VersionHistoryProps) {
  const [selectedForDiff, setSelectedForDiff] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  // Handle diff selection
  const handleDiffSelect = (versionId: string) => {
    if (selectedForDiff.includes(versionId)) {
      setSelectedForDiff(selectedForDiff.filter((id) => id !== versionId));
    } else if (selectedForDiff.length < 2) {
      setSelectedForDiff([...selectedForDiff, versionId]);
    } else {
      setSelectedForDiff([selectedForDiff[1], versionId]);
    }
  };

  // Handle restore
  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version?')) return;

    setIsRestoring(versionId);
    try {
      await onRestore(versionId);
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('Failed to restore version');
    } finally {
      setIsRestoring(null);
    }
  };

  // Handle delete
  const handleDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) return;

    setIsDeleting(versionId);
    try {
      await onDelete(versionId);
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('Failed to delete version');
    } finally {
      setIsDeleting(null);
    }
  };

  // Generate diff between two versions
  const generateDiff = () => {
    if (selectedForDiff.length !== 2) return null;

    const version1 = versions.find((v) => v.id === selectedForDiff[0]);
    const version2 = versions.find((v) => v.id === selectedForDiff[1]);

    if (!version1 || !version2) return null;

    const dmp = new Diff.diff_match_patch();
    const diffs = dmp.diff_main(version1.content, version2.content);
    dmp.diff_cleanupSemantic(diffs);

    return { version1, version2, diffs };
  };

  // Render diff
  const renderDiff = () => {
    const diffData = generateDiff();
    if (!diffData) return null;

    const { version1, version2, diffs } = diffData;

    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">
            Comparing v{version1.version} → v{version2.version}
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowDiff(false)}>
            Close
          </Button>
        </div>

        <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
          {diffs.map((diff, index) => {
            const [type, text] = diff;

            if (type === Diff.DIFF_INSERT) {
              return (
                <div key={index} className="bg-green-100 text-green-800 px-2 py-1">
                  + {text}
                </div>
              );
            } else if (type === Diff.DIFF_DELETE) {
              return (
                <div key={index} className="bg-red-100 text-red-800 px-2 py-1">
                  - {text}
                </div>
              );
            } else {
              return (
                <div key={index} className="text-gray-600 px-2 py-1">
                  {text}
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Version History</h3>
        {selectedForDiff.length === 2 && (
          <Button size="sm" onClick={() => setShowDiff(true)}>
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </Button>
        )}
      </div>

      {/* Diff viewer */}
      {showDiff && renderDiff()}

      {/* Version list */}
      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`border rounded-lg p-3 transition-colors ${
              version.isCurrent
                ? 'bg-blue-50 border-blue-200'
                : selectedForDiff.includes(version.id)
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Version info */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">v{version.version}</span>
                  {version.isCurrent && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-500 mb-1">
                  {formatDistanceToNow(new Date(version.createdAt), {
                    addSuffix: true,
                  })}
                </div>

                {/* AI info */}
                {version.aiModel && (
                  <div className="text-xs text-gray-600">
                    Model: <span className="font-mono">{version.aiModel}</span>
                  </div>
                )}

                {/* Refinement prompt */}
                {version.refinementPrompt && (
                  <div className="text-xs text-gray-600 mt-1 italic">
                    Regenerated with: &quot;{version.refinementPrompt}&quot;
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Diff selection */}
                <input
                  type="checkbox"
                  checked={selectedForDiff.includes(version.id)}
                  onChange={() => handleDiffSelect(version.id)}
                  className="rounded border-gray-300"
                  title="Select for comparison"
                />

                {/* Preview */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreview(version.id)}
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </Button>

                {/* Restore */}
                {!version.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(version.id)}
                    disabled={isRestoring === version.id}
                    title="Restore this version"
                  >
                    <RotateCcw
                      className={`w-4 h-4 ${isRestoring === version.id ? 'animate-spin' : ''}`}
                    />
                  </Button>
                )}

                {/* Delete */}
                {!version.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(version.id)}
                    disabled={isDeleting === version.id}
                    title="Delete this version"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No version history available
        </div>
      )}
    </div>
  );
}
