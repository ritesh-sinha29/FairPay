import { NextResponse } from "next/server";
import { isEntityKey, readArkivJob, readArkivJobs } from "@/lib/arkiv-server";

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
      return NextResponse.json({ success: true, source: "arkiv", entity }, { headers: { "Cache-Control": "no-store" } });
    }
    const result = await readArkivJobs({
      category: params.get("category") || undefined,
      status: params.get("status") || undefined,
      minBudget,
    });
    return NextResponse.json({ success: true, source: "arkiv", ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Arkiv is unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}