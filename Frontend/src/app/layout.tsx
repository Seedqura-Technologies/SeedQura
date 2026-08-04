import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seedqura — Intelligent Agriculture × Precision Medicine",
  description:
    "A research-first technology company building intelligent AI for agriculture and precision medicine.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.seedqura.com"
  ),
  icons: {
    icon: [{ url: "/icon.png" }, { url: "/favicon.ico" }],
    apple: [{ url: "/apple-icon.png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Seedqura — Intelligent Agriculture × Precision Medicine",
    description:
      "Research-driven AI for agriculture and healthcare — from field to hospital.",
    siteName: "Seedqura",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Seedqura",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seedqura — Intelligent Agriculture × Precision Medicine",
    description:
      "Research-driven AI for agriculture and healthcare — from field to hospital.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full scroll-smooth`} data-scroll-behavior="smooth">
      <head>
        <style>{`
          html, body {
            background-color: #f4f2ef;
            color: #1c1714;
          }
        `}</style>
      </head>
      <body className={`${GeistSans.className} min-h-full flex flex-col antialiased bg-bg text-text`}>{children}</body>
    </html>
  );
}
