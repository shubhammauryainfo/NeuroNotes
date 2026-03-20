import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const variantStyles = {
  primary: "bg-lemon",
  secondary: "bg-sky",
  danger: "bg-coral"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center border-[3px] border-ink px-4 py-3 text-sm font-black uppercase tracking-wide text-ink shadow-brutal transition duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
