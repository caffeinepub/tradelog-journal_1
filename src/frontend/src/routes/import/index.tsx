import { createActor } from "@/backend";
import type {
  CsvTradeRow,
  Direction,
  ImportJobPublic,
  MarketCondition,
  SessionTime,
} from "@/backend.d";
import { CSVUploadZone } from "@/components/import/CSVUploadZone";
import { ColumnMapper, TRADE_FIELDS } from "@/components/import/ColumnMapper";
import { ImportProgress } from "@/components/import/ImportProgress";
import { PreviewTable } from "@/components/import/PreviewTable";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { useTradeLimits } from "@/hooks/use-trade-limits";
import { useActor } from "@caffeineai/core-infrastructure";
import { createRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  FileText,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/import",
  component: ImportPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedRow = {
  _rowIndex: number;
  _errors: string[];
} & Record<string, string | number | string[] | undefined>;

type ImportStep = "upload" | "map" | "preview" | "importing" | "done";

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) return { headers: [], rows: [] };
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(1)
    .filter((l) => l.trim())
    .map(parseRow);
  return { headers, rows };
}

function autoDetectMapping(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of TRADE_FIELDS) {
    const match = headers.find(
      (h) =>
        h.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          field.key.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        h.toLowerCase().includes(field.key.toLowerCase()),
    );
    if (match) map[field.key] = match;
  }
  return map;
}

function applyMapping(
  rawRows: string[][],
  headers: string[],
  mapping: Record<string, string>,
): ParsedRow[] {
  return rawRows.slice(0, 10).map((row, idx) => {
    const parsed: ParsedRow = { _rowIndex: idx + 2, _errors: [] };
    for (const field of TRADE_FIELDS) {
      const csvCol = mapping[field.key];
      if (!csvCol || csvCol === "__skip__") continue;
      const colIdx = headers.indexOf(csvCol);
      if (colIdx === -1) continue;
      const raw = row[colIdx] ?? "";
      // Basic validation
      if (field.required && !raw) {
        parsed._errors.push(`${field.label} is required`);
      }
      if (
        field.key === "direction" &&
        raw &&
        !["long", "short", "buy", "sell"].includes(raw.toLowerCase())
      ) {
        parsed._errors.push(`invalid direction value: ${raw}`);
      }
      if (
        (field.key === "entryPrice" || field.key === "exitPrice") &&
        raw &&
        Number.isNaN(Number(raw))
      ) {
        parsed._errors.push(`${field.label} must be a number`);
      }
      parsed[field.key] = raw;
    }
    return parsed;
  });
}

// ─── Backend row builder ──────────────────────────────────────────────────────

function normalizeDirection(val: string): Direction {
  const v = val.toLowerCase();
  if (v === "short" || v === "sell") return "SHORT" as Direction;
  return "LONG" as Direction;
}

function parseTimestamp(val: string): bigint {
  const ts = Date.parse(val);
  if (Number.isNaN(ts)) return BigInt(Date.now()) * 1_000_000n;
  return BigInt(ts) * 1_000_000n;
}

function buildCsvRows(
  rawRows: string[][],
  headers: string[],
  mapping: Record<string, string>,
): CsvTradeRow[] {
  const get = (row: string[], key: string): string => {
    const col = mapping[key];
    if (!col || col === "__skip__") return "";
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? "") : "";
  };

  return rawRows
    .map((row) => {
      const pair = get(row, "pair");
      const direction = get(row, "direction");
      const entryPrice = Number(get(row, "entryPrice"));
      const exitPrice = Number(get(row, "exitPrice"));
      const entryDateRaw = get(row, "entryDate");
      const exitDateRaw = get(row, "exitDate");

      if (!pair || !direction || !entryDateRaw || !exitDateRaw) return null;
      if (Number.isNaN(entryPrice) || Number.isNaN(exitPrice)) return null;

      const csvRow: CsvTradeRow = {
        pair,
        direction: normalizeDirection(direction),
        entryPrice,
        exitPrice,
        entryDate: parseTimestamp(entryDateRaw),
        exitDate: parseTimestamp(exitDateRaw),
      };

      const pnlRaw = get(row, "pnl");
      if (pnlRaw && !Number.isNaN(Number(pnlRaw))) csvRow.pnl = Number(pnlRaw);

      const rrRaw = get(row, "riskReward");
      if (rrRaw && !Number.isNaN(Number(rrRaw)))
        csvRow.riskReward = Number(rrRaw);

      const strategy = get(row, "strategyTag");
      if (strategy) csvRow.strategyTag = strategy;

      const mistake = get(row, "mistakeTag");
      if (mistake) csvRow.mistakeTag = mistake;

      const notes = get(row, "notes");
      if (notes) csvRow.notes = notes;

      const session = get(row, "sessionTime");
      const sessionMap: Record<string, SessionTime> = {
        asian: "ASIAN" as SessionTime,
        london: "LONDON" as SessionTime,
        ny: "NY" as SessionTime,
      };
      if (session && sessionMap[session.toLowerCase()])
        csvRow.sessionTime = sessionMap[session.toLowerCase()];

      const mc = get(row, "marketCondition");
      const mcMap: Record<string, MarketCondition> = {
        trending: "TRENDING" as MarketCondition,
        ranging: "RANGING" as MarketCondition,
        volatile: "VOLATILE" as MarketCondition,
        choppy: "CHOPPY" as MarketCondition,
        other: "OTHER" as MarketCondition,
      };
      if (mc && mcMap[mc.toLowerCase()])
        csvRow.marketCondition = mcMap[mc.toLowerCase()];

      return csvRow;
    })
    .filter((r): r is CsvTradeRow => r !== null);
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS: { id: ImportStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "map", label: "Map Columns" },
  { id: "preview", label: "Preview" },
  { id: "importing", label: "Import" },
];

