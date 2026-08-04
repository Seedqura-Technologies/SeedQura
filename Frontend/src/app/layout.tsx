import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seedqura — Intelligent Agriculture × Precision Medicine",
  description:
    "A research-first technology company building intelligent AI for agriculture and precision medicine.",
  openGraph: {
    title: "Seedqura — Intelligent Agriculture × Precision Medicine",
    description:
      "Research-driven AI for agriculture and healthcare — from field to hospital.",
    images: ["/logo.png"],
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
