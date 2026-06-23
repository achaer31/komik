import { NextResponse } from "next/server";
import {
  calculateAmount,
  createExternalId,
  isValidEmail,
} from "@/lib/products";
import { createOrder } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      includeAddon?: boolean;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const includeAddon = Boolean(body.includeAddon);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }

    const order = await createOrder({
      external_id: createExternalId(),
      email,
      include_addon: includeAddon,
      amount: calculateAmount(includeAddon),
      status: "PENDING",
    });

    return NextResponse.json({
      external_id: order.external_id,
      amount: order.amount,
      includeAddon: order.include_addon,
      status: order.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat order." },
      { status: 500 },
    );
  }
}
