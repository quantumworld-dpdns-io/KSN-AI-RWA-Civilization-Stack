import { NextResponse } from "next/server";
import { readSuiMicrogridState } from "@/lib/sui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    return NextResponse.json(await readSuiMicrogridState());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sui chain read failed" },
      { status: 502 },
    );
  }
}
