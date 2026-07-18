"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckoutSheet } from "./CheckoutSheet";
import { trackMetaEvent } from "@/lib/meta-client";
import {
  ADDON_PRODUCT_NORMAL_PRICE,
  ADDON_PRODUCT_PRICE,
  MAIN_PRODUCT_NORMAL_PRICE,
  MAIN_PRODUCT_PRICE,
  VVIP_PRODUCT_NORMAL_PRICE,
  VVIP_PRODUCT_PRICE,
  formatRupiah,
} from "@/lib/products";

const benefits = [
  "100+ Koleksi",
  "Akses Lifetime",
  "Sekali Bayar",
  "Download Selamanya",
];

const painPoints = [
  [
    "Cari manual itu buang waktu",
    "Harus buka banyak halaman, skip iklan, cek file satu-satu, dan belum tentu dapat yang lengkap.",
  ],
  [
    "Bayar satuan bisa lebih mahal",
    "Kalau ambil satu-satu, totalnya bisa jauh lebih besar daripada ambil langsung dalam satu bundle.",
  ],
  [
    "Link sering hilang atau error",
    "Hari ini ada, besok bisa hilang. Belum lagi file rusak, kepotong, atau susah diakses ulang.",
  ],
];

const packageItems = [
  [
    "100+ Komik Digital",
    "Langsung dapat koleksi besar dalam satu akses, jadi kamu nggak perlu cari manual satu-satu.",
  ],
  [
    "Akses Lifetime Selamanya",
    "Sekali beli, akses tetap milik kamu. Bukan langganan bulanan dan bukan bayar ulang.",
  ],
  [
    "Bisa Download & Simpan Pribadi",
    "File bisa kamu download, simpan, dan baca kapan saja tanpa harus bolak-balik cari link lagi.",
  ],
  [
    "Banyak Variasi Cerita",
    "Cocok buat kamu yang suka koleksi komik fantasi dewasa dengan berbagai karakter, alur, dan gaya cerita.",
  ],
  [
    "Bonus Update Launching",
    "Selama masa promo, pembeli awal berkesempatan mendapat update tambahan jika ada koleksi baru yang ditambahkan.",
  ],
];

const addonItems = [
  [
    "100+ Video Komik Digital",
    "Tambahan koleksi video komik fantasi pilihan yang bisa kamu akses sebagai pelengkap bundle utama.",
  ],
  [
    "Lebih Hemat Ambil Sekarang",
    "Daripada nanti cari lagi satu-satu, kena iklan lagi, atau bayar terpisah, add-on ini dibuat lebih murah saat checkout.",
  ],
  [
    "Cocok Buat Koleksi Lengkap",
    "Kalau kamu sudah ambil bundle komik utama, add-on ini bikin koleksi kamu lebih lengkap dalam satu akses digital.",
  ],
];

const vvipItems = [
  [
    "Update Tele Setiap Hari",
    "Masuk grup VVIP untuk lihat update koleksi dan info tambahan tanpa harus cari manual lagi.",
  ],
  [
    "Cocok Buat yang Mau Paling Lengkap",
    "Ambil bundle utama, tambah video, lalu aktifkan VVIP supaya akses kamu lebih maksimal.",
  ],
  [
    "Harga Add-On Khusus Checkout",
    "Normalnya Rp299.900, tapi saat promo ini cukup tambah Rp99.900 di checkout.",
  ],
];

const steps = [
  [
    "1",
    "Klik Tombol Beli",
    "Pilih paket utama, lalu tambah add-on video atau VVIP Tele kalau mau koleksi yang lebih lengkap.",
  ],
  [
    "2",
    "Selesaikan Pembayaran",
    "Ikuti instruksi pembayaran QRIS sampai transaksi berhasil.",
  ],
  [
    "3",
    "Dapat Link Akses",
    "Setelah status pembayaran selesai/paid, file dan akses akan dikirim sesuai paket yang dibeli.",
  ],
  [
    "4",
    "Download & Simpan Pribadi",
    "File bisa kamu simpan untuk koleksi pribadi dan dibaca kapan saja.",
  ],
];

