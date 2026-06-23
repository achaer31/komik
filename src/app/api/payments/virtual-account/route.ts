import { NextResponse } from "next/server";
import { getOrderByExternalId, updateOrderByExternalId } from "@/lib/orders";
import {
  createVirtualAccountPayment,
  VIRTUAL_ACCOUNT_BANKS,
  type VirtualAccountBankCode,
} from "@/lib/xendit";

function isValidBankCode(bankCode?: string): bankCode is VirtualAccountBankCode {
  return VIRTUAL_ACCOUNT_BANKS.some((bank) => bank.code === bankCode);
}

export async function POST(request: Request) {
  try {
    const { external_id: externalId, bank_code: bankCode } =
      (await request.json()) as {
        external_id?: string;
        bank_code?: string;
      };

    if (!externalId) {
      return NextResponse.json({ error: "Order ID wajib diisi." }, { status: 400 });
    }

    if (!isValidBankCode(bankCode)) {
      return NextResponse.json(
        { error: "Bank Virtual Account tidak valid." },
        { status: 400 },
      );
    }

    const order = await getOrderByExternalId(externalId);
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order tidak dalam status pending." },
        { status: 400 },
      );
    }

    const va = await createVirtualAccountPayment({
      externalId: order.external_id,
      amount: order.amount,
      email: order.email,
      bankCode,
    });

    await updateOrderByExternalId(order.external_id, {
      xendit_payment_id: va.id,
      xendit_reference_id: va.external_id,
      payment_method: "VIRTUAL_ACCOUNT",
      payment_channel: va.bank_code,
      va_payload: va,
      va_account_number: va.account_number,
      va_bank_code: va.bank_code,
      va_expires_at: va.expiration_date,
    });

    return NextResponse.json({
      external_id: order.external_id,
      amount: order.amount,
      bankCode: va.bank_code,
      bankName: va.bank_name,
      accountNumber: va.account_number,
      expiresAt: va.expiration_date,
      xenditPaymentId: va.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal membuat Virtual Account.",
      },
      { status: 500 },
    );
  }
}
