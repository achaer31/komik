import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getOrderByExternalId, updateOrderByExternalId } from "@/lib/orders";
import { createDynamicQrisPayment } from "@/lib/xendit";

export async function POST(request: Request) {
  try {
    const { external_id: externalId } = (await request.json()) as {
      external_id?: string;
    };

    if (!externalId) {
      return NextResponse.json({ error: "Order ID wajib diisi." }, { status: 400 });
    }

    const order = await getOrderByExternalId(externalId);
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order tidak dalam status pending." },
        { status: 400 },
      );
    }

    const qris = await createDynamicQrisPayment({
      externalId: order.external_id,
      amount: order.amount,
      email: order.email,
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await updateOrderByExternalId(order.external_id, {
      xendit_payment_id: qris.id,
      xendit_reference_id: qris.external_id,
      qris_payload: qris,
      qris_expires_at: expiresAt,
    });

    const qrImage = await QRCode.toDataURL(qris.qr_string, {
      margin: 1,
      width: 320,
      color: { dark: "#09060d", light: "#ffffff" },
    });

    return NextResponse.json({
      external_id: order.external_id,
      amount: order.amount,
      qrImage,
      expiresAt,
      xenditPaymentId: qris.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat QRIS." },
      { status: 500 },
    );
  }
}
