import { NextResponse } from "next/server";
import { getOrderByExternalId } from "@/lib/orders";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const externalId = url.searchParams.get("external_id");

  if (!externalId) {
    return NextResponse.json({ error: "Order ID wajib diisi." }, { status: 400 });
  }

  try {
    const order = await getOrderByExternalId(externalId);
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      external_id: order.external_id,
      amount: order.amount,
      includeAddon: order.include_addon,
      includeVvip: order.include_vvip,
      status: order.status,
      emailSent: Boolean(order.email_sent_at),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengecek status." },
      { status: 500 },
    );
  }
}
