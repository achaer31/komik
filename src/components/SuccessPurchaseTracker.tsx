"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-client";
import { countOrderItems, describeOrder } from "@/lib/products";

type SuccessPurchaseTrackerProps = {
  orderId: string;
  email: string;
  amount: number;
  includeAddon: boolean;
  includeVvip: boolean;
};

export function SuccessPurchaseTracker({
  orderId,
  email,
  amount,
  includeAddon,
  includeVvip,
}: SuccessPurchaseTrackerProps) {
  useEffect(() => {
    if (!orderId) return;

    void trackMetaEvent(
      "Purchase",
      {
        content_name: describeOrder({ includeAddon, includeVvip }),
        content_type: "product",
        currency: "IDR",
        value: amount,
        order_id: orderId,
        num_items: countOrderItems({ includeAddon, includeVvip }),
      },
      email,
      `purchase_${orderId}`,
    );
  }, [amount, email, includeAddon, includeVvip, orderId]);

  return null;
}
