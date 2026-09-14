import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeOffProduct, type OffProduct } from "@/lib/food-search";
import { logger } from "@/lib/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ barcode: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { barcode } = await params;
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 86400 } });
  } catch (err) {
    logger.error({ err, barcode }, "Open Food Facts barcode lookup request failed");
    return NextResponse.json({ error: "Open Food Facts unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    logger.warn({ status: response.status, barcode }, "Open Food Facts barcode lookup returned an error status");
    return NextResponse.json({ error: "Open Food Facts unavailable" }, { status: 502 });
  }

  const data = (await response.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const result = normalizeOffProduct(data.product);
  if (!result) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ result });
}
