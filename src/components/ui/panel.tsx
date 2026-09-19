import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-[#d9d5cb] bg-[#fffdf8] shadow-[0_14px_36px_rgba(37,43,52,0.07)]",
        className,
      )}
      {...props}
    />
  );
}
