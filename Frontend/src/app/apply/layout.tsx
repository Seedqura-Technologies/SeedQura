import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Apply — Research Fellowship · Seedqura Learnings",
  description:
    "Apply for the 3-month Research Fellowship — selection form · from ₹6,999/mo or ₹19,999 full · pay only if accepted.",
};

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return children;
}
