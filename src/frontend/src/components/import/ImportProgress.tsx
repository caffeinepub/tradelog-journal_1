import type { ImportJobPublic } from "@/backend.d";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";

interface ImportProgressProps {
  total: number;
  imported: number;
  errors: number;
  status: "running" | "done" | "error";
  importJob: ImportJobPublic | null;
  onReset: () => void;
}

export function ImportProgress({
  total,
  imported,
  errors,
  status,
  importJob,
  onReset,
}: ImportProgressProps) {
  const pct = total > 0 ? Math.round((imported / total) * 100) : 0;
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <div className="space-y-5" data-ocid="import-progress">
      {/* Status card */}
      <GlassCard
        className={cn(
          "border",
          isDone
            ? "border-[#00ff41]/30"
            : isError
              ? "border-red-500/30"
              : "border-[#00ffff]/30",
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          {isDone ? (
            <CheckCircle className="h-6 w-6 text-[#00ff41] shrink-0" />
          ) : isError ? (
            <XCircle className="h-6 w-6 text-red-400 shrink-0" />
          ) : (
            <Clock className="h-6 w-6 text-[#00ffff] shrink-0 animate-pulse" />
          )}
          <div>
            <p className="font-semibold text-foreground">
              {isDone
                ? "Import complete!"
                : isError
                  ? "Import failed"
                  : "Importing trades…"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isDone
                ? `${imported} of ${total} rows imported`
                : isError
                  ? (importJob?.errors?.[0]?.reason ??
                    "An unexpected error occurred")
                  : `Processing ${total} rows`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={pct}
          label={`${imported} / ${total} rows`}
          showPercent
        />

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatChip label="Total" value={total} color="muted" />
          <StatChip label="Imported" value={imported} color="green" />
          <StatChip
            label="Errors"
            value={errors}
            color={errors > 0 ? "red" : "muted"}
          />
        </div>
      </GlassCard>

      {/* Error details table */}
      {isDone && importJob && importJob.errors.length > 0 && (
        <GlassCard className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <p className="text-sm font-semibold text-foreground">
              Import Errors ({importJob.errors.length})
            </p>
          </div>
          <div className="rounded-lg border border-border overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                    Row
                  </th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody>
                {importJob.errors.map((err) => (
                  <tr
                    key={Number(err.lineNumber)}
                    className="border-b border-border/50 hover:bg-card/40"
                  >
                    <td className="px-3 py-2 text-muted-foreground font-mono">
                      {String(err.lineNumber)}
                    </td>
                    <td className="px-3 py-2 text-red-400">{err.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Actions */}
      {isDone && (
        <div className="flex items-center gap-3">
          <Link to="/trades">
            <NeonButton
              variant="green"
              size="md"
              data-ocid="import-view-trades-btn"
            >
              <ExternalLink className="h-4 w-4" />
              View Trade History
            </NeonButton>
          </Link>
          <NeonButton
            variant="outline"
            size="md"
            onClick={onReset}
            data-ocid="import-again-btn"
          >
            Import Another File
          </NeonButton>
        </div>
      )}
    </div>
  );
}

interface StatChipProps {
  label: string;
  value: number;
  color: "green" | "red" | "muted";
}

function StatChip({ label, value, color }: StatChipProps) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
      <p
        className={cn(
          "text-lg font-bold font-mono",
          color === "green"
            ? "text-[#00ff41]"
            : color === "red"
              ? "text-red-400"
              : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
