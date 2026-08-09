import type { Metadata } from "next";
import Link from "next/link";
import { EuropeVisionPanel } from "@/components/EuropeVisionPanel";

export const metadata: Metadata = {
  title: "KSN — European Market Vision",
  description:
    "Forward-looking EU energy–compute corridors, ZK attestations, and market desks (concept UI).",
};

export default function EuropePage() {
  return (
    <div className="europe-route">
      <header className="europe-route-nav">
        <Link href="/" className="europe-route-brand">
          <strong>KSN</strong>
          <span>European vision</span>
        </Link>
        <nav>
          <Link href="/">Landing</Link>
          <Link href="/console">Console</Link>
        </nav>
      </header>
      <main className="europe-route-main">
        <EuropeVisionPanel />
      </main>
    </div>
  );
}
