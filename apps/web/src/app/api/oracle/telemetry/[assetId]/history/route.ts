import { NextResponse } from "next/server";
import { getTelemetryHistory } from "@/lib/oracle";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const limit = Math.min(500, Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50)));
    // #region agent log
    fetch("http://127.0.0.1:7887/ingest/0ca80672-2cb4-4338-821b-09fb9789ab7f",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5332d7"},body:JSON.stringify({sessionId:"5332d7",location:"apps/web/src/app/api/oracle/telemetry/[assetId]/history/route.ts:11",message:"history route entry",data:{assetId,limit,url:request.url},runId:"pre-fix",hypothesisId:"H1|H2|H5",timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json(await getTelemetryHistory(assetId, limit));
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7887/ingest/0ca80672-2cb4-4338-821b-09fb9789ab7f",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5332d7"},body:JSON.stringify({sessionId:"5332d7",location:"apps/web/src/app/api/oracle/telemetry/[assetId]/history/route.ts:15",message:"history route error",data:{error:error instanceof Error ? error.message : "History unavailable"},runId:"pre-fix",hypothesisId:"H1|H2|H3|H5",timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ error: error instanceof Error ? error.message : "History unavailable" }, { status: 503 });
  }
}
