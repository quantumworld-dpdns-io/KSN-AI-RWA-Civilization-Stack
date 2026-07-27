import { NextResponse } from "next/server";
import { getHealth } from "@/lib/oracle";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getHealth();
  return NextResponse.json(health, { status: health.oracle === "online" ? 200 : 503 });
}
