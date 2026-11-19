import type { ReactNode } from "react";
import { Reveal, WordsRise } from "@/components/motion";
import { cn } from "@/lib/cn";

type Props = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
  children?: ReactNode;
};

export function SectionHeader({ id, title, description, as: Tag = "h2", className, children }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        <Tag id={id} className={Tag === "h1" ? "text-display text-navy-700" : "text-h2 text-navy-700"}>
          {typeof title === "string" ? <WordsRise text={title} onView /> : title}
        </Tag>
        {description && (
          <Reveal as="p" delay={0.25} y={14} className="mt-3 text-base leading-relaxed text-subtle md:text-lg">
            {description}
          </Reveal>
        )}
      </div>
      {children && <Reveal delay={0.35}>{children}</Reveal>}
    </div>
  );
}

/** Pembungkus lebar konten. 1200px di desktop sesuai Figma; dalam rem supaya ikut membesar di layar besar. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[80rem] px-6 md:px-10 xl:px-10", className)}>{children}</div>;
}
