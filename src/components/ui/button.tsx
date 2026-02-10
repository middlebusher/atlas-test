import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 active:opacity-95 shadow-[var(--shadow-sm)]",
  secondary:
    "bg-white text-foreground border border-border hover:bg-muted/80 dark:bg-muted dark:border-border",
  ghost: "text-foreground hover:bg-muted",
  link: "text-accent underline-offset-4 hover:underline",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm rounded-[var(--radius)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius)]",
  lg: "h-11 px-5 text-sm rounded-[var(--radius)]",
} as const;

const base =
  "inline-flex items-center justify-center font-medium transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
  href?: string;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  asChild,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (asChild && href && children) {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
