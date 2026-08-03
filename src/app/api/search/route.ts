import { NextResponse } from "next/server";
import { searchSite } from "@/lib/search-index";
import { enforceRateLimit, sourceKey, tooManyRequests } from "@/lib/security";

export async function GET(req: Request) {
  if (!(await enforceRateLimit("search:global", "all", 600, 60_000)) || !(await enforceRateLimit("search:source", sourceKey(req), 30, 60_000))) return tooManyRequests();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").slice(0, 200);
  const results = (await searchSite(q)).slice(0, 12);
  return NextResponse.json({ results });
}
