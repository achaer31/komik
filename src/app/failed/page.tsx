import Link from "next/link";

export default function FailedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08040b] px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-red-300/30 bg-[#110814] p-6 text-center">
        <h1 className="text-3xl font-black">Pembayaran Belum Berhasil</h1>
        <p className="mt-3 leading-7 text-white/70">
          QRIS sudah kedaluwarsa atau pembayaran belum berhasil. Silakan coba
          buat pembayaran baru.
        </p>
        <Link
          className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-[#ff2f93] font-black text-white"
          href="/"
        >
          Coba Lagi
        </Link>
      </div>
    </main>
  );
}
