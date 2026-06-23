import { NextResponse } from "next/server";
import { getOrderByExternalId, updateOrderByExternalId } from "@/lib/orders";
import { sendAccessEmail } from "@/lib/email";
import { sendMetaEvent } from "@/lib/meta";
import {
  getExternalIdFromQrWebhook,
  getOrderExternalIdFromVirtualAccountWebhook,
  isSuccessfulQrPayment,
  isSuccessfulVirtualAccountPayment,
} from "@/lib/xendit";

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
    const isQrPayment = isSuccessfulQrPayment(payload);
    const isVaPayment = isSuccessfulVirtualAccountPayment(payload);
    const externalId = isQrPayment
      ? getExternalIdFromQrWebhook(payload)
      : isVaPayment
        ? getOrderExternalIdFromVirtualAccountWebhook(payload)
        : null;

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
        : typeof payload.transaction_timestamp === "string"
          ? payload.transaction_timestamp
        : new Date().toISOString();

    await updateOrderByExternalId(externalId, {
      status: "PAID",
      paid_at: paidAt,
      xendit_payment_id:
        typeof data?.id === "string"
          ? data.id
          : typeof payload.payment_id === "string"
            ? payload.payment_id
            : order.xendit_payment_id,
      payment_method: isVaPayment ? "VIRTUAL_ACCOUNT" : "QRIS",
      payment_channel:
        typeof payload.bank_code === "string"
          ? payload.bank_code
          : order.payment_channel,
    });

    if (!order.email_sent_at) {
      try {
        const sentAt = new Date().toISOString();
        const emailResult = await sendAccessEmail({
          to: order.email,
          includeAddon: order.include_addon,
        });

        await updateOrderByExternalId(externalId, {
          email_sent_at: sentAt,
          email_status: "SENT",
          email_message_id: emailResult.id,
          email_processed_at: sentAt,
          email_last_event: "email.sent",
          email_last_event_at: sentAt,
          email_error: null,
        });
      } catch (emailError) {
        await updateOrderByExternalId(externalId, {
          email_status: "FAILED",
          email_failed_at: new Date().toISOString(),
          email_last_event: "email.failed",
          email_last_event_at: new Date().toISOString(),
          email_error:
            emailError instanceof Error
              ? emailError.message
              : "Gagal mengirim email akses.",
        });
      }
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
