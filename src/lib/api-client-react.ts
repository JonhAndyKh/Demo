import { useMutation, useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export interface Game {
  gameCode: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  isPinned?: boolean;
  sortOrder?: number;
  requiresZoneId?: boolean;
  serverFieldLabel?: string;
  serverOptions?: Array<{ label: string; value: string }>;
  supportsPlayerCheck?: boolean;
}

export interface Product {
  productCode: string;
  name: string;
  price: string;
  imageUrl?: string;
  catalogLabel?: string;
}

export interface PlayerValidationInput {
  playerId: string;
  serverId?: string | null;
}

export interface PlayerValidation {
  valid: boolean;
  gameCode: string;
  playerId: string;
  serverId: string | null;
  username: string | null;
  verified: boolean;
  message: string;
}

export interface OrderInput {
  gameCode: string;
  productCode: string;
  playerId: string;
  serverId?: string | null;
  currency?: "USD";
  promoCode?: string;
}

export interface Order {
  id: string;
  gameCode: string;
  gameName: string;
  productCode: string;
  productName: string;
  playerIdMasked: string;
  serverIdMasked?: string | null;
  currency: string;
  amountUsd: string;
  paymentStatus: string;
  orderStatus: string;
  qrString?: string | null;
  qrLink?: string | null;
  checkoutLink?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

type QueryConfig = { query?: Record<string, unknown> };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  const requestInit: RequestInit = {
    ...init,
    signal: init?.signal ?? controller.signal,
  };

  let response: Response;
  try {
    response = await fetch(apiUrl(url), requestInit);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request timed out. Please check your connection and try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { error?: string; message?: string })?.error ??
          (payload as { message?: string })?.message ??
          response.statusText;
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${message}`);
  }

  return payload as T;
}

export function useListGames(options?: QueryConfig) {
  return useQuery({
    queryKey: ["/api/games"],
    queryFn: () => request<Game[]>("/api/games"),
    ...(options?.query ?? {}),
  });
}

export function useListProducts(gameCode: string, options?: QueryConfig) {
  return useQuery({
    queryKey: ["/api/games", gameCode, "products"],
    queryFn: () => request<Product[]>(`/api/games/${gameCode}/products`),
    enabled: Boolean(gameCode),
    ...(options?.query ?? {}),
  });
}

export function useValidatePlayer() {
  return useMutation({
    mutationKey: ["validatePlayer"],
    mutationFn: ({
      gameCode,
      data,
    }: {
      gameCode: string;
      data: PlayerValidationInput;
    }) =>
      request<PlayerValidation>(`/api/games/${gameCode}/validate-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationKey: ["createOrder"],
    mutationFn: ({ data }: { data: OrderInput }) =>
      request<Order>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function getGetOrderQueryKey(orderId: string) {
  return [`/api/orders/${orderId}`] as const;
}

export function useGetOrder(orderId: string, options?: QueryConfig) {
  return useQuery({
    queryKey: getGetOrderQueryKey(orderId),
    queryFn: () => request<Order>(`/api/orders/${orderId}`),
    enabled: Boolean(orderId),
    ...(options?.query ?? {}),
  });
}