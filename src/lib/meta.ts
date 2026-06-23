import { createHash } from "node:crypto";

type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "AddToCart"
  | "AddPaymentInfo"
  | "Purchase";

type MetaEventInput = {
  eventName: MetaEventName;
  eventId: string;
  eventSourceUrl?: string;
  email?: string;
  userAgent?: string;
  ipAddress?: string;
  fbp?: string;
  fbc?: string;
  customData?: Record<string, unknown>;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

export async function sendMetaEvent(input: MetaEventInput) {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { skipped: true };
  }

  const normalizedEmail = normalizeEmail(input.email);
  const userData: Record<string, string> = {};

  if (normalizedEmail) userData.em = sha256(normalizedEmail);
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.ipAddress) userData.client_ip_address = input.ipAddress;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url:
          input.eventSourceUrl ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://komikpilihanku.site",
        user_data: userData,
        custom_data: input.customData || {},
      },
    ],
  };

  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "Meta Conversions API request failed.",
    );
  }

  return payload;
}
