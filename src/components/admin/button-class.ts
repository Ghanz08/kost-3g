import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** Gaya tombol admin. Tinggi minimal 40px (WCAG 2.5.8 minta 24px; 40px nyaman untuk jari). */
export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "sm" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    size === "md" ? "min-h-10 px-4 text-sm" : "min-h-9 px-3 text-sm",
    variant === "primary" && "bg-brand-500 text-white hover:bg-brand-700",
    variant === "secondary" && "bg-surface text-navy-700 ring-1 ring-field ring-inset hover:bg-paper",
    variant === "ghost" && "text-brand-700 hover:bg-brand-50",
    variant === "danger" && "bg-surface text-red-700 ring-1 ring-red-300 ring-inset hover:bg-red-50",
  );
}
