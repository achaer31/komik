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

export const VIRTUAL_ACCOUNT_BANKS = [
  { code: "BCA", name: "BCA Virtual Account" },
  { code: "BNI", name: "BNI Virtual Account" },
  { code: "BRI", name: "BRI Virtual Account" },
  { code: "MANDIRI", name: "Mandiri Virtual Account" },
  { code: "PERMATA", name: "Permata Virtual Account" },
] as const;

export type VirtualAccountBankCode =
  (typeof VIRTUAL_ACCOUNT_BANKS)[number]["code"];

type XenditVirtualAccountResponse = {
  id: string;
  external_id: string;
  bank_code: VirtualAccountBankCode;
  merchant_code?: string;
  name: string;
  account_number: string;
  expected_amount: number;
  expiration_date: string;
  status: string;
  currency: "IDR";
  is_closed: boolean;
  is_single_use: boolean;
};

function getSecretKey() {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY belum dikonfigurasi.");
  }
  return secretKey;
}

function getAuthorizationHeader() {
  return `Basic ${Buffer.from(`${getSecretKey()}:`).toString("base64")}`;
}

export async function createDynamicQrisPayment(params: {
  externalId: string;
  amount: number;
  email: string;
}) {
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
      Authorization: getAuthorizationHeader(),
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

export async function createVirtualAccountPayment(params: {
  externalId: string;
  amount: number;
  email: string;
  bankCode: VirtualAccountBankCode;
}) {
  const bank = VIRTUAL_ACCOUNT_BANKS.find(
    (item) => item.code === params.bankCode,
  );
  if (!bank) throw new Error("Bank Virtual Account tidak valid.");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const body = {
    external_id: `${params.externalId}_VA_${params.bankCode}`,
    bank_code: params.bankCode,
    name: "KOMIK PILIHANKU",
    is_closed: true,
    expected_amount: params.amount,
    expiration_date: expiresAt,
    is_single_use: true,
  };

  const response = await fetch("https://api.xendit.co/callback_virtual_accounts", {
    method: "POST",
    headers: {
      Authorization: getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as XenditVirtualAccountResponse & {
    message?: string;
    error_code?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.error_code ||
        "Gagal membuat Virtual Account.",
    );
  }

  return { ...payload, bank_name: bank.name };
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

export function isSuccessfulVirtualAccountPayment(
  payload: Record<string, unknown>,
) {
  return (
    typeof payload.external_id === "string" &&
    typeof payload.payment_id === "string" &&
    (typeof payload.amount === "number" || typeof payload.amount === "string")
  );
}

export function getOrderExternalIdFromVirtualAccountWebhook(
  payload: Record<string, unknown>,
) {
  if (typeof payload.external_id !== "string") return null;
  return payload.external_id.replace(/_VA_[A-Z]+$/, "");
}
