import { NextResponse } from "next/server";
import { getOrderByExternalId, updateOrderByExternalId } from "@/lib/orders";
import { sendAccessEmail } from "@/lib/email";
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

    const paidAt =
      typeof payload.created === "string"
        ? payload.created
        : new Date().toISOString();

    await updateOrderByExternalId(externalId, {
      status: "PAID",
      paid_at: paidAt,
      xendit_payment_id:
        typeof payload.id === "string" ? payload.id : order.xendit_payment_id,
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

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
