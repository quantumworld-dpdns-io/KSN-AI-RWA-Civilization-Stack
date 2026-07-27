import { NextResponse } from "next/server";
import { getTelemetry } from "@/lib/oracle";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ assets: await getTelemetry() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Oracle unavailable" }, { status: 503 });
  }
}
