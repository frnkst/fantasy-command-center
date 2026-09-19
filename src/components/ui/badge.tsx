import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "positive" | "warning" | "danger";
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.08em] uppercase",
        tone === "neutral" && "border-white/10 bg-white/6 text-white/55",
        tone === "positive" &&
          "border-lime-300/30 bg-lime-300/10 text-lime-200",
        tone === "warning" &&
          "border-amber-300/30 bg-amber-300/10 text-amber-200",
        tone === "danger" && "border-red-300/30 bg-red-300/10 text-red-200",
        className,
      )}
      {...props}
    />
  );
}
