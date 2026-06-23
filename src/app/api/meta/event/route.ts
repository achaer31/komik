import { NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta";

const allowedEvents = new Set([
  "PageView",
  "ViewContent",
  "InitiateCheckout",
  "AddToCart",
  "AddPaymentInfo",
  "Purchase",
]);

function getIpAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      eventId?: string;
      email?: string;
      eventSourceUrl?: string;
      fbp?: string;
      fbc?: string;
      customData?: Record<string, unknown>;
    };

    if (!body.eventName || !allowedEvents.has(body.eventName)) {
      return NextResponse.json({ error: "Invalid event name." }, { status: 400 });
    }

    const result = await sendMetaEvent({
      eventName: body.eventName as never,
      eventId: body.eventId || `${body.eventName}_${Date.now()}`,
      email: body.email,
      eventSourceUrl: body.eventSourceUrl,
      fbp: body.fbp,
      fbc: body.fbc,
      customData: body.customData,
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Meta event failed." },
      { status: 500 },
    );
  }
}
