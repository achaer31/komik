"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-client";

type SuccessPurchaseTrackerProps = {
  orderId: string;
  email: string;
  amount: number;
  includeAddon: boolean;
};

export function SuccessPurchaseTracker({
  orderId,
  email,
  amount,
  includeAddon,
}: SuccessPurchaseTrackerProps) {
  useEffect(() => {
    if (!orderId) return;

    void trackMetaEvent(
      "Purchase",
      {
        content_name: includeAddon
          ? "Komik Fantasi Digital + Video Add-on"
          : "100+ Komik Fantasi Digital Pilihan 2026",
        content_type: "product",
        currency: "IDR",
        value: amount,
        order_id: orderId,
        num_items: includeAddon ? 2 : 1,
      },
      email,
      `purchase_${orderId}`,
    );
  }, [amount, email, includeAddon, orderId]);

  return null;
}
