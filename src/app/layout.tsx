import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superpowers AI — Adaptive Multi-Agent Organization",
  description: "Enterprise Adaptive Multi-Agent AI Organization with Hierarchical Delegation and Owner Approval Gate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans">
        {children}
      </body>
    </html>
  );
}
