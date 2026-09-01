import { createHmac } from "node:crypto";

const PURCHASE_URL = "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

function reqTime() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

export async function POST(request: Request) {
  // Server-only, deliberately NOT NEXT_PUBLIC_*: the API key signs the payment
  // HMAC, and a NEXT_PUBLIC_ prefix would inline it into the browser bundle
  // where anyone could lift it and forge signed requests for this merchant.
  const merchantId = process.env.ABA_MERCHANT_ID;
  const apiKey = process.env.ABA_API_KEY;

  if (!merchantId || !apiKey) {
    return Response.json(
      { success: false, error: "ABA PayWay is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const amount = Number(body.amount);
  const itemName = typeof body.itemName === "string" ? body.itemName : "BookLan ticket";
  const firstname = typeof body.firstname === "string" && body.firstname ? body.firstname : "BookLan";
  const lastname = typeof body.lastname === "string" && body.lastname ? body.lastname : "Passenger";
  const phone = typeof body.phone === "string" && body.phone ? body.phone.replace(/\D/g, "") : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ success: false, error: "Invalid amount." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const tranId = `BL${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const req_time = reqTime();
  const amountStr = amount.toFixed(2);
  const items = Buffer.from(
    JSON.stringify([{ name: itemName, quantity: 1, price: amountStr }])
  ).toString("base64");

  const fields: Record<string, string> = {
    req_time,
    merchant_id: merchantId,
    tran_id: tranId,
    amount: amountStr,
    items,
    shipping: "0",
    firstname,
    lastname,
    email: phone ? `${phone}@booklan.app` : "passenger@booklan.app",
    phone,
    type: "purchase",
    payment_option: "",
    return_url: `${origin}/booking`,
    cancel_url: `${origin}/booking`,
    continue_success_url: `${origin}/booking`,
    return_deeplink: "",
    currency: "USD",
    custom_fields: "",
    return_params: "",
  };

  const hashString = Object.values(fields).join("");
  const hash = createHmac("sha512", apiKey).update(hashString).digest("base64");

  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append("hash", hash);

  try {
    const response = await fetch(PURCHASE_URL, {
      method: "POST",
      body: form,
      redirect: "manual",
    });

    if (response.status !== 200) {
      return Response.json(
        { success: false, error: `ABA PayWay declined the request (status ${response.status}).` },
        { status: 502 }
      );
    }

    const data = await response.json();
    if (!data.qrString) {
      return Response.json(
        { success: false, error: data?.status?.message ?? "Payment could not be initiated." },
        { status: 502 }
      );
    }

    return Response.json({ success: true, tranId });
  } catch {
    return Response.json(
      { success: false, error: "Could not reach ABA PayWay. Please try again." },
      { status: 502 }
    );
  }
}
