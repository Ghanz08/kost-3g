import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/motion";
import { site } from "@/lib/site";
import "./globals.css";

// Situs publik statis diatur di app/(situs)/layout.tsx; /admin dinamis karena membaca sesi login.

const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin-wght.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Kost 3g, kost putri di Brayan, Medan",
    template: "%s | Kost 3g",
  },
  description: site.description,
  applicationName: site.name,
  keywords: ["kost putri Medan", "kost Brayan", "kost dekat POLTEK AMI", "kost dekat UMSU", "kost murah Medan"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.name,
    title: "Kost 3g, kost putri di Brayan, Medan",
    description: site.description,
    url: "/",
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#346854",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${bricolage.variable} ${jakarta.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
