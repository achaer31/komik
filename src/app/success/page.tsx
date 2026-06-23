import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08040b] px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-emerald-300/30 bg-[#110814] p-6 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-400 text-4xl font-black text-[#08110d]">
          ✓
        </div>
        <h1 className="mt-5 text-3xl font-black">Pembayaran Berhasil</h1>
        <p className="mt-3 leading-7 text-white/70">
          Akses sedang dikirim ke email kamu. Cek inbox, spam, atau promosi.
        </p>
        <div className="mt-5 rounded-2xl bg-white/5 p-4 text-left text-sm text-white/70">
          Paket: 100+ Komik Fantasi Digital Pilihan 2026
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
