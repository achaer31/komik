export const MAIN_PRODUCT_PRICE = 149_900;
export const ADDON_PRODUCT_PRICE = 99_900;
export const BUNDLE_PRICE = MAIN_PRODUCT_PRICE + ADDON_PRODUCT_PRICE;

export type PublicOrderStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateAmount(includeAddon: boolean) {
  return includeAddon ? BUNDLE_PRICE : MAIN_PRODUCT_PRICE;
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
