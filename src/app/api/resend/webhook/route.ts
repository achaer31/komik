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

    const eventRecord = event as unknown as {
      type?: string;
      created_at?: string;
      data?: Record<string, unknown>;
    };
    const data = eventRecord.data ?? {};

    await recordResendEmailEvent({
      id:
        request.headers.get("webhook-id") ??
        `${eventRecord.type}-${eventRecord.created_at ?? Date.now()}`,
      type: eventRecord.type ?? "email.unknown",
      createdAt:
        eventRecord.created_at ??
        readString(data.created_at) ??
        new Date().toISOString(),
      emailId:
        readString(data.email_id) ??
        readString(data.emailId) ??
        readString(data.id),
      recipient: extractRecipient(data),
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

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractRecipient(data: Record<string, unknown>) {
  const direct =
    readString(data.recipient) ??
    readString(data.email) ??
    readString(data.to);

  if (direct) return direct.toLowerCase();

  if (Array.isArray(data.to)) {
    const first = data.to[0];
    if (typeof first === "string") return first.toLowerCase();
    if (first && typeof first === "object") {
      const email = readString((first as Record<string, unknown>).email);
      if (email) return email.toLowerCase();
    }
  }

  return null;
}
