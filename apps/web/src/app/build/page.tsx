import type { Metadata } from "next";
import { DatacenterBuilder } from "@/components/builder/DatacenterBuilder";
import { readSuiMicrogridState, type SuiMicrogridState } from "@/lib/sui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Datacenter Builder — KSN",
  description:
    "Build a physical microgrid represented as a Sui object: upgrade cooling, raise its on-chain efficiency score past 85, and watch an autonomous agent distribute the Planetary Dividend.",
};

export default async function BuildPage() {
  // Server-render the first chain read so the gauge is populated on paint; the
  // client polls from there. A read failure must not blank the page — the
  // builder surfaces the error and retries.
  let initialState: SuiMicrogridState | null = null;
  try {
    initialState = await readSuiMicrogridState();
  } catch {
    initialState = null;
  }

  return <DatacenterBuilder initialState={initialState} />;
}
