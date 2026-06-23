"use client";

import { useEffect, useMemo, useState } from "react";
import { formatRupiah } from "@/lib/products";
import { trackMetaEvent } from "@/lib/meta-client";

type Step = "email" | "method" | "qris" | "success";

type OrderResponse = {
  external_id: string;
  amount: number;
  includeAddon: boolean;
  status: string;
};

type QrisResponse = {
  external_id: string;
  amount: number;
  qrImage: string;
  expiresAt: string;
  xenditPaymentId: string;
};

export function CheckoutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [includeAddon, setIncludeAddon] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [qris, setQris] = useState<QrisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(0);

  const total = includeAddon ? 249_800 : 149_900;
  const remainingSeconds = useMemo(() => {
    if (!qris?.expiresAt) return 0;
    return Math.max(0, Math.floor((Date.parse(qris.expiresAt) - now) / 1000));
  }, [now, qris?.expiresAt]);

  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open || !order || (step !== "qris" && step !== "success")) return;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      const response = await fetch(
        `/api/orders/status?external_id=${encodeURIComponent(order.external_id)}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as { status: string };
      if (data.status === "PAID") {
        setStep("success");
        window.setTimeout(() => {
          window.location.href = `/success?order=${encodeURIComponent(order.external_id)}`;
        }, 1200);
      }
    };

    const interval = window.setInterval(() => {
      if (attempts >= 120) {
        window.clearInterval(interval);
        return;
      }
      void check();
    }, 5000);
    void check();

    return () => window.clearInterval(interval);
  }, [open, order, step]);

  if (!open) return null;

  const submitEmail = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Masukkan email yang valid.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, includeAddon }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat order.");
      setOrder(data);
      void trackMetaEvent(
        "AddToCart",
        {
          content_name: includeAddon
            ? "Komik Fantasi Digital + Video Add-on"
            : "100+ Komik Fantasi Digital Pilihan 2026",
          content_type: "product",
          currency: "IDR",
          value: total,
          num_items: includeAddon ? 2 : 1,
        },
        email,
      );
      setStep("method");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const createQris = async () => {
    if (!order) return;
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_id: order.external_id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat QRIS.");
      setQris(data);
      void trackMetaEvent(
        "AddPaymentInfo",
        {
          content_name: order.includeAddon
            ? "Komik Fantasi Digital + Video Add-on"
            : "100+ Komik Fantasi Digital Pilihan 2026",
          content_type: "product",
          currency: "IDR",
          value: order.amount,
          payment_method: "QRIS",
        },
        email,
      );
      setStep("qris");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const manualCheck = async () => {
    if (!order) return;
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        `/api/orders/status?external_id=${encodeURIComponent(order.external_id)}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal cek status.");
      if (data.status === "PAID") {
        setStep("success");
        window.location.href = `/success?order=${encodeURIComponent(order.external_id)}`;
      } else {
        setError("Pembayaran belum terkonfirmasi. Coba cek lagi sebentar lagi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQris = () => {
    if (!qris || !order) return;

    const anchor = document.createElement("a");
    anchor.href = qris.qrImage;
    anchor.download = `qris-${order.external_id}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-3 sm:items-center">
      <button
        aria-label="Tutup checkout"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-pink-400/30 bg-[#110814] p-5 shadow-[0_0_70px_rgba(255,47,147,0.35)] sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd166]">
              Checkout QRIS
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {step === "email" && "Masukkan Email Untuk Menerima Akses"}
              {step === "method" && "Pilih Metode Pembayaran"}
              {step === "qris" && "Scan QRIS Pembayaran"}
              {step === "success" && "Pembayaran Berhasil"}
            </h2>
          </div>
          <button
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white"
            onClick={onClose}
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {step === "email" && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-white">
                Email aktif
              </span>
              <input
                className="h-14 w-full rounded-2xl border border-white/10 bg-white px-4 text-base font-semibold text-[#16091d] outline-none ring-pink-400 transition focus:ring-4"
                inputMode="email"
                placeholder="nama@email.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="flex gap-3 rounded-2xl border border-pink-300/30 bg-pink-400/10 p-4">
              <input
                className="mt-1 size-5 accent-pink-500"
                checked={includeAddon}
                type="checkbox"
                onChange={(event) => setIncludeAddon(event.target.checked)}
              />
              <span className="text-sm font-semibold text-white">
                Tambah 100+ Video Komik Fantasi 2026 (+Rp99.900)
              </span>
            </label>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-white/65">Total pembayaran</p>
              <p className="text-3xl font-black text-[#ffd166]">
                {formatRupiah(total)}
              </p>
            </div>
            <button
              className="h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_28px_rgba(255,47,147,0.5)] disabled:opacity-60"
              disabled={loading}
              onClick={submitEmail}
            >
              {loading ? "MEMPROSES..." : "LANJUT PILIH PEMBAYARAN"}
            </button>
          </div>
        )}

        {step === "method" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#ffd166]/50 bg-[#ffd166]/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">QRIS</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Bayar pakai mobile banking atau e-wallet yang mendukung QRIS.
                  </p>
                </div>
                <div className="rounded-full bg-[#ffd166] px-3 py-1 text-xs font-black text-[#150814]">
                  Aktif
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
              Pembayaran diproses aman melalui payment gateway.
            </div>
            <button
              className="h-14 w-full rounded-2xl bg-[#ffd166] text-base font-black text-[#16091d] disabled:opacity-60"
              disabled={loading}
              onClick={createQris}
            >
              {loading ? "MEMBUAT QRIS..." : "BUAT QRIS PEMBAYARAN"}
            </button>
          </div>
        )}

        {step === "qris" && qris && order && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QRIS pembayaran"
                className="mx-auto size-72 max-w-full"
                src={qris.qrImage}
              />
            </div>
            <div className="rounded-2xl border border-[#ffd166]/30 bg-[#ffd166]/10 p-4">
              <p className="text-sm font-bold text-[#ffd166]">
                Bayar dari HP yang sama?
              </p>
              <p className="mt-1 text-sm leading-6 text-white/75">
                Download QRIS dulu, lalu buka mobile banking atau e-wallet dan
                pilih scan dari galeri.
              </p>
              <button
                className="mt-3 h-12 w-full rounded-xl border border-[#ffd166]/60 bg-[#ffd166] text-sm font-black text-[#16091d]"
                onClick={downloadQris}
              >
                DOWNLOAD QRIS
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-white/55">Total</p>
                <p className="font-black text-[#ffd166]">
                  {formatRupiah(qris.amount)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-white/55">Sisa waktu</p>
                <p className="font-black text-white">
                  {Math.floor(remainingSeconds / 60)}:
                  {String(remainingSeconds % 60).padStart(2, "0")}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-xs text-white/70">
              <p className="mb-2 font-bold text-white">Order ID</p>
              <p className="break-all">{order.external_id}</p>
              <button
                className="mt-3 rounded-xl border border-white/10 px-3 py-2 font-bold text-white"
                onClick={async () => {
                  await navigator.clipboard.writeText(order.external_id);
                  setCopied(true);
                }}
              >
                {copied ? "Tersalin" : "Salin order id"}
              </button>
            </div>
            <ol className="space-y-2 rounded-2xl bg-pink-400/10 p-4 text-sm text-white/80">
              <li>1. Buka mobile banking atau e-wallet</li>
              <li>2. Pilih Scan QRIS</li>
              <li>3. Scan kode QR</li>
              <li>4. Pastikan nominal sesuai</li>
              <li>5. Selesaikan pembayaran</li>
            </ol>
            <button
              className="h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white disabled:opacity-60"
              disabled={loading}
              onClick={manualCheck}
            >
              {loading ? "MENGECEK..." : "SAYA SUDAH BAYAR, CEK STATUS"}
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-400 text-4xl font-black text-[#08110d]">
              ✓
            </div>
            <p className="text-white/75">
              Link akses sedang dikirim ke email kamu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
