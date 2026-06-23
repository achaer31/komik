import { NextResponse } from "next/server";
import { getOrderByExternalId, updateOrderByExternalId } from "@/lib/orders";
import { sendAccessEmail } from "@/lib/email";
import { sendMetaEvent } from "@/lib/meta";
import { getExternalIdFromQrWebhook, isSuccessfulQrPayment } from "@/lib/xendit";

export async function POST(request: Request) {
  const callbackToken = request.headers.get("x-callback-token");

  if (
    process.env.XENDIT_WEBHOOK_TOKEN &&
    callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;

    if (!isSuccessfulQrPayment(payload)) {
      return NextResponse.json({ received: true });
    }

    const externalId = getExternalIdFromQrWebhook(payload);
    if (!externalId) {
      return NextResponse.json({ received: true });
    }

    const order = await getOrderByExternalId(externalId);
    if (!order) {
      return NextResponse.json({ received: true });
    }

    const data = payload.data as Record<string, unknown> | undefined;
    const paidAt =
      typeof data?.created === "string"
        ? data.created
        : new Date().toISOString();

    await updateOrderByExternalId(externalId, {
      status: "PAID",
      paid_at: paidAt,
      xendit_payment_id:
        typeof data?.id === "string" ? data.id : order.xendit_payment_id,
    });

    if (!order.email_sent_at) {
      await sendAccessEmail({
        to: order.email,
        includeAddon: order.include_addon,
      });

      await updateOrderByExternalId(externalId, {
        email_sent_at: new Date().toISOString(),
      });
    }

    await sendMetaEvent({
      eventName: "Purchase",
      eventId: `purchase_${externalId}`,
      email: order.email,
      customData: {
        content_name: order.include_addon
          ? "Komik Fantasi Digital + Video Add-on"
          : "100+ Komik Fantasi Digital Pilihan 2026",
        content_type: "product",
        currency: "IDR",
        value: order.amount,
        order_id: externalId,
      },
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
