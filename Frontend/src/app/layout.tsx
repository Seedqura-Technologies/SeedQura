import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { CookieConsent } from "@/components/legal/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seedqura — AI for precision medicine",
  description:
    "Independent research lab building NeuroVision for cerebral vasculature and Sampoorna for women's healthcare.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.seedqura.com"
  ),
  icons: {
    icon: [{ url: "/icon.png" }, { url: "/favicon.ico" }],
    apple: [{ url: "/apple-icon.png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Seedqura — AI for precision medicine",
    description:
      "NeuroVision for cerebral vessels and aneurysms. Sampoorna for women's health. Research that ships.",
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
    title: "Seedqura — AI for precision medicine",
    description:
      "NeuroVision for cerebral vessels and aneurysms. Sampoorna for women's health.",
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
            background-color: #080808;
            color: #F2F2EF;
          }
        `}</style>
      </head>
      <body className={`${GeistSans.className} min-h-full flex flex-col antialiased bg-bg text-text`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
