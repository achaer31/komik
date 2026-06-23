type XenditQrCodeResponse = {
  id: string;
  reference_id: string;
  amount: number;
  currency: "IDR";
  qr_string: string;
  expires_at: string;
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

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const body = {
    reference_id: params.externalId,
    type: "DYNAMIC",
    currency: "IDR",
    amount: params.amount,
    expires_at: expiresAt,
    metadata: {
      email: params.email,
    },
  };

  const response = await fetch("https://api.xendit.co/qr_codes", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      "api-version": "2022-07-31",
    },
    body: JSON.stringify(body),
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
  const data = payload.data as Record<string, unknown> | undefined;
  return (
    payload.event === "qr.payment" &&
    (data?.status === "COMPLETED" || data?.status === "SUCCEEDED")
  );
}

export function getExternalIdFromQrWebhook(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  if (typeof data?.reference_id === "string") return data.reference_id;

  const qrCode = payload.qr_code as Record<string, unknown> | undefined;
  return typeof qrCode?.external_id === "string" ? qrCode.external_id : null;
}
