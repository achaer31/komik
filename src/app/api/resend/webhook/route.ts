import { NextResponse } from "next/server";
import { Resend } from "resend";
import { recordResendEmailEvent } from "@/lib/orders";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Resend webhook belum dikonfigurasi." },
      { status: 500 },
    );
  }

  try {
    const payload = await request.text();
    const resend = new Resend(apiKey);
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("webhook-id") ?? "",
        timestamp: request.headers.get("webhook-timestamp") ?? "",
        signature: request.headers.get("webhook-signature") ?? "",
      },
      webhookSecret,
    });

    const data = event.data as {
      email_id?: string;
      to?: string[];
      created_at?: string;
    };

    await recordResendEmailEvent({
      id: request.headers.get("webhook-id") ?? `${event.type}-${event.created_at}`,
      type: event.type,
      createdAt: event.created_at ?? data.created_at ?? new Date().toISOString(),
      emailId: data.email_id ?? null,
      recipient: data.to?.[0]?.toLowerCase() ?? null,
      payload: event as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal memproses webhook.",
      },
      { status: 400 },
    );
  }
}
