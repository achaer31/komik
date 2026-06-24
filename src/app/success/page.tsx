import Link from "next/link";
import { SuccessPurchaseTracker } from "@/components/SuccessPurchaseTracker";
import { getOrderByExternalId } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrderByExternalId(orderId) : null;
  const shouldTrackPurchase = order?.status === "PAID";

  return (
    <main className="grid min-h-screen place-items-center bg-[#08040b] px-4 text-white">
      {shouldTrackPurchase ? (
        <SuccessPurchaseTracker
          amount={order.amount}
          email={order.email}
          includeAddon={order.include_addon}
          orderId={order.external_id}
        />
      ) : null}

      <div className="w-full max-w-md rounded-[28px] border border-emerald-300/30 bg-[#110814] p-6 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-400 text-4xl font-black text-[#08110d]">
          ✓
        </div>
        <h1 className="mt-5 text-3xl font-black">Pembayaran Berhasil</h1>
        <p className="mt-3 leading-7 text-white/70">
          Akses sedang dikirim ke email kamu. Cek inbox, spam, atau promosi.
        </p>
        <div className="mt-5 rounded-2xl bg-white/5 p-4 text-left text-sm text-white/70">
          Paket:{" "}
          {order?.include_addon
            ? "100+ Komik Fantasi + 100+ Video Komik"
            : "100+ Komik Fantasi Digital Pilihan 2026"}
        </div>
        <Link
          className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-[#ff2f93] font-black text-white"
          href="/"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
