"use client";

import { X } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
  anchorPrefix?: string;
};

export function MobileNav({ open, onClose, links, anchorPrefix = "" }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="font-heading text-lg font-bold text-white">Menu</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl glass"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={`${anchorPrefix}${link.href}`}
            onClick={onClose}
            className="rounded-xl px-4 py-3 text-base font-medium text-white/80 hover:bg-white/5"
          >
            {link.label}
          </a>
        ))}
        <div className="mt-4 px-4">
          <MagneticButton href={`${anchorPrefix}#contact`} variant="primary" className="w-full">
            Request Demo
          </MagneticButton>
        </div>
      </nav>
    </div>
  );
}
