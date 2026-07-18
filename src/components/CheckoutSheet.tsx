"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADDON_PRODUCT_NORMAL_PRICE,
  ADDON_PRODUCT_PRICE,
  MAIN_PRODUCT_NORMAL_PRICE,
  MAIN_PRODUCT_PRICE,
  VVIP_PRODUCT_NORMAL_PRICE,
  VVIP_PRODUCT_PRICE,
  calculateAmount,
  calculateNormalAmount,
  calculateSavings,
  countOrderItems,
  describeOrder,
  formatRupiah,
} from "@/lib/products";
import { trackMetaEvent } from "@/lib/meta-client";

type Step = "email" | "method" | "qris" | "va" | "success";

type OrderResponse = {
  external_id: string;
  amount: number;
  includeAddon: boolean;
  includeVvip: boolean;
  status: string;
};

type QrisResponse = {
  external_id: string;
  amount: number;
  qrImage: string;
  expiresAt: string;
  xenditPaymentId: string;
};

type VaResponse = {
  external_id: string;
  amount: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  expiresAt: string;
  xenditPaymentId: string;
};

const virtualAccountBanks = [
  ["BNI", "BNI Virtual Account"],
  ["BRI", "BRI Virtual Account"],
  ["MANDIRI", "Mandiri Virtual Account"],
  ["PERMATA", "Permata Virtual Account"],
];

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
  const [includeVvip, setIncludeVvip] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [qris, setQris] = useState<QrisResponse | null>(null);
  const [va, setVa] = useState<VaResponse | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [checkoutEndsAt, setCheckoutEndsAt] = useState(
    () => Date.now() + 15 * 60 * 1000,
  );

  const orderOptions = { includeAddon, includeVvip };
  const total = calculateAmount(orderOptions);
  const normalTotal = calculateNormalAmount(orderOptions);
  const savings = calculateSavings(orderOptions);
  const checkoutRemainingSeconds = useMemo(() => {
    return Math.max(0, Math.floor((checkoutEndsAt - now) / 1000));
  }, [checkoutEndsAt, now]);
  const activeOrderOptions = order
    ? { includeAddon: order.includeAddon, includeVvip: order.includeVvip }
    : orderOptions;
  const activeNormalTotal = calculateNormalAmount(activeOrderOptions);
  const activeSavings = calculateSavings(activeOrderOptions);
  const paymentRemainingSeconds = useMemo(() => {
    if (!qris?.expiresAt) return 0;
    return Math.max(0, Math.floor((Date.parse(qris.expiresAt) - now) / 1000));
  }, [now, qris?.expiresAt]);

  useEffect(() => {
    if (!open) return;
    const resetTimer = window.setTimeout(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setCheckoutEndsAt(currentTime + 15 * 60 * 1000);
    }, 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(interval);
    };
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      !order ||
      (step !== "qris" && step !== "va" && step !== "success")
    ) {
      return;
    }
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
        body: JSON.stringify({ email, includeAddon, includeVvip }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat order.");
      setOrder(data);
      void trackMetaEvent(
        "AddToCart",
        {
          content_name: describeOrder(orderOptions),
          content_type: "product",
          currency: "IDR",
          value: total,
          num_items: countOrderItems(orderOptions),
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
          content_name: describeOrder({
            includeAddon: order.includeAddon,
            includeVvip: order.includeVvip,
          }),
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

  const createVirtualAccount = async (bankCode: string) => {
    if (!order) return;
    setError("");
    setSelectedBank(bankCode);
    setLoading(true);
    try {
      const response = await fetch("/api/payments/virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          external_id: order.external_id,
          bank_code: bankCode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat Virtual Account.");
      }
      setVa(data);
      void trackMetaEvent(
        "AddPaymentInfo",
        {
          content_name: describeOrder({
            includeAddon: order.includeAddon,
            includeVvip: order.includeVvip,
          }),
          content_type: "product",
          currency: "IDR",
          value: order.amount,
          payment_method: `VA_${bankCode}`,
        },
        email,
      );
      setStep("va");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
      setSelectedBank("");
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
              {step === "va" && "Bayar Virtual Account"}
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
            <DealTimer seconds={checkoutRemainingSeconds} />
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
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-50">
              File komik, video, dan akses tambahan baru dikirim setelah status
              pembayaran selesai/paid. Pastikan email aktif karena invoice dan
              akses otomatis dikirim ke email ini.
            </div>
            <div className="rounded-2xl border border-[#ffd166]/30 bg-[#ffd166]/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd166]">
                Paket utama hari ini
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="font-black text-white">
                    100+ Komik Fantasi Dewasa
                  </p>
                  <p className="mt-1 text-sm text-white/55 line-through">
                    Normal {formatRupiah(MAIN_PRODUCT_NORMAL_PRICE)}
                  </p>
                </div>
                <p className="text-xl font-black text-[#ffd166]">
                  {formatRupiah(MAIN_PRODUCT_PRICE)}
                </p>
              </div>
            </div>
            <label className="block rounded-2xl border border-pink-300/30 bg-pink-400/10 p-4">
              <div className="flex gap-3">
                <input
                  className="mt-1 size-5 accent-pink-500"
                  checked={includeAddon}
                  type="checkbox"
                  onChange={(event) => setIncludeAddon(event.target.checked)}
                />
                <span className="flex-1 text-sm font-semibold text-white">
                  <span className="block font-black">
                    Tambah 100+ Video Komik Fantasi 2026
                  </span>
                  <span className="mt-1 block text-white/55 line-through">
                    Normal {formatRupiah(ADDON_PRODUCT_NORMAL_PRICE)}
                  </span>
                  <span className="block text-[#ffd166]">
                    Hari ini cukup tambah {formatRupiah(ADDON_PRODUCT_PRICE)}
                  </span>
                </span>
              </div>
            </label>
            <label className="block rounded-2xl border border-[#ffd166]/35 bg-[#ffd166]/10 p-4">
              <div className="flex gap-3">
                <input
                  className="mt-1 size-5 accent-pink-500"
                  checked={includeVvip}
                  type="checkbox"
                  onChange={(event) => setIncludeVvip(event.target.checked)}
                />
                <span className="flex-1 text-sm font-semibold text-white">
                  <span className="block font-black">
                    VVIP Grup Tele Update Setiap Hari
                  </span>
                  <span className="mt-1 block text-white/55 line-through">
                    Normal {formatRupiah(VVIP_PRODUCT_NORMAL_PRICE)}
                  </span>
                  <span className="block text-[#ffd166]">
                    Hari ini cukup tambah {formatRupiah(VVIP_PRODUCT_PRICE)}
                  </span>
                </span>
              </div>
            </label>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/65">Harga normal total</p>
                <p className="text-sm font-bold text-white/45 line-through">
                  {formatRupiah(normalTotal)}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm text-white/65">Total pembayaran</p>
                <p className="text-3xl font-black text-[#ffd166]">
                  {formatRupiah(total)}
                </p>
              </div>
              <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-100">
                Kamu hemat {formatRupiah(savings)} kalau bayar sekarang.
              </div>
            </div>
            <button
              className="h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_28px_rgba(255,47,147,0.5)] disabled:opacity-60"
              disabled={loading}
              onClick={submitEmail}
            >
              {loading ? "MEMPROSES..." : "KUNCI PROMO & LANJUT BAYAR"}
            </button>
          </div>
        )}

        {step === "method" && (
          <div className="space-y-4">
            <DealTimer seconds={checkoutRemainingSeconds} />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd166]">
                Ringkasan hemat hari ini
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-white/55 line-through">
                    Normal {formatRupiah(activeNormalTotal)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-100">
                    Hemat {formatRupiah(activeSavings)}
                  </p>
                </div>
                <p className="text-3xl font-black text-[#ffd166]">
                  {formatRupiah(order?.amount ?? total)}
                </p>
              </div>
            </div>
            <div className="rounded-3xl border-2 border-[#ffd166] bg-[radial-gradient(circle_at_top_left,rgba(255,209,102,0.26),rgba(255,209,102,0.08)_42%,rgba(255,47,147,0.12))] p-4 shadow-[0_0_34px_rgba(255,209,102,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex rounded-full bg-[#ffd166] px-3 py-1 text-xs font-black tracking-[0.16em] text-[#150814]">
                    PALING CEPAT & DIREKOMENDASIKAN
                  </div>
                  <p className="mt-3 text-3xl font-black text-white">QRIS</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Scan sekali, bayar dari hampir semua mobile banking dan
                    e-wallet. Konfirmasi otomatis setelah pembayaran sukses.
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-[#06120e]">
                  Aktif
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black text-white">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  24 JAM
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  OTOMATIS
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  AMAN
                </div>
              </div>
              <button
                className="mt-4 h-14 w-full rounded-2xl bg-[#ffd166] text-base font-black text-[#16091d] disabled:opacity-60"
                disabled={loading}
                onClick={createQris}
              >
                {loading && selectedBank === "" ? "MEMBUAT QRIS..." : "BAYAR PALING CEPAT PAKAI QRIS"}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">
                    Metode lain: Virtual Account Bank
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/58">
                    Pilih bank, lalu sistem akan membuat nomor Virtual Account
                    khusus untuk order kamu.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#16091d]">
                  Real VA
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {virtualAccountBanks.map(([bankCode, bankName]) => (
                  <button
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/22 p-3 text-left transition hover:border-[#ffd166]/60 disabled:opacity-60"
                    disabled={loading}
                    key={bankCode}
                    onClick={() => createVirtualAccount(bankCode)}
                  >
                    <div>
                      <p className="text-sm font-black text-white">{bankName}</p>
                      <p className="mt-1 text-[11px] font-bold leading-4 text-white/52">
                        Transfer lewat ATM, mobile banking, atau internet banking.
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#ffd166]">
                      {loading && selectedBank === bankCode ? "..." : "Pilih"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-[#ffd166]/25 bg-[#ffd166]/10 p-3 text-xs font-bold leading-5 text-[#ffe2a0]">
                QRIS tetap paling disarankan karena lebih cepat. Virtual Account
                disediakan buat yang lebih nyaman transfer bank.
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50">
              Pembayaran diproses aman melalui payment gateway. Setelah status
              paid terdeteksi, link akses otomatis dikirim ke email yang kamu
              isi tadi.
            </div>
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
                  {formatCountdown(paymentRemainingSeconds)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-50">
              Setelah status pembayaran selesai/paid, akses file otomatis
              dikirim ke email kamu. Total hemat hari ini{" "}
              {formatRupiah(activeSavings)} dibanding harga normal.
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

        {step === "va" && va && order && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#ffd166]/40 bg-[#ffd166]/10 p-4">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffd166]">
                {va.bankName}
              </p>
              <p className="mt-3 text-sm text-white/65">Nomor Virtual Account</p>
              <p className="mt-1 break-all text-3xl font-black text-white">
                {va.accountNumber}
              </p>
              <button
                className="mt-4 h-12 w-full rounded-xl bg-[#ffd166] text-sm font-black text-[#16091d]"
                onClick={async () => {
                  await navigator.clipboard.writeText(va.accountNumber);
                  setCopied(true);
                }}
              >
                {copied ? "NOMOR VA TERSALIN" : "SALIN NOMOR VA"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-white/55">Total</p>
                <p className="font-black text-[#ffd166]">
                  {formatRupiah(va.amount)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-white/55">Bank</p>
                <p className="font-black text-white">{va.bankCode}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-50">
              Setelah status pembayaran selesai/paid, akses file otomatis
              dikirim ke email kamu. Total hemat hari ini{" "}
              {formatRupiah(activeSavings)} dibanding harga normal.
            </div>
            <ol className="space-y-2 rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <li>1. Buka mobile banking/ATM/internet banking</li>
              <li>2. Pilih menu Virtual Account atau transfer VA</li>
              <li>3. Masukkan nomor VA di atas</li>
              <li>4. Pastikan nominal sesuai: {formatRupiah(va.amount)}</li>
              <li>5. Selesaikan pembayaran, akses dikirim otomatis</li>
            </ol>
            <button
              className="h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white disabled:opacity-60"
              disabled={loading}
              onClick={manualCheck}
            >
              {loading ? "MENGECEK..." : "SAYA SUDAH BAYAR, CEK STATUS"}
            </button>
            <button
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-white"
              onClick={() => setStep("method")}
            >
              GANTI METODE PEMBAYARAN
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

function DealTimer({ seconds }: { seconds: number }) {
  return (
    <div className="rounded-2xl border border-[#ffd166]/35 bg-[#ffd166]/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd166]">
            Promo checkout aktif
          </p>
          <p className="mt-1 text-sm font-bold leading-5 text-white/72">
            Harga diskon dikunci kalau pembayaran diselesaikan hari ini.
          </p>
        </div>
        <div className="rounded-2xl bg-[#ffd166] px-4 py-3 text-center text-[#16091d]">
          <p className="text-[10px] font-black uppercase tracking-[0.12em]">
            Sisa
          </p>
          <p className="text-lg font-black">{formatCountdown(seconds)}</p>
        </div>
      </div>
    </div>
  );
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
