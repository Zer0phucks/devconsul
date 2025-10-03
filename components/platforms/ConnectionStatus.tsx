"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import type { ConnectionStatus as ConnectionStatusType } from "@/lib/types/platforms"

interface ConnectionStatusProps {
  connection?: ConnectionStatusType
  onConnect: () => void
  onDisconnect: () => void
  onReconnect: () => void
  platformName: string
}

export function ConnectionStatus({
  connection,
  onConnect,
  onDisconnect,
  onReconnect,
  platformName,
}: ConnectionStatusProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  // Not connected state
  if (!connection || connection.status === "disconnected") {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1">
          <Circle className="h-3 w-3 text-gray-400" />
          Not Connected
        </Badge>
        <Button onClick={onConnect} size="sm">
          Connect to {platformName}
        </Button>
      </div>
    )
  }

  // Error/Expired state
  if (connection.status === "error" || connection.status === "expired") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {connection.status === "error" ? "Connection Error" : "Token Expired"}
          </Badge>
          <div className="flex gap-2">
            <Button onClick={onReconnect} size="sm" variant="default">
              Reconnect
            </Button>
            <Button
              onClick={() => setShowDisconnectDialog(true)}
              size="sm"
              variant="outline"
            >
              Disconnect
            </Button>
          </div>
        </div>
        {connection.errorMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{connection.errorMessage}</p>
          </div>
        )}
      </div>
    )
  }

  // Connected state
  const healthColor = connection.lastSyncAt
    ? new Date().getTime() - new Date(connection.lastSyncAt).getTime() <
      24 * 60 * 60 * 1000
      ? "text-green-500"
      : new Date().getTime() - new Date(connection.lastSyncAt).getTime() <
        7 * 24 * 60 * 60 * 1000
      ? "text-yellow-500"
      : "text-red-500"
    : "text-gray-400"

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 border-green-500/50 bg-green-50 text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
            <div className={`flex items-center gap-1 text-sm ${healthColor}`}>
              <Circle className="h-2 w-2 fill-current" />
              <span className="text-gray-600">
                {connection.lastSyncAt
                  ? `Active ${formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}`
                  : "Never synced"}
              </span>
            </div>
          </div>
          <Button
            onClick={() => setShowDisconnectDialog(true)}
            size="sm"
            variant="outline"
          >
            Disconnect
          </Button>
        </div>

        {connection.accountInfo && (
          <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
            <h4 className="text-sm font-medium">Account Information</h4>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              {connection.accountInfo.username && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Username</dt>
                  <dd className="font-medium">{connection.accountInfo.username}</dd>
                </div>
              )}
              {connection.accountInfo.email && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Email</dt>
                  <dd className="font-medium">{connection.accountInfo.email}</dd>
                </div>
              )}
              {connection.accountInfo.profileUrl && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Profile</dt>
                  <dd>
                    <a
                      href={connection.accountInfo.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {connection.lastSyncAt && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              Last synced {formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* Disconnect confirmation dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {platformName}?</DialogTitle>
            <DialogDescription>
              This will remove your {platformName} connection and stop any scheduled posts.
              You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDisconnect()
                setShowDisconnectDialog(false)
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
