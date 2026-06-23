"use client";

declare global {
  interface Window {
    fbq?: (
      command: "track" | "trackCustom",
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
  }
}

export type MetaClientEventName =
  | "ViewContent"
  | "InitiateCheckout"
  | "AddToCart"
  | "AddPaymentInfo";

export function createEventId(eventName: string) {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function trackMetaEvent(
  eventName: MetaClientEventName,
  customData: Record<string, unknown> = {},
  email?: string,
) {
  const eventId = createEventId(eventName);

  window.fbq?.("track", eventName, customData, { eventID: eventId });

  try {
    await fetch("/api/meta/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        email,
        customData,
        fbp: readCookie("_fbp"),
        fbc: readCookie("_fbc"),
        eventSourceUrl: window.location.href,
      }),
    });
  } catch {
    // Tracking should never block checkout.
  }
}
