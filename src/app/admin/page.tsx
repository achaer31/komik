import Image from "next/image";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import type { EmailDeliveryStatus, OrderRecord } from "@/lib/orders";
import { getAdminOrdersSnapshot } from "@/lib/orders";
import { formatRupiah } from "@/lib/products";
import { loginAdmin, logoutAdmin } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const session = await getAdminSession();

  if (!session) {
    return <LoginScreen hasError={param(params.error) === "1"} />;
  }

  const q = param(params.q).toLowerCase();
  const status = param(params.status);
  const selectedId = param(params.order);
  const snapshot = await getAdminOrdersSnapshot();
  const filteredOrders = snapshot.orders.filter((order) => {
    const matchesQuery =
      !q ||
      order.email.toLowerCase().includes(q) ||
      order.external_id.toLowerCase().includes(q);
    const matchesStatus = !status || order.status === status;
    return matchesQuery && matchesStatus;
  });
  const selectedOrder =
    filteredOrders.find((order) => order.external_id === selectedId) ??
    filteredOrders[0] ??
    snapshot.orders[0] ??
    null;

  return (
    <main className="min-h-screen bg-[#edf7f3] text-[#263b35]">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col lg:flex-row">
        <Sidebar
          email={session.email}
          paidCount={snapshot.stats.paidCount}
          pendingCount={snapshot.stats.pendingCount}
        />
        <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-5 flex flex-col gap-4 rounded-3xl bg-white/85 p-5 shadow-[0_12px_35px_rgba(33,74,62,0.10)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#27b982]">
                Komik Pilihanku Admin
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#33473f]">
                Orders & Revenue
              </h1>
            </div>
            <form action={logoutAdmin}>
              <button className="h-11 rounded-xl border border-[#1bb978]/30 px-5 text-sm font-black text-[#159461] transition hover:bg-[#e4fff5]">
                Logout
              </button>
            </form>
          </header>

          <StatsGrid stats={snapshot.stats} />

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_440px]">
            <section className="rounded-3xl bg-white p-4 shadow-[0_12px_35px_rgba(33,74,62,0.10)] sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">Product Orders</h2>
                  <p className="text-sm text-[#78908a]">
                    {filteredOrders.length} data ditampilkan dari{" "}
                    {snapshot.orders.length} order.
                  </p>
                </div>
                <a
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#27c889] px-5 text-sm font-black text-white shadow-[0_10px_18px_rgba(39,200,137,0.22)]"
                  href="/admin"
                >
                  Reset Filter
                </a>
              </div>

              <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_120px]">
                <input
                  className="h-12 rounded-xl border border-[#d8e7e1] bg-[#f8fcfa] px-4 text-sm outline-none ring-[#27c889]/20 focus:ring-4"
                  defaultValue={q}
                  name="q"
                  placeholder="Cari email atau order ID"
                />
                <select
                  className="h-12 rounded-xl border border-[#d8e7e1] bg-[#f8fcfa] px-4 text-sm outline-none ring-[#27c889]/20 focus:ring-4"
                  defaultValue={status}
                  name="status"
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <button className="h-12 rounded-xl bg-[#33473f] px-4 text-sm font-black text-white">
                  Cari
                </button>
              </form>

              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard
                    isSelected={order.external_id === selectedOrder?.external_id}
                    key={order.external_id}
                    order={order}
                  />
                ))}
                {filteredOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#b9d0c8] p-8 text-center text-sm text-[#6f8780]">
                    Belum ada order yang cocok dengan filter ini.
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="space-y-5">
              <RevenuePanel dailyRevenue={snapshot.dailyRevenue} />
              <OrderDetail order={selectedOrder} />
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginScreen({ hasError }: { hasError: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#31d494]">
            Admin Area
          </p>
          <h1 className="mt-2 text-3xl font-black">Komik Pilihanku</h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Login untuk melihat order, status payment, email delivery, dan
            statistik pendapatan.
          </p>
        </div>
        {hasError ? (
          <p className="mb-4 rounded-xl border border-[#ff5d7a]/40 bg-[#ff5d7a]/12 px-4 py-3 text-sm font-bold text-[#ffb7c4]">
            Username atau password salah.
          </p>
        ) : null}
        <form action={loginAdmin} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-white/70">Username</span>
            <input
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-sm outline-none ring-[#31d494]/20 focus:ring-4"
              name="email"
              placeholder="info@komikpilihanku.site"
              type="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-white/70">Password</span>
            <input
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-sm outline-none ring-[#31d494]/20 focus:ring-4"
              name="password"
              placeholder="Password admin"
              type="password"
            />
          </label>
          <button className="h-12 w-full rounded-xl bg-[#31d494] text-sm font-black text-[#06120e] shadow-[0_14px_28px_rgba(49,212,148,0.25)]">
            Masuk Admin
          </button>
        </form>
      </section>
    </main>
  );
}

function Sidebar({
  email,
  paidCount,
  pendingCount,
}: {
  email: string;
  paidCount: number;
  pendingCount: number;
}) {
  return (
    <aside className="bg-[#32c48b] p-5 text-white lg:min-h-screen lg:w-64">
      <div className="rounded-3xl bg-white/12 p-5">
        <p className="text-3xl font-black tracking-tight">KOMIK</p>
        <p className="mt-1 text-sm font-bold text-white/75">{email}</p>
      </div>
      <nav className="mt-6 grid gap-2 text-sm font-black">
        <a className="rounded-2xl bg-white/90 px-4 py-3 text-[#1d8d64]" href="#orders">
          Orders
        </a>
        <a className="rounded-2xl px-4 py-3 text-white/90 hover:bg-white/12" href="#revenue">
          Statistics
        </a>
        <Link
          className="rounded-2xl px-4 py-3 text-white/90 hover:bg-white/12"
          href="/"
        >
          Lihat Website
        </Link>
      </nav>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <MiniCounter label="Paid" value={paidCount} />
        <MiniCounter label="Pending" value={pendingCount} />
      </div>
    </aside>
  );
}

function MiniCounter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/14 p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
        {label}
      </p>
    </div>
  );
}

function StatsGrid({
  stats,
}: {
  stats: {
    totalRevenue: number;
    todayRevenue: number;
    paidCount: number;
    pendingCount: number;
    deliveredCount: number;
    openedCount: number;
  };
}) {
  const cards = [
    ["Total Revenue", formatRupiah(stats.totalRevenue), "Semua order paid"],
    ["Revenue Hari Ini", formatRupiah(stats.todayRevenue), "Paid hari ini"],
    ["Order Paid", String(stats.paidCount), "Pembayaran sukses"],
    ["Order Pending", String(stats.pendingCount), "Menunggu bayar"],
    ["Email Delivered", String(stats.deliveredCount), "Masuk inbox"],
    ["Email Opened", String(stats.openedCount), "Dibuka customer"],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, caption]) => (
        <div
          className="rounded-3xl bg-white p-4 shadow-[0_12px_35px_rgba(33,74,62,0.08)]"
          key={label}
        >
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8aa19a]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#33473f]">{value}</p>
          <p className="mt-1 text-xs font-bold text-[#7f9690]">{caption}</p>
        </div>
      ))}
    </section>
  );
}

