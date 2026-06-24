import { createClient } from "@supabase/supabase-js";
import type { PublicOrderStatus } from "./products";
import { publicStatus } from "./products";

export type EmailDeliveryStatus =
  | "NOT_SENT"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "CLICKED"
  | "BOUNCED"
  | "FAILED"
  | "COMPLAINED"
  | "DELAYED"
  | "SUPPRESSED";

export type OrderRecord = {
  id?: string;
  external_id: string;
  email: string;
  include_addon: boolean;
  amount: number;
  status: PublicOrderStatus;
  payment_method?: string | null;
  payment_channel?: string | null;
  xendit_payment_id?: string | null;
  xendit_reference_id?: string | null;
  qris_payload?: Record<string, unknown> | null;
  qris_expires_at?: string | null;
  va_payload?: Record<string, unknown> | null;
  va_account_number?: string | null;
  va_bank_code?: string | null;
  va_expires_at?: string | null;
  paid_at?: string | null;
  email_sent_at?: string | null;
  email_status?: EmailDeliveryStatus | null;
  email_message_id?: string | null;
  invoice_email_message_id?: string | null;
  invoice_email_sent_at?: string | null;
  access_email_message_id?: string | null;
  access_email_sent_at?: string | null;
  email_processed_at?: string | null;
  email_delivered_at?: string | null;
  email_opened_at?: string | null;
  email_clicked_at?: string | null;
  email_bounced_at?: string | null;
  email_failed_at?: string | null;
  email_complained_at?: string | null;
  email_last_event_at?: string | null;
  email_last_event?: string | null;
  email_error?: string | null;
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
    | "payment_method"
    | "payment_channel"
    | "xendit_payment_id"
    | "xendit_reference_id"
    | "qris_payload"
    | "qris_expires_at"
    | "va_payload"
    | "va_account_number"
    | "va_bank_code"
    | "va_expires_at"
    | "paid_at"
    | "email_sent_at"
    | "email_status"
    | "email_message_id"
    | "invoice_email_message_id"
    | "invoice_email_sent_at"
    | "access_email_message_id"
    | "access_email_sent_at"
    | "email_processed_at"
    | "email_delivered_at"
    | "email_opened_at"
    | "email_clicked_at"
    | "email_bounced_at"
    | "email_failed_at"
    | "email_complained_at"
    | "email_last_event_at"
    | "email_last_event"
    | "email_error"
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
    email_status: normalizeEmailStatus(order.email_status as string | undefined),
  };
}

export function normalizeEmailStatus(status?: string | null): EmailDeliveryStatus {
  if (status === "SENT") return "SENT";
  if (status === "DELIVERED") return "DELIVERED";
  if (status === "OPENED") return "OPENED";
  if (status === "CLICKED") return "CLICKED";
  if (status === "BOUNCED") return "BOUNCED";
  if (status === "FAILED") return "FAILED";
  if (status === "COMPLAINED") return "COMPLAINED";
  if (status === "DELAYED") return "DELAYED";
  if (status === "SUPPRESSED") return "SUPPRESSED";
  return "NOT_SENT";
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

export async function listAdminOrders() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeOrder);
}

export async function getAdminOrdersSnapshot() {
  const orders = await listAdminOrders();
  const paidOrders = orders.filter((order) => order.status === "PAID");
  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyRevenue = buildDailyRevenue(paidOrders);

  return {
    orders,
    stats: {
      totalRevenue: paidOrders.reduce((sum, order) => sum + order.amount, 0),
      todayRevenue: paidOrders
        .filter((order) => getOrderDay(order) === todayKey)
        .reduce((sum, order) => sum + order.amount, 0),
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      deliveredCount: orders.filter((order) =>
        ["DELIVERED", "OPENED", "CLICKED"].includes(order.email_status ?? ""),
      ).length,
      openedCount: orders.filter((order) =>
        ["OPENED", "CLICKED"].includes(order.email_status ?? ""),
      ).length,
    },
    dailyRevenue,
  };
}

function getOrderDay(order: OrderRecord) {
  return (order.paid_at ?? order.created_at ?? new Date().toISOString()).slice(
    0,
    10,
  );
}

