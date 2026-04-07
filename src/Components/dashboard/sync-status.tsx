import { Wifi, WifiOff } from "lucide-react";

interface SyncStatusProps {
  isConnected: boolean;
  lastSyncedAt: Date | null;
}

function formatRelativeSync(lastSyncedAt: Date | null): string {
  if (!lastSyncedAt) return "Waiting for first sync";

  const diffMs = Date.now() - lastSyncedAt.getTime();
  if (diffMs < 2000) return "Synced just now";
  if (diffMs < 60000) return `Synced ${Math.floor(diffMs / 1000)}s ago`;
  return `Synced ${Math.floor(diffMs / 60000)}m ago`;
}

export function SyncStatus({ isConnected, lastSyncedAt }: SyncStatusProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/80 px-3 py-2 text-xs backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-primary" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        <span className="font-medium">{isConnected ? "Connected" : "Reconnect"}</span>
      </div>
      <p className="mt-1 text-muted-foreground">{formatRelativeSync(lastSyncedAt)}</p>
    </div>
  );
}
