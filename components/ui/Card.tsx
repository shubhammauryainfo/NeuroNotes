import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "theme-card border-[3px] border-ink bg-cream p-5 shadow-brutal",
        className
      )}
      {...props}
    />
  );
}
