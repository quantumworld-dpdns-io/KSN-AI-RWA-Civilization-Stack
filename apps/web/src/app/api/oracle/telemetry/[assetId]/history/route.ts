import { NextResponse } from "next/server";
import { getTelemetryHistory } from "@/lib/oracle";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const limit = Math.min(
      500,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50))
    );
    return NextResponse.json(await getTelemetryHistory(assetId, limit));
  } catch (error) {
    const upstream =
      error && typeof error === "object" && "upstream" in error
        ? (error as { upstream?: Record<string, unknown> }).upstream
        : undefined;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "History unavailable",
        debug: upstream,
      },
      { status: 503 }
    );
  }
}
