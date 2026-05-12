import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Pull — The daily AI brief, delivered where you work",
  description:
    "A daily AI news brief for developers. Curated weekday mornings, delivered to your terminal, agent, inbox, or feed reader.",
  metadataBase: new URL("https://thepull.dev"),
  openGraph: {
    type: "website",
    title: "The Pull — The daily AI brief",
    description:
      "A daily AI news brief for developers. Delivered where you work.",
    url: "https://thepull.dev",
    siteName: "The Pull",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Pull",
    description: "The daily AI brief, delivered where you work.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
