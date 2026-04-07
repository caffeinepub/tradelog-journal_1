import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Check, X, Zap } from "lucide-react";
import { NeonButton } from "./NeonButton";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  triggerReason?: string;
}

const proFeatures = [
  "Unlimited trade entries",
  "Full performance analytics",
  "Advanced annotation tools",
  "CSV bulk import",
  "Priority support",
];

export function UpgradeModal({
  open,
  onClose,
  triggerReason,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent border-none outline-none w-full h-full max-w-full max-h-full"
      aria-modal="true"
      aria-label="Upgrade to Pro"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyUp={(e) => e.key === "Escape" && onClose()}
        aria-hidden="true"
      />

      {/* panel */}
      <div
        className={cn(
          "relative w-full max-w-md glass-card p-8 border border-[#b900ff]/40 shadow-[0_0_40px_rgba(185,0,255,0.2)] slide-up",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
          data-ocid="upgrade-modal-close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#b900ff]/15 border border-[#b900ff]/40">
            <Zap className="h-5 w-5 text-[#b900ff]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Upgrade to Pro
            </h2>
            <p className="text-xs text-muted-foreground">
              $9.99/month · Cancel anytime
            </p>
          </div>
        </div>

        {triggerReason && (
          <p className="mt-3 text-sm text-[#b900ff] bg-[#b900ff]/10 rounded-lg px-3 py-2 border border-[#b900ff]/20">
            {triggerReason}
          </p>
        )}

        <ul className="mt-5 space-y-2.5">
          {proFeatures.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2.5 text-sm text-foreground"
            >
              <Check className="h-4 w-4 text-[#00ff41] shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <NeonButton
            variant="purple"
            size="lg"
            className="w-full"
            onClick={() => {
              navigate({ to: "/pricing" });
              onClose();
            }}
            data-ocid="upgrade-modal-go-pro"
          >
            <Zap className="h-4 w-4" />
            Go Pro Now
          </NeonButton>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </dialog>
  );
}
