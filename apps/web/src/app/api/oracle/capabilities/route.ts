import { NextResponse } from "next/server";
import { getCapabilities } from "@/lib/oracle";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCapabilities());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Capabilities unavailable" }, { status: 503 });
  }
}
