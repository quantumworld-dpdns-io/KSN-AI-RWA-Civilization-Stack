import { NextResponse } from "next/server";
import { z } from "zod";
import { simulate } from "@/lib/oracle";

const schema = z.object({
  powerWatts: z.number().positive(),
  hashrate: z.number().positive(),
  utilization: z.number().min(0).max(1)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json(await simulate(input));
  } catch (error) {
    const validation = error instanceof z.ZodError;
    return NextResponse.json(
      { error: validation ? "Invalid simulation parameters" : error instanceof Error ? error.message : "Simulation failed" },
      { status: validation ? 400 : 503 }
    );
  }
}
