import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { ParsedRow } from "../../routes/import/index";

interface PreviewTableProps {
  rows: ParsedRow[];
}

const VISIBLE_COLS = [
  "entryDate",
  "pair",
  "direction",
  "entryPrice",
  "exitPrice",
  "pnl",
  "strategyTag",
];

export function PreviewTable({ rows }: PreviewTableProps) {
  const errorCount = rows.filter((r) => r._errors.length > 0).length;
  const validCount = rows.length - errorCount;

  return (
    <div className="space-y-3" data-ocid="import-preview-table">
      {/* Summary chips */}
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 text-[#00ff41]">
          <CheckCircle className="h-3.5 w-3.5" />
          {validCount} valid
        </span>
        {errorCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {errorCount} errors
          </span>
        )}
        <span className="text-muted-foreground ml-auto text-xs">
          Showing first {rows.length} rows
        </span>
      </div>

      {/* Scrollable table */}
      <div className="rounded-xl border border-border overflow-auto max-h-64 scrollbar-thin">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-card/60">
              <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8">
                #
              </th>
              {VISIBLE_COLS.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-muted-foreground font-medium capitalize"
                >
                  {col.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row._rowIndex ?? i}
                className={cn(
                  "border-b border-border/50 transition-colors",
                  row._errors.length > 0
                    ? "bg-red-500/8 hover:bg-red-500/12"
                    : "hover:bg-card/40",
                )}
              >
                <td className="px-3 py-2 text-muted-foreground font-mono">
                  {i + 1}
                </td>
                {VISIBLE_COLS.map((col) => (
                  <td
                    key={col}
                    className={cn(
                      "px-3 py-2 font-mono truncate max-w-[120px]",
                      row._errors.some((e) => e.includes(col))
                        ? "text-red-400"
                        : "text-foreground",
                    )}
                  >
                    {String(row[col] ?? "—")}
                  </td>
                ))}
                <td className="px-3 py-2">
                  {row._errors.length > 0 ? (
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0 h-4 bg-red-500/20 text-red-400 border border-red-500/30"
                      title={row._errors.join(", ")}
                    >
                      {row._errors[0].length > 20
                        ? `${row._errors[0].slice(0, 20)}…`
                        : row._errors[0]}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20"
                    >
                      valid
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
