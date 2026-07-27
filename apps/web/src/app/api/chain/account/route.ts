import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { readAccountState } from "@/lib/chain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ ok: false, error: "Valid ?address= is required" }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, account: await readAccountState(address as Address) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Account read failed" },
      { status: 502 }
    );
  }
}
