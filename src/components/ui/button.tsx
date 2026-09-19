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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#2855d9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2efe7] disabled:cursor-not-allowed disabled:opacity-55",
        tone === "primary" &&
          "bg-[#2855d9] text-white shadow-[0_8px_24px_rgba(40,85,217,0.18)] hover:-translate-y-0.5 hover:bg-[#1f48c4]",
        tone === "secondary" &&
          "border border-[#cbc6ba] bg-[#fffdf8] text-[#17202a] hover:border-[#9d978a] hover:bg-white",
        tone === "ghost" && "text-[#58636f] hover:bg-[#e6e2d8] hover:text-[#17202a]",
        className,
      )}
      {...props}
    />
  );
}
