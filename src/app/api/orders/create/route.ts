import { NextResponse } from "next/server";
import {
  calculateAmount,
  createExternalId,
  isValidEmail,
} from "@/lib/products";
import { createOrder, updateOrderByExternalId } from "@/lib/orders";
import { sendPaymentInvoiceEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      includeAddon?: boolean;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const includeAddon = Boolean(body.includeAddon);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }

    const externalId = createExternalId();
    const amount = calculateAmount(includeAddon);
    const order = await createOrder({
      external_id: externalId,
      email,
      include_addon: includeAddon,
      amount,
      status: "PENDING",
    });

    try {
      const sentAt = new Date().toISOString();
      const emailResult = await sendPaymentInvoiceEmail({
        to: email,
        externalId: order.external_id,
        amount: order.amount,
        includeAddon: order.include_addon,
      });

      await updateOrderByExternalId(order.external_id, {
        email_sent_at: sentAt,
        email_status: "SENT",
        email_message_id: emailResult.id,
        invoice_email_message_id: emailResult.id,
        invoice_email_sent_at: sentAt,
        email_processed_at: sentAt,
        email_last_event: "email.sent",
        email_last_event_at: sentAt,
        email_error: null,
      });
    } catch (emailError) {
      const failedAt = new Date().toISOString();
      await updateOrderByExternalId(order.external_id, {
        email_status: "FAILED",
        email_failed_at: failedAt,
        email_last_event: "email.failed",
        email_last_event_at: failedAt,
        email_error:
          emailError instanceof Error
            ? emailError.message
            : "Gagal mengirim invoice pembayaran.",
      });
    }

    return NextResponse.json({
      external_id: order.external_id,
      amount: order.amount,
      includeAddon: order.include_addon,
      status: order.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat order." },
      { status: 500 },
    );
  }
}
