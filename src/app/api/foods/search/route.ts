import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeOffProducts, type OffProduct } from "@/lib/food-search";

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

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) {
    return NextResponse.json({ error: "Open Food Facts unavailable" }, { status: 502 });
  }

  const data = (await response.json()) as { products?: OffProduct[] };
  return NextResponse.json({ results: normalizeOffProducts(data.products ?? []) });
}
