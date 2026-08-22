import Link from "next/link";

export function LegalFooterLinks() {
  return (
    <p className="mt-8 text-center text-xs leading-relaxed text-muted">
      <Link href="/privacy" className="hover:text-accent">
        Privacy
      </Link>
      {" · "}
      <Link href="/terms" className="hover:text-accent">
        Terms
      </Link>
      {" · "}
      <Link href="/cookies" className="hover:text-accent">
        Cookies
      </Link>
    </p>
  );
}
