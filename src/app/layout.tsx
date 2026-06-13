import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Root layout. Tenant-specific theming, headers and metadata live in
 * src/app/s/[store]/layout.tsx; this only provides the document shell.
 */

export const metadata: Metadata = {
  title: "Multi-Store Dropship Factory",
  description: "One codebase, many niche storefronts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
