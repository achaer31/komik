import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminOrdersSnapshot } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getAdminOrdersSnapshot());
  } catch (error) {
    console.error("Admin orders API failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal memuat data order.",
      },
      { status: 500 },
    );
  }
}