function StepIndicator({ current }: { current: ImportStep }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div
              className={
                i <= idx
                  ? "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-[#00ff41]/20 border border-[#00ff41]/50 text-[#00ff41]"
                  : "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-muted border border-border text-muted-foreground"
              }
            >
              {i + 1}
            </div>
            <span
              className={
                i <= idx
                  ? "text-xs font-medium text-foreground"
                  : "text-xs text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={
                i < idx
                  ? "w-8 h-px mx-2 bg-[#00ff41]/30"
                  : "w-8 h-px mx-2 bg-border"
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Free Tier Cap Banner ─────────────────────────────────────────────────────

interface CapBannerProps {
  toImport: number;
  available: number;
  onUpgrade: () => void;
}

function CapBanner({ toImport, available, onUpgrade }: CapBannerProps) {
  const canImport = Math.min(toImport, available);
  const skipped = toImport - canImport;

  return (
    <GlassCard className="border border-yellow-500/30 bg-yellow-500/5 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Free tier limit approaching
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {available === 0
              ? "You've reached your 25-trade limit. Upgrade to import all trades."
              : `You can import ${canImport} trade${canImport !== 1 ? "s" : ""}. ${skipped > 0 ? `${skipped} will be skipped.` : ""}`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="flex items-center gap-2 text-xs font-semibold text-[#b900ff] border border-[#b900ff]/30 rounded-lg px-3 py-1.5 hover:bg-[#b900ff]/10 transition-smooth"
        data-ocid="import-cap-upgrade-cta"
      >
        <Zap className="h-3.5 w-3.5" />
        Unlock unlimited imports
      </button>
    </GlassCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ImportPage() {
  const { actor } = useActor(createActor);
  const limits = useTradeLimits();

  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [importAttempts, setImportAttempts] = useState(0);

  const [importStatus, setImportStatus] = useState<
    "running" | "done" | "error"
  >("running");
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [importJob, setImportJob] = useState<ImportJobPublic | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows } = parseCsvText(text);
      setHeaders(h);
      setRawRows(rows);
      const autoMap = autoDetectMapping(h);
      setMapping(autoMap);
    };
    reader.readAsText(f);
  }, []);

  const handleClear = () => {
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setStep("upload");
  };

  const handleMappingChange = (key: string, value: string) => {
    setMapping((m) => ({ ...m, [key]: value }));
  };

  const goToPreview = () => {
    const rows = applyMapping(rawRows, headers, mapping);
    setPreviewRows(rows);
    setStep("preview");
  };

  const handleImport = async () => {
    // Upgrade prompt on 3rd attempt for free users
    const nextAttempt = importAttempts + 1;
    setImportAttempts(nextAttempt);
    if (limits.tier === "FREE" && nextAttempt >= 3) {
      setUpgradeOpen(true);
      return;
    }

    const available =
      limits.tier === "FREE"
        ? Math.max(0, limits.totalLimit - limits.totalCount)
        : Number.POSITIVE_INFINITY;

    if (limits.tier === "FREE" && available <= 0) {
      setUpgradeOpen(true);
      return;
    }

    setStep("importing");
    setImportStatus("running");

    const csvRows = buildCsvRows(rawRows, headers, mapping);
    const limited =
      limits.tier === "FREE" ? csvRows.slice(0, available) : csvRows;

    try {
      if (!actor) throw new Error("Not connected to backend");
      const job = await actor.bulkImportTrades(limited);
      setImportJob(job);
      setImportedCount(Number(job.importedCount));
      setErrorCount(job.errors.length);
      setImportStatus(job.status === "FAILED" ? "error" : "done");
      if (job.status !== "FAILED") {
        toast.success(
          `${Number(job.importedCount)} trades imported successfully!`,
        );
      }
    } catch (err) {
      console.error(err);
      setImportStatus("error");
      toast.error("Import failed. Please try again.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setPreviewRows([]);
    setStep("upload");
    setImportStatus("running");
    setImportedCount(0);
    setErrorCount(0);
    setImportJob(null);
  };

  const requiredMapped = TRADE_FIELDS.filter(
    (f) => f.required && mapping[f.key] && mapping[f.key] !== "__skip__",
  ).length;
  const requiredTotal = TRADE_FIELDS.filter((f) => f.required).length;
  const canProceedToPreview = requiredMapped === requiredTotal;

  const available =
    limits.tier === "FREE"
      ? Math.max(0, limits.totalLimit - limits.totalCount)
      : rawRows.length;

  const showCapBanner =
    limits.tier === "FREE" && rawRows.length > 0 && available < rawRows.length;

  return (
    <div
      className="max-w-3xl mx-auto space-y-6 fade-in"
      data-ocid="import-page"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#00ff41]" />
            CSV Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk-import past trades retroactively — map columns, preview, and
            confirm
          </p>
        </div>
      </div>

      {/* Step indicator */}
      {step !== "done" && <StepIndicator current={step} />}

      {/* Free tier cap banner */}
      {showCapBanner && step !== "importing" && step !== "done" && (
        <CapBanner
          toImport={rawRows.length}
          available={available}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      )}

      {/* Free tier usage bar */}
      {limits.tier === "FREE" && step !== "importing" && step !== "done" && (
        <GlassCard className="py-3">
          <ProgressBar
            value={limits.totalPct}
            label={`Free tier: ${limits.totalCount} / ${limits.totalLimit} trades used`}
            showPercent
          />
        </GlassCard>
      )}

      {/* ── Step: Upload ── */}
      {step === "upload" && (
        <div className="space-y-4">
          <CSVUploadZone
            file={file}
            columnCount={headers.length}
            onFile={handleFile}
            onClear={handleClear}
          />
          {file && headers.length > 0 && (
            <div className="flex justify-end">
              <NeonButton
                variant="green"
                size="md"
                onClick={() => setStep("map")}
                data-ocid="import-next-to-map-btn"
              >
                Map Columns
                <ArrowRight className="h-4 w-4" />
              </NeonButton>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Map ── */}
      {step === "map" && (
        <div className="space-y-4">
          <ColumnMapper
            headers={headers}
            mapping={mapping}
            onMappingChange={handleMappingChange}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <NeonButton
              variant="green"
              size="md"
              disabled={!canProceedToPreview}
              onClick={goToPreview}
              data-ocid="import-next-to-preview-btn"
            >
              Preview Rows
              <ArrowRight className="h-4 w-4" />
            </NeonButton>
          </div>
          {!canProceedToPreview && (
            <p className="text-xs text-yellow-400 text-right">
              Map all required fields ({requiredMapped}/{requiredTotal}) to
              continue
            </p>
          )}
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <GlassCard>
            <p className="text-xs text-muted-foreground mb-3">
              Showing first 10 rows — review for errors before importing{" "}
              {rawRows.length} total rows
            </p>
            <PreviewTable rows={previewRows} />
          </GlassCard>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("map")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to mapping
            </button>
            <NeonButton
              variant="green"
              size="lg"
              onClick={handleImport}
              data-ocid="import-confirm-btn"
            >
              Import {rawRows.length} Trades
              <ArrowRight className="h-4 w-4" />
            </NeonButton>
          </div>
        </div>
      )}

      {/* ── Step: Importing / Done ── */}
      {(step === "importing" || step === "done") && (
        <ImportProgress
          total={rawRows.length}
          imported={importedCount}
          errors={errorCount}
          status={importStatus}
          importJob={importJob}
          onReset={handleReset}
        />
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        triggerReason={
          importAttempts >= 3
            ? "You've tried to import 3 times — Pro users get unlimited imports and full history access."
            : available <= 0
              ? "You've reached the 25-trade free tier limit. Upgrade to import your entire trading history."
              : `You can only import ${available} more trade${available !== 1 ? "s" : ""} on the free plan.`
        }
      />
    </div>
  );
}
