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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.025em]",
        tone === "neutral" && "border-[#d9d5cb] bg-[#f5f2ea] text-[#5d6875]",
        tone === "positive" &&
          "border-[#b8d7c9] bg-[#e9f5ef] text-[#176b4d]",
        tone === "warning" &&
          "border-[#ebc4ae] bg-[#fff0e6] text-[#a4481c]",
        tone === "danger" && "border-[#e7b8bb] bg-[#fcebec] text-[#9d3037]",
        className,
      )}
      {...props}
    />
  );
}
