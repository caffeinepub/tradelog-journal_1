import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { NeonButton } from "./NeonButton";

interface BlurredTeaserProps {
  teaserText: string;
  ctaText?: string;
  onUpgrade?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function BlurredTeaser({
  teaserText,
  ctaText = "Unlock Pro",
  onUpgrade,
  className,
  children,
}: BlurredTeaserProps) {
  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      {/* blurred content behind */}
      <div
        className="blur-sm pointer-events-none select-none opacity-60"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/70 backdrop-blur-sm rounded-lg border border-[#b900ff]/30 p-6 text-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#b900ff]/15 border border-[#b900ff]/40">
          <Lock className="h-4 w-4 text-[#b900ff]" />
        </div>
        <p className="text-sm font-medium text-foreground max-w-xs leading-snug">
          {teaserText}
        </p>
        <NeonButton
          variant="purple"
          size="sm"
          onClick={onUpgrade}
          data-ocid="blurred-teaser-upgrade-cta"
        >
          {ctaText}
        </NeonButton>
      </div>
    </div>
  );
}
