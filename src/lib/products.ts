export const MAIN_PRODUCT_NORMAL_PRICE = 299_900;
export const MAIN_PRODUCT_PRICE = 199_900;
export const ADDON_PRODUCT_NORMAL_PRICE = 299_900;
export const ADDON_PRODUCT_PRICE = 99_900;
export const VVIP_PRODUCT_NORMAL_PRICE = 299_900;
export const VVIP_PRODUCT_PRICE = 99_900;

export type OrderOptions = {
  includeAddon?: boolean;
  includeVvip?: boolean;
};

export type PublicOrderStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeOrderOptions(options: OrderOptions | boolean): OrderOptions {
  if (typeof options === "boolean") return { includeAddon: options };
  return options;
}

export function calculateAmount(options: OrderOptions | boolean) {
  const normalized = normalizeOrderOptions(options);
  return (
    MAIN_PRODUCT_PRICE +
    (normalized.includeAddon ? ADDON_PRODUCT_PRICE : 0) +
    (normalized.includeVvip ? VVIP_PRODUCT_PRICE : 0)
  );
}

export function calculateNormalAmount(options: OrderOptions | boolean) {
  const normalized = normalizeOrderOptions(options);
  return (
    MAIN_PRODUCT_NORMAL_PRICE +
    (normalized.includeAddon ? ADDON_PRODUCT_NORMAL_PRICE : 0) +
    (normalized.includeVvip ? VVIP_PRODUCT_NORMAL_PRICE : 0)
  );
}

export function calculateSavings(options: OrderOptions | boolean) {
  return calculateNormalAmount(options) - calculateAmount(options);
}

export function countOrderItems(options: OrderOptions | boolean) {
  const normalized = normalizeOrderOptions(options);
  return (
    1 +
    (normalized.includeAddon ? 1 : 0) +
    (normalized.includeVvip ? 1 : 0)
  );
}

export function describeOrder(options: OrderOptions | boolean) {
  const normalized = normalizeOrderOptions(options);
  const items = ["100+ Komik Fantasi Dewasa"];
  if (normalized.includeAddon) items.push("100+ Video Komik");
  if (normalized.includeVvip) items.push("VVIP Grup Tele Update Harian");
  return items.join(" + ");
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function createExternalId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `komikpilihanku_${Date.now()}_${random}`;
}

export function publicStatus(status?: string | null): PublicOrderStatus {
  if (status === "PAID") return "PAID";
  if (status === "EXPIRED") return "EXPIRED";
  if (status === "FAILED") return "FAILED";
  return "PENDING";
}
