import { getAdminSession } from "@/lib/admin-auth";
import { loginAdmin } from "./actions";
import { AdminDashboard } from "./AdminDashboard";

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

  return <AdminDashboard email={session.email} />;
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

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
