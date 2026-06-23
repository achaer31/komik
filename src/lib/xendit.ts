type XenditQrCodeResponse = {
  id: string;
  external_id: string;
  amount: number;
  qr_string: string;
  callback_url: string;
  type: "DYNAMIC" | "STATIC";
  status: string;
  created: string;
  updated: string;
  metadata?: Record<string, unknown>;
};

export async function createDynamicQrisPayment(params: {
  externalId: string;
  amount: number;
  email: string;
}) {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY belum dikonfigurasi.");
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://komikpilihanku.vercel.app";
  const body = new URLSearchParams({
    external_id: params.externalId,
    type: "DYNAMIC",
    amount: String(params.amount),
    callback_url: `${siteUrl}/api/xendit/webhook`,
    "metadata[email]": params.email,
  });

  const response = await fetch("https://api.xendit.co/qr_codes", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "api-version": "2022-07-31",
    },
    body,
  });

  const payload = (await response.json()) as XenditQrCodeResponse & {
    message?: string;
    error_code?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || payload.error_code || "Gagal membuat QRIS.");
  }

  return payload;
}

export function isSuccessfulQrPayment(payload: Record<string, unknown>) {
  return (
    payload.event === "qr.payment" &&
    (payload.status === "COMPLETED" || payload.status === "SUCCEEDED")
  );
}

export function getExternalIdFromQrWebhook(payload: Record<string, unknown>) {
  const qrCode = payload.qr_code as Record<string, unknown> | undefined;
  return typeof qrCode?.external_id === "string" ? qrCode.external_id : null;
}
