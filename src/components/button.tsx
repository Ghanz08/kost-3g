import Link from "next/link";
import type { ReactNode } from "react";
import { transitionFor } from "@/components/page-transition";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "light";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-700",
  secondary: "bg-surface text-brand-500 ring-2 ring-inset ring-brand-500 hover:bg-brand-50",
  ghost: "text-brand-500 hover:bg-brand-50",
  light: "bg-surface text-brand-700 hover:bg-brand-50",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-14 px-7 text-base",
};

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
  /** Tautan keluar (WhatsApp, Google Maps) dibuka di tab baru. */
  external?: boolean;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
  external,
}: Props) {
  const classes = cn(
    "group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[color,background-color,scale] duration-200 active:scale-[0.97]",
    variants[variant],
    sizes[size],
    className,
  );
  const content = (
    <>
      {icon && (
        <span className="transition-transform duration-300 ease-out group-hover/btn:-rotate-12 group-hover/btn:scale-115">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} transitionTypes={transitionFor(href)}>
      {content}
    </Link>
  );
}
