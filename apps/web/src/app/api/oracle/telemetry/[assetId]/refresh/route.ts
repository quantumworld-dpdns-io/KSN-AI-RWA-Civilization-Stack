import { NextResponse } from "next/server";
import { refreshTelemetry } from "@/lib/oracle";

export async function POST(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    return NextResponse.json(await refreshTelemetry(assetId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Refresh failed" }, { status: 503 });
  }
}
