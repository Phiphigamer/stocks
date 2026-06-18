import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "TechMarket Signals — Global Tech Market Intelligence",
  description:
    "Live global technology market analytics with a probabilistic AI forecast engine. Educational, scenario-based outlooks — not financial advice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