const dealItems = [
  "100+ komik fantasi dewasa pilihan",
  "Akses lifetime selamanya",
  "Bisa download dan simpan pribadi",
  "Sekali bayar, bukan langganan",
  "Banyak variasi cerita dan karakter",
  "Bantuan admin kalau ada kendala akses",
];

const previewPages = [
  "/assets/previews/preview-01.jpeg",
  "/assets/previews/preview-02.jpeg",
  "/assets/previews/preview-03.jpeg",
  "/assets/previews/preview-04.jpeg",
  "/assets/previews/preview-05.jpeg",
  "/assets/previews/preview-06.jpeg",
  "/assets/previews/preview-07.jpeg",
  "/assets/previews/preview-08.jpeg",
  "/assets/previews/preview-09.jpeg",
  "/assets/previews/preview-10.png",
  "/assets/previews/preview-11.png",
  "/assets/previews/preview-12.png",
  "/assets/previews/preview-13.png",
  "/assets/previews/preview-14.png",
  "/assets/previews/preview-15.png",
  "/assets/previews/preview-16.png",
];

export function LandingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<number | null>(null);
  const [driveProofOpen, setDriveProofOpen] = useState(false);
  const [promoRemaining, setPromoRemaining] = useState(15 * 60);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setPromoRemaining(Math.max(0, 15 * 60 - elapsed));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const promoCountdown = formatCountdown(promoRemaining);

  useEffect(() => {
    void trackMetaEvent("ViewContent", {
      content_name: "100+ Komik Fantasi Digital Pilihan 2026",
      content_type: "product",
      currency: "IDR",
      value: MAIN_PRODUCT_PRICE,
    });
  }, []);

  const openCheckout = () => {
    void trackMetaEvent("InitiateCheckout", {
      content_name: "100+ Komik Fantasi Digital Pilihan 2026",
      content_type: "product",
      currency: "IDR",
      value: MAIN_PRODUCT_PRICE,
      num_items: 1,
    });
    setCheckoutOpen(true);
  };

  const showNextPreview = () => {
    setSelectedPreview((current) =>
      current === null ? 0 : (current + 1) % previewPages.length,
    );
  };

  const showPreviousPreview = () => {
    setSelectedPreview((current) =>
      current === null
        ? 0
        : (current - 1 + previewPages.length) % previewPages.length,
    );
  };

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
          <ImageCard
            alt="100+ Komik Fantasi Dewasa Pilihan 2026"
            priority
            src="/assets/hero.png"
          />
          <div className="pt-6">
            <p className="inline-flex rounded-full border border-[#ffd166]/50 bg-[#ffd166]/10 px-4 py-2 text-xs font-black tracking-[0.16em] text-[#ffd166]">
              PROMO LAUNCHING - KHUSUS 18+
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight">
              100+ Komik Fantasi Dewasa Pilihan 2026
            </h1>
            <p className="mt-4 text-lg leading-7 text-white/76">
              Sekali beli, bisa download dan simpan selamanya.
            </p>
            <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55 line-through">
                Harga Normal {formatRupiah(MAIN_PRODUCT_NORMAL_PRICE)}
              </p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-white/70">
                Hari Ini Promo Launching
              </p>
              <p className="mt-1 text-[34px] font-black leading-tight text-[#ffd166]">
                {formatRupiah(MAIN_PRODUCT_PRICE)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#ffd166]/25 bg-[#ffd166]/10 px-3 py-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#ffd166]">
                  Sisa promo
                </span>
                <span className="font-black text-white">{promoCountdown}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white/70">
                Akses lifetime - bukan langganan bulanan
              </p>
            </div>
            <p className="mt-4 rounded-3xl border border-pink-400/20 bg-[#120914] p-4 text-base leading-7 text-white/78">
              Daripada cari satu-satu, kena iklan terus, link mati, atau bayar
              per judul, ambil langsung bundle digitalnya dalam satu paket
              besar.
            </p>
            <button
              className="mt-5 h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_28px_rgba(255,47,147,0.5)]"
              onClick={openCheckout}
            >
              AMBIL AKSES LIFETIME SEKARANG
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

        <CopySection eyebrow="Buat yang males ribet" title="Capek Cari Komik Satu-Satu?">
          <p className="text-base leading-7 text-white/75">
            Biasanya mau baca komik fantasi dewasa harus muter-muter dulu:
            kena iklan, link mati, file nggak lengkap, atau malah harus bayar
            per judul.
          </p>
          <div className="mt-4 space-y-3">
            {painPoints.map(([title, body]) => (
              <CopyPoint body={body} key={title} tone="danger" title={title} />
            ))}
          </div>
          <p className="mt-5 text-base font-black text-[#ffd166]">
            Solusinya: ambil bundle-nya sekalian.
          </p>
          <p className="mt-2 text-base leading-7 text-white/75">
            Dalam satu paket, kamu langsung dapat 100+ koleksi komik digital
            yang bisa di-download, disimpan pribadi, dan dibaca kapan saja.
          </p>
        </CopySection>

        <section className="px-4 pt-6">
          <ImageCard alt="Kenapa worth it" src="/assets/worth-it.png" />
        </section>

        <CopySection
          eyebrow="Isi paketnya"
          title="Dalam 1 Bundle Ini Kamu Dapat Apa Aja?"
        >
          <p className="text-base leading-7 text-white/75">
            Bukan cuma 1-2 judul. Ini koleksi besar berisi 100+ komik digital
            fantasi dewasa pilihan yang bisa kamu simpan dan baca kapan saja.
          </p>
          <div className="mt-4 space-y-3">
            {packageItems.map(([title, body]) => (
              <CopyPoint body={body} key={title} tone="success" title={title} />
            ))}
          </div>
          <p className="mt-5 text-base font-black text-[#ffd166]">
            Intinya: cukup sekali beli, koleksinya langsung jadi milik kamu.
          </p>
          <p className="mt-2 text-base leading-7 text-white/75">
            Dari harga normal {formatRupiah(MAIN_PRODUCT_NORMAL_PRICE)},
            sekarang promo launching hanya {formatRupiah(MAIN_PRODUCT_PRICE)}.
            Hemat Rp100.000 kalau ambil hari ini.
          </p>
        </CopySection>

        <section className="px-4 pt-6">
          <ImageCard alt="Isi bundle" src="/assets/bundle-content.png" />
        </section>

        <PreviewCarousel
          onSelect={setSelectedPreview}
          previews={previewPages}
        />

        <section className="px-4 pt-8">
          <div className="rounded-[28px] border border-[#ffd166]/30 bg-[#140a17] p-5 text-white shadow-[0_0_30px_rgba(255,209,102,0.08)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffd166]">
              Hitung sendiri value-nya
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Kenapa Bundle Ini Worth It Banget?
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-white/78">
              Karena kamu nggak cuma beli satu judul. Kamu ambil langsung
              koleksi besar yang bisa disimpan dan dibaca kapan saja.
            </p>
            <div className="mt-5 rounded-3xl border border-[#ffd166]/20 bg-[#211021] p-4">
              <p className="text-sm font-bold text-white/70">
                Harga promo bundle
              </p>
              <p className="text-3xl font-black text-[#ffd166]">
                {formatRupiah(MAIN_PRODUCT_PRICE)}
              </p>
              <p className="mt-1 text-sm font-bold text-white/70">
                Untuk 100+ komik digital
              </p>
              <div className="mt-4 rounded-2xl border border-[#ffd166]/20 bg-[#33152b] p-4">
                <p className="text-sm font-bold text-white/70">
                  Jatuhnya mulai dari sekitar
                </p>
                <p className="text-3xl font-black text-[#ffd166]">Rp1.000an</p>
                <p className="text-sm font-bold text-white/70">per komik</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <CopyPoint
                body="Waktu habis buat cari link, buka iklan, cek file, dan belum tentu koleksinya lengkap."
                tone="plain"
                title="Kalau cari satu-satu"
              />
              <CopyPoint
                body="Totalnya bisa jauh lebih mahal, apalagi kalau kamu memang suka koleksi komik fantasi digital."
                tone="plain"
                title="Kalau bayar satuan"
              />
              <CopyPoint
                body="Cukup sekali bayar, langsung dapat 100+ koleksi digital, bisa download, simpan, dan akses sepuasnya."
                tone="success"
                title="Kalau ambil bundle ini"
              />
            </div>
            <p className="mt-5 text-base font-black">
              Lebih hemat, lebih praktis, lebih puas.
            </p>
          </div>
        </section>

        <section className="px-4 pt-8">
          <div className="rounded-[28px] border border-[#ffd166]/40 bg-[#140a17] p-5">
            <ImageCard alt="Add-on video komik" src="/assets/addon.png" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#ffd166]">
              Add-on spesial
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Mau Versi Lebih Lengkap?
            </h2>
            <p className="mt-3 leading-7 text-white/75">
              Tambahkan koleksi 100+ Video Komik Fantasi Pilihan 2026 dengan
              harga khusus add-on.
            </p>
            <p className="mt-2 text-sm text-white/55 line-through">
              Harga Normal {formatRupiah(ADDON_PRODUCT_NORMAL_PRICE)}
            </p>
            <p className="text-3xl font-black text-[#ffd166]">
              Harga Add-On Hari Ini {formatRupiah(ADDON_PRODUCT_PRICE)}
            </p>
            <p className="mt-2 rounded-2xl border border-[#ffd166]/20 bg-[#ffd166]/10 p-3 text-sm font-black text-[#ffd166]">
              Hemat Rp200.000 khusus saat checkout.
            </p>
            <p className="mt-3 leading-7 text-white/75">
              Tambahan 100+ video komik digital untuk melengkapi bundle utama
              kamu.
            </p>
            <div className="mt-4 space-y-3">
              {addonItems.map(([title, body]) => (
                <CopyPoint body={body} key={title} tone="success" title={title} />
              ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-[22px] border border-pink-400/30 bg-black shadow-[0_0_28px_rgba(255,47,147,0.22)]">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src="https://www.youtube.com/embed/videoseries?list=PLY7oNld5yxvpke8b_VP-GRs50afLUPAi5"
                title="Preview playlist 100+ video komik fantasi 2026"
              />
            </div>
            <p className="mt-5 text-base font-black text-[#ffd166]">
              Bundle utama + add-on video = koleksi lebih lengkap.
            </p>
          </div>
        </section>

        <section className="px-4 pt-8">
          <div className="rounded-[28px] border border-[#ffd166]/40 bg-[#140a17] p-5 shadow-[0_0_30px_rgba(255,209,102,0.08)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffd166]">
              Order bump VVIP
            </p>
            <h2 className="mt-2 text-2xl font-black">
              VVIP Grup Tele Update Setiap Hari
            </h2>
            <p className="mt-3 leading-7 text-white/75">
              Buat yang mau paling lengkap, kamu bisa tambah akses VVIP Tele
              untuk update harian dan info koleksi tambahan.
            </p>
            <p className="mt-2 text-sm text-white/55 line-through">
              Harga Normal {formatRupiah(VVIP_PRODUCT_NORMAL_PRICE)}
            </p>
            <p className="text-3xl font-black text-[#ffd166]">
              Tambah Hari Ini {formatRupiah(VVIP_PRODUCT_PRICE)}
            </p>
            <p className="mt-2 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm font-black text-emerald-100">
              Hemat Rp200.000 kalau diambil bareng checkout sekarang.
            </p>
            <div className="mt-4 space-y-3">
              {vvipItems.map(([title, body]) => (
                <CopyPoint body={body} key={title} tone="success" title={title} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pt-8">
          <ImageCard
            alt="Koleksi lengkap dalam paket"
            src="/assets/bundle-overview.png"
          />
        </section>

        <section className="px-4 pt-8">
          <div className="overflow-hidden rounded-[28px] border border-[#3ddc97]/30 bg-[#07140f] shadow-[0_0_32px_rgba(61,220,151,0.12)]">
            <div className="bg-white p-2">
              <button
                aria-label="Lihat screenshot daftar file Google Drive"
                className="group relative block w-full overflow-hidden rounded-[18px]"
                onClick={() => setDriveProofOpen(true)}
                type="button"
              >
                <Image
                  alt="Screenshot daftar file koleksi komik di Google Drive"
                  className="h-[230px] w-full object-cover object-left-top transition duration-300 group-hover:scale-[1.03]"
                  height={900}
                  src="/assets/drive-proof.png"
                  width={1600}
                />
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg">
                  Klik untuk zoom bukti file
                </span>
              </button>
            </div>
            <div className="p-5 text-center">
              <p className="inline-flex rounded-full border border-[#3ddc97]/40 bg-[#3ddc97]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#75ffbd]">
                Bukti isi koleksi
              </p>
              <h2 className="mt-4 text-2xl font-black leading-tight">
                File-nya Kelihatan Jelas, Bukan Cuma Janji
              </h2>
              <p className="mt-3 text-base leading-7 text-white/75">
                Kamu bisa lihat sendiri ada banyak file komik digital dalam
                satu folder akses. Setelah pembayaran berhasil, akses dikirim
                sesuai paket yang kamu pilih.
              </p>
              <div className="mt-5 grid gap-3 text-left">
                <CopyPoint
                  body="Bukan cuma beberapa judul. Koleksinya tersusun dalam folder digital agar lebih gampang diakses."
                  tone="success"
                  title="100+ File Digital"
                />
                <CopyPoint
                  body="Setelah pembayaran sukses, kamu tinggal buka link akses, download, lalu simpan untuk koleksi pribadi."
                  tone="success"
                  title="Akses Setelah Pembayaran"
                />
                <CopyPoint
                  body="Tidak perlu bolak-balik cari link lagi. Sekali punya akses, koleksi bisa kamu simpan."
                  tone="success"
                  title="Bisa Disimpan Pribadi"
                />
              </div>
            </div>
          </div>
        </section>

        <CopySection
          eyebrow="Cara aksesnya gampang"
          title="Setelah Bayar, Langsung Dapat Akses"
        >
          <p className="text-base leading-7 text-white/75">
            Prosesnya simpel. Kamu tinggal checkout, selesaikan pembayaran,
            lalu akses/download koleksi sesuai paket yang kamu pilih.
          </p>
          <div className="mt-4 space-y-3">
            {steps.map(([number, title, body]) => (
              <div
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                key={title}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffd166] text-sm font-black text-[#16091d]">
                  {number}
                </span>
                <div>
                  <p className="font-black text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/68">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </CopySection>

        <section className="px-4 py-8">
          <div className="rounded-[28px] border border-[#ffd166]/40 bg-[#140a17] p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffd166]">
              Rangkuman deal
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Jadi, Dengan {formatRupiah(MAIN_PRODUCT_PRICE)} Kamu Dapat Ini
              Semua
            </h2>
            <p className="mt-3 text-base leading-7 text-white/75">
              Sekali checkout, langsung ambil bundle komik digital fantasi
              dewasa pilihan 2026 dengan akses lifetime.
            </p>
            <div className="mt-4 space-y-2">
              {dealItems.map((item) => (
                <div
                  className="rounded-2xl border border-[#ffd166]/20 bg-[#ffd166]/10 px-4 py-3 text-sm font-bold text-white"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55 line-through">
                Harga normal {formatRupiah(MAIN_PRODUCT_NORMAL_PRICE)}
              </p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-white/70">
                Promo Launching Hari Ini
              </p>
              <p className="mt-1 text-4xl font-black text-[#ffd166]">
                {formatRupiah(MAIN_PRODUCT_PRICE)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3">
                  <p className="text-white/60">Hemat hari ini</p>
                  <p className="font-black text-emerald-100">Rp100.000</p>
                </div>
                <div className="rounded-2xl border border-[#ffd166]/25 bg-[#ffd166]/10 p-3">
                  <p className="text-white/60">Sisa promo</p>
                  <p className="font-black text-[#ffd166]">{promoCountdown}</p>
                </div>
              </div>
              <p className="mt-2 text-sm font-bold text-white/70">
                Untuk 100+ koleksi digital dengan akses lifetime.
              </p>
            </div>
            <button
              className="mt-5 h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_28px_rgba(255,47,147,0.5)]"
              onClick={openCheckout}
            >
              YA, SAYA MAU AMBIL BUNDLE INI
            </button>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 z-40 w-screen max-w-[430px] border-t border-pink-300/20 bg-[#0d0610]/95 p-3 backdrop-blur sm:left-1/2 sm:-translate-x-1/2">
        <p className="mb-2 text-center text-xs font-bold text-[#ffd166]">
          Promo {formatRupiah(MAIN_PRODUCT_PRICE)} - Hemat Rp100.000 -{" "}
          {promoCountdown}
        </p>
        <button
          className="h-14 w-full rounded-2xl bg-[#ff2f93] text-base font-black text-white shadow-[0_0_30px_rgba(255,47,147,0.5)]"
          onClick={openCheckout}
        >
          AMBIL AKSES SEKARANG
        </button>
      </div>

      {selectedPreview !== null ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
          <button
            aria-label="Tutup preview"
            className="absolute right-4 top-4 h-11 rounded-full bg-white px-5 text-sm font-black text-[#16091d]"
            onClick={() => setSelectedPreview(null)}
          >
            Tutup
          </button>
          <button
            aria-label="Preview sebelumnya"
            className="absolute left-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-sm font-black text-white backdrop-blur"
            onClick={showPreviousPreview}
          >
            Prev
          </button>
          <div className="max-h-[86vh] w-full max-w-[520px] overflow-hidden rounded-[24px] border border-pink-400/35 bg-black">
            <Image
              alt={`Preview halaman komik ${selectedPreview + 1}`}
              className="h-auto max-h-[86vh] w-full object-contain"
              height={1100}
              src={previewPages[selectedPreview]}
              width={820}
            />
          </div>
          <button
            aria-label="Preview berikutnya"
            className="absolute right-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-sm font-black text-white backdrop-blur"
            onClick={showNextPreview}
          >
            Next
          </button>
        </div>
      ) : null}

      {driveProofOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
          <button
            aria-label="Tutup bukti file"
            className="absolute right-4 top-4 h-11 rounded-full bg-white px-5 text-sm font-black text-[#16091d]"
            onClick={() => setDriveProofOpen(false)}
            type="button"
          >
            Tutup
          </button>
          <div className="max-h-[86vh] w-full max-w-[920px] overflow-auto rounded-[24px] border border-[#3ddc97]/35 bg-white p-2">
            <Image
              alt="Screenshot daftar file koleksi komik di Google Drive"
              className="h-auto max-h-[82vh] w-full object-contain"
              height={900}
              src="/assets/drive-proof.png"
              width={1600}
            />
          </div>
        </div>
      ) : null}

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </main>
  );
}

function CopySection({
  eyebrow,
  title,
  children,
  variant = "default",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "green";
}) {
  const variantClass =
    variant === "green"
      ? "border-[#3ddc97]/30 bg-[#07140f]"
      : "border-[#ffd166]/30 bg-[#120914]";

  return (
    <section className="px-4 pt-8">
      <div className={`rounded-[28px] border p-5 ${variantClass}`}>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffd166]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

function CopyPoint({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "danger" | "success" | "plain";
}) {
  const color =
    tone === "danger"
      ? "border-red-400/20 bg-red-500/10"
      : tone === "success"
        ? "border-[#3ddc97]/25 bg-[#3ddc97]/10"
        : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/70">{body}</p>
    </div>
  );
}

function PreviewCarousel({
  previews,
  onSelect,
}: {
  previews: string[];
  onSelect: (index: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || previews.length < 2) return;

    const interval = window.setInterval(() => {
      const rail = railRef.current;
      const firstItem = rail?.querySelector("button");
      const itemWidth =
        firstItem instanceof HTMLElement ? firstItem.offsetWidth + 12 : 150;
      const nextIndex = (activeIndexRef.current + 1) % previews.length;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      rail?.scrollTo({
        behavior: "smooth",
        left: nextIndex * itemWidth,
      });
    }, 2300);

    return () => window.clearInterval(interval);
  }, [paused, previews.length]);

  return (
    <section className="px-4 pt-8">
      <div className="relative overflow-hidden rounded-[28px] border border-pink-400/35 bg-[radial-gradient(circle_at_top,rgba(255,47,147,0.22),#140a17_48%,#09040c)] p-5 shadow-[0_0_38px_rgba(255,47,147,0.18)]">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd166] to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffd166]">
              Preview pilihan komik
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Klik Untuk Lihat Contoh Halamannya
            </h2>
            <p className="mt-3 text-base leading-7 text-white/75">
              Carousel ini jalan otomatis. Tap salah satu preview untuk lihat
              halaman lebih besar.
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-[#ffd166]/40 bg-[#ffd166]/12 px-3 py-2 text-center">
            <p className="text-lg font-black text-[#ffd166]">{previews.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/58">
              Preview
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/68">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Auto-scroll aktif - bisa digeser manual
        </div>

        <div
          className="-mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={railRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {previews.map((src, index) => (
            <button
              className={`group w-[146px] shrink-0 snap-start overflow-hidden rounded-2xl border bg-black text-left shadow-[0_0_20px_rgba(255,47,147,0.18)] transition duration-300 ${
                activeIndex === index
                  ? "border-[#ffd166] shadow-[0_0_28px_rgba(255,209,102,0.25)]"
                  : "border-pink-400/30"
              }`}
              key={src}
              onClick={() => onSelect(index)}
            >
              <div className="relative">
                <Image
                  alt={`Preview komik ${index + 1}`}
                  className="h-[194px] w-full object-cover transition duration-300 group-hover:scale-105"
                  height={360}
                  src={src}
                  width={260}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent p-3">
                  <span className="inline-flex rounded-full bg-[#ffd166] px-2 py-1 text-[10px] font-black text-[#16091d]">
                    Tap lihat
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-black text-[#ffd166]">
                  Preview {index + 1}
                </span>
                <span className="text-xs font-black text-white/45">+</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {previews.map((src, index) => (
            <button
              aria-label={`Lihat preview ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                activeIndex === index
                  ? "w-7 bg-[#ffd166]"
                  : "w-2 bg-white/25"
              }`}
              key={src}
              onClick={() => {
                const rail = railRef.current;
                const firstItem = rail?.querySelector("button");
                const itemWidth =
                  firstItem instanceof HTMLElement
                    ? firstItem.offsetWidth + 12
                    : 150;

                activeIndexRef.current = index;
                setActiveIndex(index);
                rail?.scrollTo({
                  behavior: "smooth",
                  left: index * itemWidth,
                });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageCard({
  alt,
  src,
  priority,
}: {
  alt: string;
  src: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-pink-400/25 bg-black shadow-[0_0_32px_rgba(255,47,147,0.18)]">
      <Image
        alt={alt}
        className="h-auto w-full"
        height={1024}
        priority={priority}
        src={src}
        width={1024}
      />
    </div>
  );
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
