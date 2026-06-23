import { Resend } from "resend";

function getProductLinks() {
  const main = process.env.PRODUCT_MAIN_URL;
  const video = process.env.PRODUCT_VIDEO_URL;

  if (!main) throw new Error("PRODUCT_MAIN_URL belum dikonfigurasi.");
  return { main, video };
}

function button(label: string, href: string) {
  return `
    <a href="${href}" style="display:inline-block;margin:10px 0;padding:14px 18px;border-radius:12px;background:#ff2f93;color:#ffffff;text-decoration:none;font-weight:800;">
      ${label}
    </a>
  `;
}

export async function sendAccessEmail(params: {
  to: string;
  includeAddon: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY atau RESEND_FROM_EMAIL belum dikonfigurasi.");
  }

  const links = getProductLinks();
  const resend = new Resend(apiKey);

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
        <p>Simpan email ini baik-baik. Kalau link tidak bisa dibuka, balas email ini atau hubungi admin.</p>
        <p style="color:#c9b7d9;font-size:13px;">Akses hanya untuk pembeli. Dilarang membagikan, menjual ulang, atau menyebarkan akses tanpa izin.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from,
    to: params.to,
    subject: "Akses Komik Pilihanku Kamu Sudah Aktif",
    html,
  });
}
