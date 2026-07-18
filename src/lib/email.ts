import { Resend } from "resend";
import { describeOrder, formatRupiah } from "./products";

function getProductLinks() {
  const main = process.env.PRODUCT_MAIN_URL;
  const video = process.env.PRODUCT_VIDEO_URL;
  const vvip = process.env.PRODUCT_VVIP_URL;

  if (!main) throw new Error("PRODUCT_MAIN_URL belum dikonfigurasi.");
  return { main, video, vvip };
}

function button(label: string, href: string) {
  return `
    <a href="${href}" style="display:inline-block;margin:10px 0;padding:14px 18px;border-radius:12px;background:#ff2f93;color:#ffffff;text-decoration:none;font-weight:800;">
      ${label}
    </a>
  `;
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://komikpilihanku.site"
  ).replace(/\/$/, "");
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY atau RESEND_FROM_EMAIL belum dikonfigurasi.");
  }

  return { resend: new Resend(apiKey), from };
}

export async function sendPaymentInvoiceEmail(params: {
  to: string;
  externalId: string;
  amount: number;
  includeAddon: boolean;
  includeVvip: boolean;
}) {
  const { resend, from } = getResendConfig();
  const checkoutUrl = `${getSiteUrl()}/v1?order=${encodeURIComponent(
    params.externalId,
  )}`;
  const productName = describeOrder({
    includeAddon: params.includeAddon,
    includeVvip: params.includeVvip,
  });

  const html = `
    <div style="font-family:Arial,sans-serif;background:#09060d;color:#fff;padding:28px;">
      <div style="max-width:560px;margin:auto;background:#140b1e;border:1px solid #3b254f;border-radius:20px;padding:28px;">
        <p style="margin:0 0 10px;color:#ffd166;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Invoice Pembayaran</p>
        <h1 style="color:#ffffff;margin:0 0 14px;font-size:28px;line-height:1.15;">Selesaikan pembayaran Komik Pilihanku</h1>
        <p style="color:#d8c8e8;line-height:1.7;">Halo, order kamu sudah kami terima. Silakan lanjutkan pembayaran agar akses digital bisa dikirim otomatis ke email ini setelah status pembayaran selesai/paid.</p>
        <div style="background:#211021;border:1px solid #ffd16633;border-radius:16px;padding:18px;margin:20px 0;">
          <p style="margin:0;color:#bda9cf;font-size:13px;">Produk</p>
          <p style="margin:6px 0 0;font-weight:800;color:#ffffff;">${productName}</p>
          <p style="margin:16px 0 0;color:#bda9cf;font-size:13px;">Total pembayaran</p>
          <p style="margin:6px 0 0;color:#ffd166;font-size:30px;font-weight:900;">${formatRupiah(params.amount)}</p>
          <p style="margin:16px 0 0;color:#bda9cf;font-size:13px;">Order ID</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:13px;word-break:break-all;">${params.externalId}</p>
        </div>
        ${button("Lanjutkan Bayar Sekarang", checkoutUrl)}
        <p style="color:#d8c8e8;line-height:1.7;">Di halaman checkout, pilih QRIS untuk proses paling cepat. Kamu juga bisa pilih Virtual Account bank jika lebih nyaman transfer.</p>
        <p style="color:#c9b7d9;font-size:13px;line-height:1.6;">File dan akses baru dikirim setelah payment gateway mengubah status order menjadi selesai/paid, jadi pastikan nominal pembayaran sesuai.</p>
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send(
    {
      from,
      to: params.to,
      subject: `Invoice Komik Pilihanku - ${formatRupiah(params.amount)}`,
      html,
      tags: [
        { name: "kind", value: "payment-invoice" },
        { name: "order_id", value: params.externalId.slice(0, 255) },
      ],
    },
    {
      headers: {
        "Idempotency-Key": `payment-invoice-${params.externalId}`,
      },
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { id: data?.id ?? null };
}

export async function sendAccessEmail(params: {
  to: string;
  externalId: string;
  includeAddon: boolean;
  includeVvip: boolean;
}) {
  const { resend, from } = getResendConfig();
  const links = getProductLinks();

  const html = `
    <div style="font-family:Arial,sans-serif;background:#09060d;color:#fff;padding:28px;">
      <div style="max-width:560px;margin:auto;background:#140b1e;border:1px solid #3b254f;border-radius:20px;padding:28px;">
        <h1 style="color:#ffd166;margin-top:0;">Akses Komik Pilihanku Kamu Sudah Aktif</h1>
        <p>Halo, pembayaran kamu berhasil.</p>
        <p>Silakan buka akses digital kamu lewat tombol berikut:</p>
        ${button("Buka 100+ Fantasi Komik Terbaik 2026", links.main)}
        ${
          params.includeAddon && links.video
            ? button("Buka 100+ Video Komik Fantasi 2026", links.video)
            : ""
        }
        ${
          params.includeVvip && links.vvip
            ? button("Buka VVIP Grup Tele Update Setiap Hari", links.vvip)
            : ""
        }
        ${
          params.includeVvip && !links.vvip
            ? '<p style="background:#211021;border:1px solid #ffd16633;border-radius:14px;padding:14px;line-height:1.6;">Kamu juga mengambil VVIP Grup Tele Update Setiap Hari. Link grup akan dikirim/dikonfirmasi admin setelah pembayaran kamu selesai.</p>'
            : ""
        }
        <p>Simpan email ini baik-baik. Kalau link tidak bisa dibuka, balas email ini atau hubungi admin.</p>
        <p style="color:#c9b7d9;font-size:13px;">Akses hanya untuk pembeli. Dilarang membagikan, menjual ulang, atau menyebarkan akses tanpa izin.</p>
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send(
    {
      from,
      to: params.to,
      subject: "Akses Komik Pilihanku Kamu Sudah Aktif",
      html,
      tags: [
        { name: "kind", value: "access-delivery" },
        { name: "order_id", value: params.externalId.slice(0, 255) },
      ],
    },
    {
      headers: {
        "Idempotency-Key": `access-delivery-${params.externalId}`,
      },
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { id: data?.id ?? null };
}
