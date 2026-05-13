import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SiteHeader } from "@/components/chrome/site-header";
import { SiteFooter } from "@/components/chrome/site-footer";

export const metadata: Metadata = {
  title: "The Pull — The daily AI brief, delivered where you build",
  description:
    "A daily AI news brief for developers. Curated weekday mornings, delivered to your terminal, agent, inbox, or feed reader.",
  metadataBase: new URL("https://thepull.dev"),
  openGraph: {
    type: "website",
    title: "The Pull — The daily AI brief",
    description:
      "A daily AI news brief for developers. Delivered where you build.",
    url: "https://thepull.dev",
    siteName: "The Pull",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Pull",
    description: "The daily AI brief, delivered where you build.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className="min-h-screen flex flex-col">
        <div className="scanlines-overlay" aria-hidden />
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
