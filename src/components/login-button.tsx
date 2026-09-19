"use client";

import { ArrowRight, Lock01 } from "@untitledui/icons";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full justify-between px-5" type="submit" disabled={pending}>
      <span className="flex items-center gap-2.5">
        <Lock01 className="size-5" aria-hidden="true" />
        {pending ? "Checking password…" : "Enter command center"}
      </span>
      <ArrowRight className="size-5" aria-hidden="true" />
    </Button>
  );
}
