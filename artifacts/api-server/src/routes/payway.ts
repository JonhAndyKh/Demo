import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CheckPaywayPaymentBody,
  CheckPaywayPaymentResponse,
  StartCoffeePaywayCheckoutResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const PAYWAY_BASE_URL = "https://payway.jlastore.com";
const PAYWAY_PAYMENT_LINK_HOST = "link.payway.com.kh";
const SAMPLE_PAYMENT_LINK_PATH = "ABAPAYhj455002v";
const COFFEE_AMOUNT = "1.00";
const TRANSACTION_ID_PATTERN = /^coffee_[a-f0-9]{32}$/i;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMerchantPaymentLink(): string | null {
  const configuredLink = process.env.PAYWAY_ABA_DATA;
  if (!configuredLink) return null;

  try {
    const url = new URL(configuredLink);
    if (
      url.protocol !== "https:" ||
      url.hostname !== PAYWAY_PAYMENT_LINK_HOST ||
      url.pathname === "/" ||
      url.pathname.toLowerCase().includes(SAMPLE_PAYMENT_LINK_PATH.toLowerCase())
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function getQrString(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096) {
    return null;
  }
  return value;
}

function readString(record: JsonRecord | undefined, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value.toLowerCase() : "";
}

function normalizePaymentStatus(payload: unknown): {
  status: "approved" | "pending" | "declined" | "cancelled" | "expired" | "unknown";
  message: string;
} {
  const root = isRecord(payload) ? payload : {};
  const topStatus = isRecord(root.status) ? root.status : undefined;
  const data = isRecord(root.data) ? root.data : undefined;
  const statusText =
    readString(topStatus, "message") ||
    (typeof root.status === "string" ? root.status.toLowerCase() : "");
  const actionText = readString(data, "action");
  const combined = `${statusText} ${actionText}`.trim();

  if (combined.includes("approved")) {
    return { status: "approved", message: "Payment approved." };
  }
  if (combined.includes("cancelled") || combined.includes("canceled")) {
    return { status: "cancelled", message: "Payment was cancelled." };
  }
  if (combined.includes("expired")) {
    return { status: "expired", message: "Payment session expired." };
  }
  if (
    combined.includes("declined") ||
    combined.includes("failed") ||
    combined.includes("rejected")
  ) {
    return { status: "declined", message: "Payment was not approved." };
  }
  if (
    combined.includes("pending") ||
    combined.includes("processing") ||
    combined.includes("waiting")
  ) {
    return { status: "pending", message: "Waiting for payment confirmation." };
  }
  return { status: "unknown", message: "Payment status is not confirmed yet." };
}

router.post("/payway/checkout", async (req, res) => {
  const abaData = getMerchantPaymentLink();
  if (!abaData) {
    return res.status(503).json({
      error: "A valid ABA PayWay merchant payment link is not configured.",
    });
  }

  const tranId = `coffee_${randomUUID().replaceAll("-", "")}`;

  try {
    const response = await fetch(`${PAYWAY_BASE_URL}/api/create-tran`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: COFFEE_AMOUNT,
        aba_data: abaData,
        tran_id: tranId,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const payload: unknown = await response.json();
    if (!response.ok || !isRecord(payload) || payload.success !== true) {
      req.log.warn(
        { providerStatus: response.status },
        "PayWay did not create a coffee checkout",
      );
      return res.status(502).json({ error: "PayWay could not start checkout." });
    }

    const providerData = isRecord(payload.data) ? payload.data : undefined;
    const qrString = getQrString(providerData?.qr_string);
    if (!qrString) {
      req.log.warn("PayWay did not return a valid QR payload");
      return res.status(502).json({ error: "PayWay did not return a payment QR." });
    }

    const result = StartCoffeePaywayCheckoutResponse.parse({
      success: true,
      tran_id: tranId,
      qr_string: qrString,
      amount: COFFEE_AMOUNT,
    });
    return res.status(201).json(result);
  } catch (error) {
    req.log.error({ err: error }, "PayWay checkout request failed");
    return res.status(502).json({ error: "PayWay checkout is temporarily unavailable." });
  }
});

router.post("/payway/status", async (req, res) => {
  const parsedInput = CheckPaywayPaymentBody.safeParse(req.body);
  if (!parsedInput.success || !TRANSACTION_ID_PATTERN.test(parsedInput.data.tran_id)) {
    return res.status(400).json({ error: "Invalid coffee transaction reference." });
  }

  try {
    const response = await fetch(`${PAYWAY_BASE_URL}/api/check-payment-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tran_id: parsedInput.data.tran_id }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      req.log.warn(
        { providerStatus: response.status },
        "PayWay status check failed",
      );
      return res.status(502).json({ error: "Could not check payment status." });
    }

    const payload: unknown = await response.json();
    const normalized = normalizePaymentStatus(payload);
    const result = CheckPaywayPaymentResponse.parse({
      tran_id: parsedInput.data.tran_id,
      ...normalized,
    });
    return res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "PayWay status request failed");
    return res.status(502).json({ error: "Payment status is temporarily unavailable." });
  }
});

export default router;