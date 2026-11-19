import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Kost 3g" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
