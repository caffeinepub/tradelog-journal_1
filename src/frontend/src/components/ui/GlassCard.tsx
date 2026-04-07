import { cn } from "@/lib/utils";
import type React from "react";

interface GlassCardProps extends React.ComponentProps<"div"> {
  glow?: "green" | "purple" | "cyan" | "none";
  hover?: boolean;
}

const glowColors = {
  green:
    "hover:shadow-[0_0_24px_rgba(0,255,65,0.25)] hover:border-[#00ff41]/40",
  purple:
    "hover:shadow-[0_0_24px_rgba(185,0,255,0.25)] hover:border-[#b900ff]/40",
  cyan: "hover:shadow-[0_0_24px_rgba(0,255,255,0.25)] hover:border-[#00ffff]/40",
  none: "",
};

export function GlassCard({
  className,
  glow = "none",
  hover = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-5 transition-smooth",
        hover && "cursor-pointer",
        hover && glow !== "none" && glowColors[glow],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
