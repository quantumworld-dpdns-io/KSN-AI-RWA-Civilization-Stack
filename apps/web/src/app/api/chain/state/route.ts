import { NextResponse } from "next/server";
import { readChainState } from "@/lib/chain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    return NextResponse.json(await readChainState());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Chain read failed" },
      { status: 502 }
    );
  }
}