function buildDailyRevenue(orders: OrderRecord[]) {
  const totals = new Map<string, { date: string; revenue: number; count: number }>();
  const today = new Date();

  for (let index = 13; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    const date = day.toISOString().slice(0, 10);
    totals.set(date, { date, revenue: 0, count: 0 });
  }

  for (const order of orders) {
    const date = getOrderDay(order);
    const existing = totals.get(date) ?? { date, revenue: 0, count: 0 };
    existing.revenue += order.amount;
    existing.count += 1;
    totals.set(date, existing);
  }

  return Array.from(totals.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

type ResendEventRecord = {
  id: string;
  type: string;
  createdAt: string;
  emailId: string | null;
  recipient: string | null;
  payload: Record<string, unknown>;
};

export async function recordResendEmailEvent(event: ResendEventRecord) {
  const supabase = getSupabase();

  await supabase.from("resend_events").upsert(
    {
      id: event.id,
      event_type: event.type,
      email_id: event.emailId,
      recipient: event.recipient,
      payload: event.payload,
      created_at: event.createdAt,
    },
    { onConflict: "id" },
  );

  const update = getEmailEventUpdate(event.type, event.createdAt);
  if (!update) return;

  if (event.emailId) {
    const byMessageId = await supabase
      .from("orders")
      .select("id,email_status")
      .or(
        [
          `email_message_id.eq.${event.emailId}`,
          `invoice_email_message_id.eq.${event.emailId}`,
          `access_email_message_id.eq.${event.emailId}`,
        ].join(","),
      );

    if (byMessageId.error) {
      throw new Error(byMessageId.error.message);
    }

    const matches = byMessageId.data ?? [];
    if (matches.length > 0) {
      await Promise.all(
        matches.map((order) =>
          updateOrderEmailEventById(
            String(order.id),
            mergeEmailStatusUpdate(
              update,
              normalizeEmailStatus(order.email_status as string | undefined),
            ),
          ),
        ),
      );
      return;
    }
  }

  if (event.recipient) {
    const { data, error } = await supabase
      .from("orders")
      .select("id,email_status")
      .eq("email", event.recipient)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    await Promise.all(
      (data ?? []).map((order) =>
        updateOrderEmailEventById(
          String(order.id),
          mergeEmailStatusUpdate(
            update,
            normalizeEmailStatus(order.email_status as string | undefined),
          ),
        ),
      ),
    );
  }
}

async function updateOrderEmailEventById(id: string, update: OrderUpdate) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

function mergeEmailStatusUpdate(
  update: OrderUpdate,
  currentStatus: EmailDeliveryStatus,
) {
  if (!update.email_status) return update;
  return {
    ...update,
    email_status: highestEmailStatus(currentStatus, update.email_status),
  };
}

function highestEmailStatus(
  currentStatus: EmailDeliveryStatus,
  nextStatus: EmailDeliveryStatus,
) {
  const priority: Record<EmailDeliveryStatus, number> = {
    NOT_SENT: 0,
    SENT: 1,
    DELAYED: 2,
    DELIVERED: 3,
    OPENED: 4,
    CLICKED: 5,
    FAILED: 10,
    BOUNCED: 10,
    COMPLAINED: 10,
    SUPPRESSED: 10,
  };

  return priority[nextStatus] >= priority[currentStatus]
    ? nextStatus
    : currentStatus;
}

function getEmailEventUpdate(
  type: string,
  eventAt: string,
): OrderUpdate | null {
  const base = {
    email_last_event: type,
    email_last_event_at: eventAt,
  };

  if (type === "email.sent") {
    return { ...base, email_status: "SENT", email_processed_at: eventAt };
  }
  if (type === "email.delivered") {
    return { ...base, email_status: "DELIVERED", email_delivered_at: eventAt };
  }
  if (type === "email.opened") {
    return { ...base, email_status: "OPENED", email_opened_at: eventAt };
  }
  if (type === "email.clicked") {
    return { ...base, email_status: "CLICKED", email_clicked_at: eventAt };
  }
  if (type === "email.bounced") {
    return { ...base, email_status: "BOUNCED", email_bounced_at: eventAt };
  }
  if (type === "email.failed") {
    return { ...base, email_status: "FAILED", email_failed_at: eventAt };
  }
  if (type === "email.complained") {
    return { ...base, email_status: "COMPLAINED", email_complained_at: eventAt };
  }
  if (type === "email.delivery_delayed") {
    return { ...base, email_status: "DELAYED" };
  }
  if (type === "email.suppressed") {
    return { ...base, email_status: "SUPPRESSED" };
  }

  return null;
}
