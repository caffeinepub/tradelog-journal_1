import { cn } from "@/lib/utils";
import type React from "react";

type NeonVariant = "green" | "purple" | "cyan" | "outline";
type NeonSize = "sm" | "md" | "lg";

interface NeonButtonProps extends React.ComponentProps<"button"> {
  variant?: NeonVariant;
  size?: NeonSize;
  loading?: boolean;
}

const variantStyles: Record<NeonVariant, string> = {
  green:
    "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/40 hover:bg-[#00ff41]/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:border-[#00ff41]/70",
  purple:
    "bg-[#b900ff]/10 text-[#b900ff] border border-[#b900ff]/40 hover:bg-[#b900ff]/20 hover:shadow-[0_0_20px_rgba(185,0,255,0.4)] hover:border-[#b900ff]/70",
  cyan: "bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/40 hover:bg-[#00ffff]/20 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:border-[#00ffff]/70",
  outline:
    "bg-transparent text-foreground border border-border hover:border-[#00ff41]/50 hover:text-[#00ff41] hover:shadow-[0_0_12px_rgba(0,255,65,0.2)]",
};

const sizeStyles: Record<NeonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-base rounded-xl gap-2 font-semibold",
};

export function NeonButton({
  className,
  variant = "green",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: NeonButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-smooth",
        "active:scale-95 hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
