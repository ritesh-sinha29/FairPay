import { NextResponse } from "next/server";
import { isEntityKey, readArkivJob, readArkivJobs, withArkivAwards } from "@/lib/arkiv-server";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const key = params.get("key");
  if (key && !isEntityKey(key)) return NextResponse.json({ error: "Invalid Arkiv entity key." }, { status: 400 });
  const minBudget = Number(params.get("minBudget") || 0);
  if (!Number.isFinite(minBudget) || minBudget < 0) return NextResponse.json({ error: "Invalid minimum budget." }, { status: 400 });
  try {
    if (key) {
      const entity = await readArkivJob(key);
      if (!entity) return NextResponse.json({ error: "Job not found or expired on Arkiv." }, { status: 404 });
      const [listing] = await withArkivAwards([entity]);
      return NextResponse.json({ success: true, source: "arkiv", coordinationSource: "convex", entity: listing }, { headers: { "Cache-Control": "no-store" } });
    }
    const result = await readArkivJobs({
      category: params.get("category") || undefined,
      status: "all",
      minBudget,
    });
    const requestedStatus = params.get("status") || "open";
    const listings = await withArkivAwards(result.entities);
    const entities = listings.filter(job => requestedStatus === "all" || job.status === requestedStatus);
    return NextResponse.json({ success: true, source: "arkiv", coordinationSource: "convex", entities, rawQuery: result.rawQuery }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Arkiv is unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
