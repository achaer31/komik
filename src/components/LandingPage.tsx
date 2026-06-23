"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckoutSheet } from "./CheckoutSheet";

const benefits = [
  "100+ Koleksi",
  "Akses Lifetime",
  "Sekali Bayar",
  "Download Selamanya",
];

const steps = [
  "Isi email",
  "Pilih QRIS",
  "Scan dan bayar",
  "Link akses dikirim otomatis ke email",
];

const faqs = [
  ["Ini langganan?", "Bukan, sekali bayar."],
  ["Setelah bayar dapat apa?", "Link akses digital dikirim ke email."],
  ["Bisa download?", "Bisa, sesuai akses file yang tersedia."],
  ["Kalau email belum masuk?", "Cek inbox, spam, promosi, atau hubungi admin."],
  ["Untuk semua umur?", "Tidak, hanya untuk pembeli dewasa 18+."],
];

export function LandingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#08040b] pb-28 text-white">
      <div className="w-screen max-w-[430px] overflow-hidden bg-[radial-gradient(circle_at_top,#4a103a_0%,#120817_42%,#08040b_78%)] shadow-2xl shadow-black sm:mx-auto md:my-8 md:rounded-[32px]">
        <header className="px-4 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tracking-tight text-white">
              Komik Pilihanku
            </span>
            <span className="rounded-full border border-red-400/60 bg-red-600/20 px-3 py-1 text-sm font-black text-red-100">
              18+
            </span>
          </div>
        </header>

        <section className="px-4 pt-5">
          <div className="overflow-hidden rounded-[26px] border border-pink-400/30 bg-black shadow-[0_0_40px_rgba(255,47,147,0.25)]">
            <Image
              alt="100+ Komik Fantasi Dewasa Pilihan 2026"
              className="h-auto w-full"
              height={1024}
              priority
              src="/assets/hero.png"
              width={1024}
            />
          </div>
          <div className="pt-6">
            <p className="inline-flex rounded-full border border-[#ffd166]/50 bg-[#ffd166]/10 px-4 py-2 text-xs font-black tracking-[0.16em] text-[#ffd166]">
              PROMO LAUNCHING
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight">
              100+ Komik Fantasi Digital Pilihan 2026
            </h1>
            <p className="mt-4 text-lg leading-7 text-white/76">
              Sekali beli, akses selamanya. Bisa download dan simpan pribadi.
            </p>
            <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55 line-through">
                Harga Normal Rp299.900
              </p>
              <p className="mt-1 text-[22px] font-black leading-tight text-[#ffd166] min-[420px]:text-3xl">
                Promo Hari Ini Rp149.900
              </p>
            </div>
            <button
              className="mt-5 h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_28px_rgba(255,47,147,0.5)]"
              onClick={() => setCheckoutOpen(true)}
            >
              ORDER AKSES SEKARANG
            </button>
          </div>
        </section>

        <section className="px-4 pt-8">
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit) => (
              <div
                className="flex min-h-16 items-center justify-center rounded-2xl border border-pink-400/25 bg-[#16091d] p-3 text-center"
                key={benefit}
              >
                <p className="text-xs font-black leading-tight text-white min-[400px]:text-sm">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pt-6">
          <ImageCard alt="Keuntungan utama bundle" src="/assets/benefits.png" />
        </section>

        <section className="px-4 pt-8">
          <div className="rounded-[28px] border border-[#ffd166]/30 bg-[#120914] p-5">
            <h2 className="text-2xl font-black">Kenapa ambil bundlenya?</h2>
            <p className="mt-3 text-base leading-7 text-white/75">
              Capek cari satu-satu, kena iklan terus, link mati, atau bayar per
              judul? Ambil bundle-nya sekali saja.
            </p>
          </div>
        </section>

        <section className="px-4 pt-6">
          <ImageCard alt="Kenapa worth it" src="/assets/worth-it.png" />
        </section>

        <section className="px-4 pt-8">
          <div className="rounded-[28px] bg-[#ff2f93] p-5 text-[#fff7fb]">
            <h2 className="text-2xl font-black">Lebih hemat per koleksi</h2>
            <p className="mt-3 text-base font-semibold leading-7">
              Dengan Rp149.900 untuk 100+ koleksi, jatuhnya sekitar Rp1.499 per
              komik.
            </p>
          </div>
        </section>

        <section className="px-4 pt-6">
          <ImageCard alt="Isi bundle" src="/assets/bundle-content.png" />
        </section>

        <section className="px-4 pt-8">
          <div className="rounded-[28px] border border-[#ffd166]/40 bg-[#140a17] p-5">
            <ImageCard alt="Add-on video komik" src="/assets/addon.png" />
            <h2 className="mt-5 text-2xl font-black">
              Tambah 100+ Video Komik Fantasi 2026
            </h2>
            <p className="mt-2 text-sm text-white/55 line-through">
              Normal Rp149.900
            </p>
            <p className="text-3xl font-black text-[#ffd166]">
              Add-on spesial Rp99.900
            </p>
            <p className="mt-3 leading-7 text-white/75">
              Lebih murah ambil sekarang daripada nanti cari lagi satu-satu.
            </p>
          </div>
        </section>

        <section className="px-4 pt-8">
          <ImageCard
            alt="Koleksi lengkap dalam paket"
            src="/assets/bundle-overview.png"
          />
        </section>

        <section className="px-4 pt-8">
          <h2 className="text-2xl font-black">Cara akses</h2>
          <div className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <div
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                key={step}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffd166] text-sm font-black text-[#16091d]">
                  {index + 1}
                </span>
                <p className="font-bold text-white">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pt-8">
          <h2 className="text-2xl font-black">FAQ</h2>
          <div className="mt-4 space-y-3">
            {faqs.map(([question, answer]) => (
              <details
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                key={question}
              >
                <summary className="cursor-pointer text-base font-black">
                  {question}
                </summary>
                <p className="mt-3 leading-7 text-white/70">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="rounded-2xl border border-red-400/35 bg-red-500/10 p-4 text-sm leading-6 text-red-50">
            Produk digital ini hanya untuk pembeli dewasa 18+. Pembeli
            bertanggung jawab menggunakan akses untuk konsumsi pribadi. Dilarang
            menyebarkan ulang, menjual ulang, atau membagikan akses tanpa izin.
            Pastikan semua konten yang dijual legal dan memiliki hak distribusi
            yang sah.
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 z-40 w-screen max-w-[430px] border-t border-pink-300/20 bg-[#0d0610]/95 p-3 backdrop-blur sm:left-1/2 sm:-translate-x-1/2">
        <p className="mb-2 text-center text-xs font-bold text-[#ffd166]">
          Promo launching Rp149.900 - Sekali bayar
        </p>
        <button
          className="h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_30px_rgba(255,47,147,0.5)]"
          onClick={() => setCheckoutOpen(true)}
        >
          ORDER AKSES SEKARANG
        </button>
      </div>

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </main>
  );
}

function ImageCard({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-pink-400/25 bg-black shadow-[0_0_32px_rgba(255,47,147,0.18)]">
      <Image
        alt={alt}
        className="h-auto w-full"
        height={1024}
        src={src}
        width={1024}
      />
    </div>
  );
}
