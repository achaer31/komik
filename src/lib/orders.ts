import { createClient } from "@supabase/supabase-js";
import type { PublicOrderStatus } from "./products";
import { publicStatus } from "./products";

export type OrderRecord = {
  id?: string;
  external_id: string;
  email: string;
  include_addon: boolean;
  amount: number;
  status: PublicOrderStatus;
  xendit_payment_id?: string | null;
  xendit_reference_id?: string | null;
  qris_payload?: Record<string, unknown> | null;
  qris_expires_at?: string | null;
  paid_at?: string | null;
  email_sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type OrderInsert = Pick<
  OrderRecord,
  "external_id" | "email" | "include_addon" | "amount" | "status"
>;

type OrderUpdate = Partial<
  Pick<
    OrderRecord,
    | "status"
    | "xendit_payment_id"
    | "xendit_reference_id"
    | "qris_payload"
    | "qris_expires_at"
    | "paid_at"
    | "email_sent_at"
  >
>;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function normalizeOrder(order: Record<string, unknown>): OrderRecord {
  return {
    ...(order as OrderRecord),
    status: publicStatus(order.status as string | undefined),
  };
}

export async function createOrder(order: OrderInsert) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeOrder(data);
}

export async function getOrderByExternalId(externalId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("external_id", externalId)
    .single();

  if (error) return null;
  return normalizeOrder(data);
}

export async function updateOrderByExternalId(
  externalId: string,
  update: OrderUpdate,
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("external_id", externalId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeOrder(data);
}
