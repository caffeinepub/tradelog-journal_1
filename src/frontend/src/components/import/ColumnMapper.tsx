import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export interface TradeField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

export const TRADE_FIELDS: TradeField[] = [
  {
    key: "entryDate",
    label: "Entry Date",
    required: true,
    description: "Date/time of trade entry",
  },
  {
    key: "exitDate",
    label: "Exit Date",
    required: true,
    description: "Date/time of trade exit",
  },
  {
    key: "pair",
    label: "Pair / Symbol",
    required: true,
    description: "Trading pair e.g. EURUSD, AAPL",
  },
  {
    key: "direction",
    label: "Direction",
    required: true,
    description: "LONG or SHORT",
  },
  {
    key: "entryPrice",
    label: "Entry Price",
    required: true,
    description: "Price at entry",
  },
  {
    key: "exitPrice",
    label: "Exit Price",
    required: true,
    description: "Price at exit",
  },
  {
    key: "pnl",
    label: "P&L",
    required: false,
    description: "Profit or loss amount",
  },
  {
    key: "riskReward",
    label: "Risk/Reward",
    required: false,
    description: "R:R ratio e.g. 2.5",
  },
  {
    key: "strategyTag",
    label: "Strategy Tag",
    required: false,
    description: "Your strategy label",
  },
  {
    key: "mistakeTag",
    label: "Mistake Tag",
    required: false,
    description: "Common mistake label",
  },
  {
    key: "sessionTime",
    label: "Session",
    required: false,
    description: "ASIAN, LONDON, NY, OTHER",
  },
  {
    key: "marketCondition",
    label: "Market Condition",
    required: false,
    description: "TRENDING, RANGING, etc.",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    description: "Free text notes",
  },
];

interface ColumnMapperProps {
  headers: string[];
  mapping: Record<string, string>;
  onMappingChange: (key: string, value: string) => void;
}

export function ColumnMapper({
  headers,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const requiredFields = TRADE_FIELDS.filter((f) => f.required);
  const optionalFields = TRADE_FIELDS.filter((f) => !f.required);
  const mappedRequired = requiredFields.filter((f) => mapping[f.key]);
  const allRequiredMapped = mappedRequired.length === requiredFields.length;

  return (
    <div className="space-y-4" data-ocid="import-column-mapper">
      {/* Status summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Map your CSV columns to TradeLog fields
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-mono font-semibold",
              allRequiredMapped ? "text-[#00ff41]" : "text-yellow-400",
            )}
          >
            {mappedRequired.length}/{requiredFields.length} required
          </span>
        </div>
      </div>

      {/* Required fields */}
      <GlassCard className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00ff41] mb-1">
          Required Fields
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requiredFields.map((field) => (
            <FieldRow
              key={field.key}
              field={field}
              headers={headers}
              value={mapping[field.key] ?? ""}
              onChange={(v) => onMappingChange(field.key, v)}
            />
          ))}
        </div>
      </GlassCard>

      {/* Optional fields */}
      <GlassCard className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Optional Fields
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {optionalFields.map((field) => (
            <FieldRow
              key={field.key}
              field={field}
              headers={headers}
              value={mapping[field.key] ?? ""}
              onChange={(v) => onMappingChange(field.key, v)}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

interface FieldRowProps {
  field: TradeField;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
}

function FieldRow({ field, headers, value, onChange }: FieldRowProps) {
  return (
    <div className="space-y-1" data-ocid={`mapper-field-${field.key}`}>
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium text-foreground">
          {field.label}
        </Label>
        <Badge
          variant={field.required ? "default" : "secondary"}
          className={cn(
            "text-[10px] px-1.5 py-0 h-4",
            field.required
              ? "bg-[#00ff41]/15 text-[#00ff41] border-[#00ff41]/30"
              : "bg-muted text-muted-foreground border-transparent",
          )}
        >
          {field.required ? "required" : "optional"}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5 truncate font-mono">
          {value || "—"}
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            className="h-8 text-xs flex-1 bg-card/60 border-border"
            data-ocid={`mapper-select-${field.key}`}
          >
            <SelectValue placeholder="Select column…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__skip__">— skip —</SelectItem>
            {headers.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[10px] text-muted-foreground">{field.description}</p>
    </div>
  );
}
