import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/9 bg-[#0d1d17]/92 shadow-[0_18px_45px_rgba(0,0,0,0.16)]",
        className,
      )}
      {...props}
    />
  );
}
