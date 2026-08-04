import { Check } from "lucide-react";
import { Button } from "./Button";
import type { Product } from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const isFeatured = product.featured;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-white shadow-sm ${
        isFeatured ? "lg:col-span-2" : ""
      }`}
    >
      <div className={`flex flex-col ${isFeatured ? "lg:flex-row" : ""}`}>
        <div
          className={`flex items-center justify-center bg-bg-gray ${
            isFeatured ? "min-h-[220px] lg:w-2/5" : "aspect-video"
          }`}
        >
          <span className="text-sm font-medium text-text-muted">{product.name}</span>
        </div>
        <div className={`flex flex-1 flex-col p-6 md:p-8 ${isFeatured ? "lg:p-10" : ""}`}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-text-primary">{product.name}</h3>
            {product.status && (
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
                {product.status}
              </span>
            )}
          </div>
          <p className="text-text-muted">{product.description}</p>
          {product.features.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-text-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <Button
              href={product.cta.href}
              variant={isFeatured ? "primary" : "secondary"}
            >
              {product.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
