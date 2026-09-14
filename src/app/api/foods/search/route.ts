import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeOffProducts, type OffProduct } from "@/lib/food-search";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 86400 } });
  } catch (err) {
    logger.error({ err, query }, "Open Food Facts search request failed");
    return NextResponse.json({ error: "Open Food Facts unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    logger.warn({ status: response.status, query }, "Open Food Facts search returned an error status");
    return NextResponse.json({ error: "Open Food Facts unavailable" }, { status: 502 });
  }

  const data = (await response.json()) as { products?: OffProduct[] };
  return NextResponse.json({ results: normalizeOffProducts(data.products ?? []) });
}