function OrderCard({
  order,
  isSelected,
}: {
  order: OrderRecord;
  isSelected: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        isSelected
          ? "border-[#27c889] bg-[#effff8]"
          : "border-[#dcebe5] bg-white hover:border-[#9ddfc5]"
      }`}
      id="orders"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Image
            alt=""
            className="h-16 w-16 rounded-xl object-cover"
            height={80}
            src="/assets/hero.png"
            width={80}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black">{order.email}</p>
              <StatusBadge status={order.status} />
              <EmailBadge status={order.email_status ?? "NOT_SENT"} />
            </div>
            <p className="mt-1 text-sm text-[#6f8780]">{order.external_id}</p>
            <p className="mt-2 text-sm font-bold text-[#33473f]">
              {order.include_addon
                ? "Bundle komik + video add-on"
                : "100+ Komik Fantasi Dewasa"}
            </p>
            <p className="mt-1 text-sm text-[#78908a]">
              {formatDateTime(order.created_at)} · {formatRupiah(order.amount)}
            </p>
          </div>
        </div>
        <a
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#27c889] px-4 text-sm font-black text-white"
          href={`/admin?order=${encodeURIComponent(order.external_id)}#orders`}
        >
          Detail
        </a>
      </div>
    </article>
  );
}

function RevenuePanel({
  dailyRevenue,
}: {
  dailyRevenue: { date: string; revenue: number; count: number }[];
}) {
  const maxRevenue = Math.max(...dailyRevenue.map((day) => day.revenue), 1);

  return (
    <section
      className="rounded-3xl bg-white p-5 shadow-[0_12px_35px_rgba(33,74,62,0.10)]"
      id="revenue"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">Revenue Harian</h2>
          <p className="text-sm text-[#78908a]">14 hari terakhir.</p>
        </div>
        <p className="rounded-full bg-[#fff4d7] px-3 py-1 text-xs font-black text-[#a97900]">
          PAID ONLY
        </p>
      </div>
      <div className="flex h-56 items-end gap-2 border-b border-[#dcebe5] pb-3">
        {dailyRevenue.map((day) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={day.date}>
            <div className="flex h-44 w-full items-end justify-center rounded-full bg-[#edf7f3]">
              <div
                className="w-4 rounded-full bg-[#f5b800]"
                style={{
                  height: `${Math.max(8, (day.revenue / maxRevenue) * 100)}%`,
                }}
                title={`${formatLongDate(day.date)}: ${formatRupiah(day.revenue)}`}
              />
            </div>
            <p className="text-[10px] font-bold text-[#78908a]">
              {new Date(day.date).getDate()}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {dailyRevenue
          .filter((day) => day.revenue > 0)
          .slice(-5)
          .reverse()
          .map((day) => (
            <div className="flex items-center justify-between text-sm" key={day.date}>
              <span className="text-[#6f8780]">{formatLongDate(day.date)}</span>
              <span className="font-black text-[#33473f]">
                {formatRupiah(day.revenue)} · {day.count} order
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}

function OrderDetail({ order }: { order: OrderRecord | null }) {
  if (!order) {
    return (
      <section className="rounded-3xl bg-white p-6 text-sm text-[#6f8780] shadow-[0_12px_35px_rgba(33,74,62,0.10)]">
        Belum ada order.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-[0_12px_35px_rgba(33,74,62,0.10)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Order Details</h2>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex gap-3 border-b border-[#dcebe5] pb-4">
          <Image
            alt=""
            className="h-16 w-16 rounded-xl object-cover"
            height={80}
            src="/assets/hero.png"
            width={80}
          />
          <div>
            <p className="font-black">
              {order.include_addon
                ? "100+ Komik + 100+ Video Komik"
                : "100+ Komik Fantasi Dewasa"}
            </p>
            <p className="mt-1 text-sm text-[#6f8780]">
              {formatRupiah(order.amount)}
            </p>
          </div>
        </div>
        <DetailRow label="Customer" value={order.email} />
        <DetailRow label="Order ID" value={order.external_id} />
        <DetailRow label="Payment ID" value={order.xendit_payment_id ?? "-"} />
        <DetailRow label="Order dibuat" value={formatDateTime(order.created_at)} />
        <DetailRow label="Paid at" value={formatDateTime(order.paid_at)} />
        <DetailRow label="QRIS expired" value={formatDateTime(order.qris_expires_at)} />
        <DetailRow label="Total" value={formatRupiah(order.amount)} strong />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-[0_12px_35px_rgba(33,74,62,0.10)]">
        <h2 className="text-lg font-black">Email Delivery Tracking</h2>
        <div className="mt-4 space-y-3">
          <TimelineItem
            active={Boolean(order.email_sent_at)}
            label="Sent"
            value={formatDateTime(order.email_sent_at)}
          />
          <TimelineItem
            active={Boolean(order.email_delivered_at)}
            label="Delivered"
            value={formatDateTime(order.email_delivered_at)}
          />
          <TimelineItem
            active={Boolean(order.email_opened_at)}
            label="Opened"
            value={formatDateTime(order.email_opened_at)}
          />
          <TimelineItem
            active={Boolean(order.email_clicked_at)}
            label="Clicked"
            value={formatDateTime(order.email_clicked_at)}
          />
        </div>
        <div className="mt-5 rounded-2xl bg-[#f3faf7] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#78908a]">
            Current Email Status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EmailBadge status={order.email_status ?? "NOT_SENT"} />
            <span className="text-sm text-[#6f8780]">
              {order.email_last_event ?? "Belum ada event webhook"}
            </span>
          </div>
          {order.email_error ? (
            <p className="mt-2 text-sm font-bold text-[#d5455d]">
              {order.email_error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf4f1] py-3 text-sm last:border-0">
      <span className="text-[#78908a]">{label}</span>
      <span
        className={`max-w-[240px] break-words text-right ${
          strong ? "font-black text-[#33473f]" : "font-bold text-[#40564f]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-3 w-3 rounded-full ${active ? "bg-[#27c889]" : "bg-[#d6e2dd]"}`}
      />
      <div className="flex flex-1 items-center justify-between gap-3">
        <p className={`text-sm font-bold ${active ? "text-[#159461]" : "text-[#9baea8]"}`}>
          {label}
        </p>
        <p className="text-xs font-bold text-[#9baea8]">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderRecord["status"] }) {
  const styles = {
    PAID: "bg-[#dff9eb] text-[#159461]",
    PENDING: "bg-[#fff4d7] text-[#a97900]",
    EXPIRED: "bg-[#eeeeee] text-[#767676]",
    FAILED: "bg-[#ffe5ea] text-[#c7324f]",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${styles[status]}`}>
      {status}
    </span>
  );
}

function EmailBadge({ status }: { status: EmailDeliveryStatus }) {
  const styles: Record<EmailDeliveryStatus, string> = {
    NOT_SENT: "bg-[#eeeeee] text-[#767676]",
    SENT: "bg-[#edf4ff] text-[#3564b8]",
    DELIVERED: "bg-[#dff9eb] text-[#159461]",
    OPENED: "bg-[#dff9eb] text-[#159461]",
    CLICKED: "bg-[#dff9eb] text-[#159461]",
    BOUNCED: "bg-[#ffe5ea] text-[#c7324f]",
    FAILED: "bg-[#ffe5ea] text-[#c7324f]",
    COMPLAINED: "bg-[#ffe5ea] text-[#c7324f]",
    DELAYED: "bg-[#fff4d7] text-[#a97900]",
    SUPPRESSED: "bg-[#ffe5ea] text-[#c7324f]",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${styles[status]}`}>
      EMAIL {status}
    </span>
  );
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
