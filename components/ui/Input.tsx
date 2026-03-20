import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "theme-input w-full border-[3px] border-ink bg-white px-4 py-3 text-sm font-bold outline-none focus:-translate-x-1 focus:-translate-y-1 focus:shadow-brutal-sm",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "theme-input min-h-36 w-full resize-y border-[3px] border-ink bg-white px-4 py-3 text-sm font-bold outline-none focus:-translate-x-1 focus:-translate-y-1 focus:shadow-brutal-sm",
        className
      )}
      {...props}
    />
  );
}
