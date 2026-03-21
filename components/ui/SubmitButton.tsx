"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";

type SubmitButtonProps = {
  idleLabel: ReactNode;
  pendingLabel: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
};

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
  variant = "primary"
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      disabled={pending}
      aria-busy={pending}
    >
      <span className="flex items-center gap-2">
        {pending ? (
          <>
            <span className="inline-block h-3 w-3 animate-pulse border-[3px] border-ink bg-white" />
            <span>{pendingLabel}</span>
          </>
        ) : (
          idleLabel
        )}
      </span>
    </Button>
  );
}
