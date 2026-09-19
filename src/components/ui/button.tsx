import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  tone = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1613] disabled:cursor-not-allowed disabled:opacity-55",
        tone === "primary" &&
          "bg-lime-300 text-[#0b1814] shadow-[0_8px_24px_rgba(190,242,100,0.18)] hover:-translate-y-0.5 hover:bg-lime-200",
        tone === "secondary" &&
          "border border-white/12 bg-white/7 text-white hover:bg-white/12",
        tone === "ghost" && "text-white/70 hover:bg-white/8 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
