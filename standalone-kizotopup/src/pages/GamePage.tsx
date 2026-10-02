import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useListGames, useListProducts, useValidatePlayer, useCreateOrder, type Product } from "@/lib/api-client-react";
import { z } from "zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Loader2,
  X, AlertTriangle, CreditCard, PackageOpen, Zap, Flame, LayoutGrid,
} from "lucide-react";
import {
  formatCurrency,
  generateGamePlaceholder,
  parseMobileLegendsPlayerInput,
} from "@/lib/utils/game-helpers";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { notifyTelegramSupporter } from "@/components/layout/TelegramContactLink";
import { apiUrl } from "@/lib/api";
const bakongKhqrLogo = "/khqr-logo.png";
const PRODUCTS_PER_PAGE = 20;

function getOrderFailureDetail(error: unknown): string {
  if (!(error instanceof Error)) return "";

  const detail = error.message.replace(/^HTTP \d{3} [^:]+:\s*/, "").trim();
  // Do not show raw HTML (for example, a proxy-generated error page) or
  // unexpectedly large response bodies in the customer-facing supporter UI.
  if (!detail || detail.startsWith("<") || detail.length > 180) return "";
  return detail;
}

const checkoutSchema = z.object({
  productCode: z.string().min(1, "Select a package"),
  playerId:    z.string().min(3, "Player ID is required"),
  serverId:    z.string().optional(),
});
type CheckoutValues = z.infer<typeof checkoutSchema>;

interface PromoResult {
  valid: boolean; code: string;
  discountType: "percent" | "fixed"; discountValue: number;
  discountUsd: number; finalAmountUsd: number;
}

export default function GamePage() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const [, setLocation] = useLocation();

  const { data: games } = useListGames();
  const game = games?.find((g) => g.gameCode === gameCode);
  const requiresZoneId = game?.requiresZoneId ?? false;
  const serverFieldLabel = game?.serverFieldLabel ?? "Zone / Server ID";
  const serverOptions = game?.serverOptions ?? [];

  const { data: products, isLoading: loadingProducts } = useListProducts(gameCode, {
    query: { queryKey: ["products", gameCode], enabled: !!gameCode },
  });

  const createOrder = useCreateOrder();
  const validatePlayer = useValidatePlayer();

  const [promoInput, setPromoInput]     = useState("");
  const [promoResult, setPromoResult]   = useState<PromoResult | null>(null);
  const [promoError, setPromoError]     = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError]     = useState(false);
  const [packageError, setPackageError] = useState(false);
  const [playerValidationError, setPlayerValidationError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [playerUsername, setPlayerUsername] = useState<string | null>(null);
  const [playerCheckCompleted, setPlayerCheckCompleted] = useState(false);
  const [playerLookupLoading, setPlayerLookupLoading] = useState(false);
  const [failedProductImages, setFailedProductImages] = useState<Set<string>>(new Set());
  const [productPage, setProductPage] = useState(0);
  const playerLookupRequestId = useRef(0);
  const playerLookupInFlight = useRef(false);
  const validatedPlayerKey = useRef<string | null>(null);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    shouldFocusError: false,
    defaultValues: { productCode: "", playerId: "", serverId: "" },
  });

  const selectedCode    = form.watch("productCode");
  const playerId        = form.watch("playerId");
  const serverId        = form.watch("serverId");
  const selectedProduct = products?.find((p) => p.productCode === selectedCode);
  const prioritizedProducts = useMemo(() => {
    if (!products) return [];
    return [
      ...products.filter((product) => product.catalogLabel === "BEST SELLING"),
      ...products.filter((product) => product.catalogLabel !== "BEST SELLING"),
    ];
  }, [products]);
  const totalProductPages = Math.max(1, Math.ceil(prioritizedProducts.length / PRODUCTS_PER_PAGE));
  const visibleProducts = prioritizedProducts.slice(
    productPage * PRODUCTS_PER_PAGE,
    (productPage + 1) * PRODUCTS_PER_PAGE,
  );
  const isMlbb =
    gameCode?.toLowerCase() === "mlbb" ||
    game?.name?.toLowerCase().includes("mobile legends");
  const lookupSupported =
    game?.supportsPlayerCheck ?? false;
  const needsServerId = isMlbb || requiresZoneId;
  const bestSellingProducts = visibleProducts.filter((product) => product.catalogLabel === "BEST SELLING");
  const generalProducts = visibleProducts.filter((product) => product.catalogLabel !== "BEST SELLING");

  const renderProductCard = (product: Product) => {
    const sel = selectedCode === product.productCode;
    const productImage = product.imageUrl;
    const showProductImage = Boolean(productImage) && !failedProductImages.has(product.productCode);
    const displayName = isMlbb && /^\d[\d,]*$/.test(product.name.trim())
      ? `${product.name} Diamonds`
      : product.name;

    return (
      <motion.div
        key={product.productCode}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setPackageError(false);
          form.setValue("productCode", product.productCode, { shouldValidate: true });
        }}
        className={`relative cursor-pointer rounded-xl border p-2 sm:p-2.5 flex items-center gap-2.5 min-h-[68px] transition-all duration-200 ${
          sel ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
              : "border-white/8 bg-background/60 hover:border-primary/40"
        }`}
        data-testid={`package-${product.productCode}`}
      >
        {sel && (
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center z-10">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        )}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:h-10 sm:w-10 ${
          sel ? "border-primary/35 bg-primary/15" : "border-primary/20 bg-primary/5"
        }`}>
          {showProductImage ? (
            <img
              src={productImage}
              alt=""
              aria-hidden="true"
              onError={() => {
                setFailedProductImages((current) => {
                  const next = new Set(current);
                  next.add(product.productCode);
                  return next;
                });
              }}
              className="h-6 w-6 object-contain sm:h-7 sm:w-7"
            />
          ) : (
            <PackageOpen className="h-4 w-4 text-primary/80" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`block font-display font-bold text-xs sm:text-sm leading-tight ${
            sel ? "text-primary" : "text-white/72"
          }`}>
            {displayName}
          </span>
          <span className="mt-0.5 block font-display font-bold text-sm leading-none text-white/90 sm:text-base">
            {formatCurrency(product.price)}
          </span>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setProductPage(0);
  }, [gameCode]);

  useEffect(() => { setPromoResult(null); setPromoError(""); }, [selectedCode]);

  useEffect(() => {
    if (productPage >= totalProductPages) {
      setProductPage(totalProductPages - 1);
    }
  }, [productPage, totalProductPages]);

  const invalidatePlayerCheck = () => {
    validatedPlayerKey.current = null;
    ++playerLookupRequestId.current;
    setPlayerUsername(null);
    setPlayerCheckCompleted(false);
    setPlayerValidationError("");
  };

  const announcePlayerNotFound = () => {
    notifyTelegramSupporter("ឈ្មោះគណនីមិនមាន");
  };

  const checkPlayerId = async () => {
    const trimmedPlayerId = playerId?.trim() ?? "";
    const trimmedServerId = serverId?.trim() ?? "";

    if (playerLookupInFlight.current) return;
    if (trimmedPlayerId.length < 3) {
      setPlayerValidationError("");
      notifyTelegramSupporter("សូមបញ្ចូលលេខ ID របស់បង");
      return;
    }
    if (needsServerId && !trimmedServerId) {
      setPlayerValidationError("");
      notifyTelegramSupporter("សូមបញ្ចូលលេខ Server ID  របស់បង");
      return;
    }

    if (!lookupSupported || !gameCode) return;

    const lookupKey = `${gameCode}:${trimmedPlayerId}:${trimmedServerId}`;
    if (validatedPlayerKey.current === lookupKey && playerCheckCompleted) return;

    const requestId = ++playerLookupRequestId.current;
    playerLookupInFlight.current = true;
    setPlayerLookupLoading(true);
    setPlayerValidationError("");
    setPlayerUsername(null);
    setPlayerCheckCompleted(false);

    try {
      const result = await validatePlayer.mutateAsync({
        gameCode,
        data: { playerId: trimmedPlayerId, serverId: trimmedServerId },
      });
      if (requestId !== playerLookupRequestId.current) return;
      setPlayerUsername(result.username ?? null);
      setPlayerCheckCompleted(result.valid);
      if (result.valid) validatedPlayerKey.current = lookupKey;
      if (result.valid) {
        notifyTelegramSupporter(`ឈ្មោះគណនី: ${result.username?.trim() || trimmedPlayerId}`);
      }
      if (!result.valid) {
        setPlayerValidationError("ID not found");
        announcePlayerNotFound();
      }
    } catch (error) {
      if (requestId !== playerLookupRequestId.current) return;
      const isNotFound = error instanceof Error && /HTTP 422|not found|unknown player|invalid player/i.test(error.message);
      setPlayerValidationError(
        isNotFound
          ? "ID not found"
          : error instanceof Error ? error.message.replace(/^HTTP \d+ [^:]+:\s*/, "") : "Unable to find this player",
      );
      if (isNotFound) announcePlayerNotFound();
    } finally {
      playerLookupInFlight.current = false;
      setPlayerLookupLoading(false);
    }
  };

  const validatePromo = async () => {
    if (!promoInput.trim()) {
      notifyTelegramSupporter("សូមបញ្ចូលកូដបញ្ចុះតម្លៃ");
      return;
    }
    if (!selectedProduct) {
      const message = "សូមជ្រើសរើសកញ្ចប់មុនពេលប្រើកូដបញ្ចុះតម្លៃ";
      setPromoError("Select a package before applying a coupon");
      notifyTelegramSupporter(message);
      return;
    }

    const orderAmountUsd = Number.parseFloat(selectedProduct.price);
    if (!Number.isFinite(orderAmountUsd)) {
      const message = "សូមជ្រើសរើសកញ្ចប់ដែលត្រឹមត្រូវមុនពេលប្រើកូដបញ្ចុះតម្លៃ";
      setPromoError("Select a valid package before applying a coupon");
      notifyTelegramSupporter(message);
      return;
    }

    setPromoLoading(true); setPromoError(""); setPromoResult(null);
    try {
      const res  = await fetch(apiUrl("/api/promos/validate"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), orderAmountUsd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error ?? "Invalid promo code";
        setPromoError(message);
        notifyTelegramSupporter(
          message === "Invalid promo code" ? "កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ" : message,
        );
      } else if (!data.valid) {
        const message = data.error ?? "Invalid promo code";
        setPromoError(message);
        notifyTelegramSupporter(
          message === "Invalid promo code" ? "កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ" : message,
        );
      } else {
        setPromoResult(data);
        notifyTelegramSupporter(`បានប្រើកូដ ${data.code} ដោយជោគជ័យ`);
      }
    } catch {
      setPromoError("Failed to validate");
      notifyTelegramSupporter("មិនអាចពិនិត្យកូដបញ្ចុះតម្លៃបានទេ");
    }
    finally { setPromoLoading(false); }
  };

  const clearPromo = () => { setPromoInput(""); setPromoResult(null); setPromoError(""); };
  const clearSelectedProduct = () => {
    form.setValue("productCode", "", { shouldValidate: true });
    setPackageError(false);
    setTermsError(false);
    clearPromo();
  };

  const promptTermsAgreement = () => {
    setTermsError(true);
    notifyTelegramSupporter("សូមយល់ព្រមតាមលក្ខខណ្ឌ");
    document.querySelector<HTMLElement>("[data-validation-target='terms']")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const promptAccountField = (field: "playerId" | "serverId") => {
    notifyTelegramSupporter(
      field === "playerId"
        ? "សូមបញ្ចូលលេខ ID របស់បង"
        : "សូមបញ្ចូលលេខ Server ID  របស់បង",
    );
    const selector = field === "playerId"
      ? 'input[name="playerId"]'
      : "[data-validation-target='serverId']";
    document.querySelector<HTMLElement>(selector)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const promptPlayerCheck = () => {
    setPlayerValidationError("Please check your player ID before continuing.");
    document.querySelector<HTMLElement>("[data-validation-target='playerCheck']")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const promptPackageSelection = () => {
    setPackageError(true);
    notifyTelegramSupporter("សូមជ្រើសរើសកញ្ចប់មួយ");
    document.querySelector<HTMLElement>("[data-validation-target='package']")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onSubmit = async (data: CheckoutValues) => {
    setOrderError("");
    if (!data.playerId.trim()) {
      promptAccountField("playerId");
      return;
    }
    if (requiresZoneId && !data.serverId?.trim()) {
      promptAccountField("serverId");
      return;
    }
    if (!agreedToTerms) { promptTermsAgreement(); return; }
    if (!gameCode) return;

    setPlayerValidationError("");
    try {
      if (lookupSupported) {
        const validationKey = `${gameCode}:${data.playerId.trim()}:${data.serverId?.trim() ?? ""}`;
        if (validatedPlayerKey.current !== validationKey || !playerCheckCompleted) {
          promptPlayerCheck();
          return;
        }
      } else {
        const validationKey = `${gameCode}:${data.playerId.trim()}:${data.serverId?.trim() ?? ""}`;
        const validation = await validatePlayer.mutateAsync({
          gameCode,
          data: {
            playerId: data.playerId.trim(),
            serverId: data.serverId?.trim() || null,
          },
        });
        setPlayerUsername(validation.username ?? null);
        setPlayerCheckCompleted(validation.valid);
        if (validation.valid) validatedPlayerKey.current = validationKey;
        if (validation.valid) {
          notifyTelegramSupporter(`ឈ្មោះគណនី: ${validation.username?.trim() || data.playerId.trim()}`);
        }
        if (!validation.valid) {
          setPlayerValidationError("ID not found");
          announcePlayerNotFound();
          return;
        }
      }
    } catch (error) {
      const isNotFound = error instanceof Error && /HTTP 422|not found|unknown player|invalid player/i.test(error.message);
      setPlayerValidationError(
        isNotFound
          ? "ID not found"
          : error instanceof Error ? error.message.replace(/^HTTP \d+ [^:]+:\s*/, "") : "Unable to validate player details",
      );
      if (isNotFound) announcePlayerNotFound();
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        data: {
          gameCode,
          ...data,
          playerId: data.playerId.trim(),
          serverId: data.serverId?.trim() || null,
          currency: "USD",
          ...(promoResult ? { promoCode: promoResult.code } : {}),
        },
      });
      setLocation(`/order/${order.id}`);
    } catch (error) {
      console.error("Failed to create payment order", error);
      const detail = getOrderFailureDetail(error);
      setOrderError(
        detail
          ? `Payment could not be started: ${detail}`
          : "Payment could not be started. Please try again or contact support.",
      );
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<CheckoutValues>) => {
    if (errors.playerId) {
      promptAccountField("playerId");
    } else if (requiresZoneId && !serverId?.trim()) {
      promptAccountField("serverId");
    } else if (errors.productCode || !selectedCode) {
      promptPackageSelection();
    } else if (!agreedToTerms) {
      promptTermsAgreement();
    }
  };

  const basePrice  = selectedProduct ? parseFloat(selectedProduct.price) : 0;
  const finalPrice = promoResult ? promoResult.finalAmountUsd : basePrice;
  const selectedDisplayName = selectedProduct
    ? (isMlbb && /^\d[\d,]*$/.test(selectedProduct.name.trim())
      ? `${selectedProduct.name} Diamonds`
      : selectedProduct.name)
    : "";
  const gameDescription = game?.description?.includes("countries KH BR USA")
    ? "Supports all regions and servers worldwide, including KH, BR, and USA. Not available in SG, MY, PH, RU, or VN. Indonesian users can use mlbb_global."
    : game?.description;

  return (
    <AppLayout floatingSupporterAboveDock={Boolean(selectedProduct)}>
      {/* Product profile hero */}
      <section className="product-hero relative -mx-4 -mt-6 mb-5 w-auto overflow-hidden sm:-mx-6 sm:-mt-8 sm:mb-6 lg:mx-auto lg:mt-0 lg:mb-8 lg:min-h-[280px] lg:max-w-6xl lg:rounded-[1.75rem] lg:border lg:border-white/10 lg:shadow-[0_22px_55px_rgba(0,0,0,0.28)]">
        <div className="product-hero-glow absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        {game?.imageUrl && (
          <div
            className="product-hero-art-backdrop absolute inset-y-0 right-0 w-[52%]"
            style={{ backgroundImage: `url("${game.imageUrl}")` }}
            aria-hidden="true"
          />
        )}
         <div className="relative z-10 p-3 pb-6 max-[639px]:p-3 max-[639px]:pb-5 max-[380px]:p-2.5 sm:p-8 sm:pb-10 lg:p-8 xl:p-10">
           <div className="grid grid-cols-[clamp(92px,25vw,240px)_minmax(0,1fr)] items-center gap-3 max-[639px]:gap-2 max-[380px]:grid-cols-1 max-[380px]:gap-2.5 md:grid-cols-[200px_minmax(0,1fr)] md:gap-9 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
           <div className="flex min-w-0 flex-col items-center gap-3">
             <div className="mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-[1.2rem] border border-white/20 bg-black/30 shadow-[0_18px_35px_rgba(0,0,0,0.45)] max-[639px]:max-w-[112px] max-[380px]:max-w-[96px] max-[380px]:w-[96px] sm:rounded-[1.6rem] md:w-[200px] lg:w-[240px]">
                {game?.imageUrl ? (
                 <img
                   src={game.imageUrl}
                   alt={game?.name}
                   className="h-full w-full object-cover object-center"
                 />
                ) : !game ? (
                  <div
                    className="h-full w-full animate-pulse bg-white/[0.06]"
                    aria-label="Loading game artwork"
                    role="img"
                  />
               ) : (
                 <div className={`h-full w-full bg-gradient-to-br ${generateGamePlaceholder(gameCode)}`} />
               )}
             </div>
             <div className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-2xl bg-black/35 px-2 py-1.5 text-[10px] text-white/90 max-[639px]:gap-1 max-[639px]:px-2 max-[639px]:py-1.5 max-[639px]:text-[9px] sm:gap-2 sm:px-4 sm:py-3 sm:text-sm">
               <Zap className="h-3 w-3 shrink-0 text-primary sm:h-4 sm:w-4" />
               Instant Delivery
             </div>
          </div>

          <div className="min-w-0">
            <h1 className="mt-3 max-w-full break-words font-display text-[clamp(1.1rem,4.7vw,2.75rem)] font-black uppercase leading-[0.95] tracking-tight text-white max-[639px]:mt-2 sm:mt-4">
              {game?.name ?? gameCode}
            </h1>

            <div className="mt-5 flex items-center gap-2 max-[639px]:mt-4 sm:mt-7">
              <span className="h-px w-7 bg-primary/70 max-[639px]:w-5" aria-hidden="true" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 max-[639px]:text-[9px]">
                About this game
              </span>
           </div>
             {gameDescription && (
              <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-white/72 max-[639px]:mt-1.5 max-[639px]:max-h-none max-[639px]:overflow-visible max-[639px]:text-[11px] max-[639px]:leading-5 sm:mt-2.5 sm:text-base sm:leading-6">
                {gameDescription}
              </p>
            )}
          </div>

        </div>
         </div>

      </section>

      {/* Form */}
       <div className="mx-auto max-w-5xl pb-0 lg:mt-2">
        <Form {...form}>
          <form id="game-checkout-form" onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-5">

            {/* 1 — Account Details */}
            <div className="rounded-2xl outline-none">
            <SectionCard step={1} label="Account Details">
              <div className={`grid gap-3 ${needsServerId ? "grid-cols-2" : "grid-cols-1"}`}>
                <FormField control={form.control} name="playerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Player ID <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12345678"
                        className="bg-background/60 border-white/10 h-11 rounded-xl font-medium text-sm focus:border-primary/50"
                         {...field}
                         onChange={(event) => {
                           invalidatePlayerCheck();
                           const value = event.target.value;
                           const parsed = isMlbb ? parseMobileLegendsPlayerInput(value) : null;
                           if (parsed) {
                             field.onChange(parsed.playerId);
                             form.setValue("serverId", parsed.serverId, { shouldDirty: true, shouldValidate: true });
                           } else {
                             field.onChange(value);
                           }
                         }} />
                    </FormControl>
                  </FormItem>
                )} />
                {needsServerId && (
                  <FormField control={form.control} name="serverId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                         {serverFieldLabel} <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        {serverOptions.length > 0 ? (
                          <Select
                            value={field.value || undefined}
                            onValueChange={(value) => {
                               invalidatePlayerCheck();
                              field.onChange(value);
                            }}
                          >
                            <SelectTrigger data-validation-target="serverId" className="bg-background/60 border-white/10 h-11 rounded-xl font-medium text-sm focus:border-primary/50">
                              <SelectValue placeholder={`Select ${serverFieldLabel}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {serverOptions.map((option) => (
                                <SelectItem key={`${option.value}-${option.label}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input placeholder="e.g. 1234" data-validation-target="serverId"
                            className="bg-background/60 border-white/10 h-11 rounded-xl font-medium text-sm focus:border-primary/50"
                             {...field} value={field.value || ""}
                              onChange={(event) => { invalidatePlayerCheck(); field.onChange(event); }} />
                        )}
                      </FormControl>
                    </FormItem>
                  )} />
                )}
              </div>
               {lookupSupported && !playerCheckCompleted && (
                 <button
                   data-validation-target="playerCheck"
                   type="button"
                   onClick={() => void checkPlayerId()}
                   disabled={playerLookupLoading || !playerId?.trim() || (needsServerId && !serverId?.trim())}
                   className="focus-ring mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/60 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                 >
                   {playerLookupLoading
                     ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking ID…</>
                     : <><CheckCircle2 className="h-4 w-4" /> Check ID</>}
                 </button>
               )}
              {playerValidationError && (
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {playerValidationError}
                </p>
              )}
               {playerUsername && !playerLookupLoading && !playerValidationError && (
                  <p className="mt-2 flex min-w-0 items-center gap-2 text-xs">
                    <span className="shrink-0 text-teal-300">Username:</span>
                    <strong className="truncate text-white">{playerUsername}</strong>
                 </p>
              )}
               {playerCheckCompleted && !playerUsername && !playerLookupLoading && !playerValidationError && lookupSupported && (
                  <p className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-emerald-300">Player ID:</span>
                    <strong className="text-white">Ready for top-up</strong>
                 </p>
              )}
            </SectionCard>
            </div>

            {/* 2 — Select Package */}
            <div data-validation-target="package" className={`outline-none ${packageError ? "animate-pulse rounded-2xl" : ""}`}>
            <SectionCard step={2} label="Select Package">
              {loadingProducts ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl bg-white/5" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {bestSellingProducts.length > 0 && (
                    <section aria-labelledby="best-selling-packages">
                      <div className="mb-3 flex items-center gap-2.5 border-b border-white/10 px-1 pb-2 text-primary">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                          <Flame className="h-3.5 w-3.5 fill-current" />
                        </span>
                        <h3 id="best-selling-packages" className="font-display text-sm font-bold tracking-[0.08em]">
                          Best Selling
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                        {bestSellingProducts.map(renderProductCard)}
                      </div>
                    </section>
                  )}

                  {generalProducts.length > 0 && (
                    <section aria-labelledby="general-packages">
                      <div className="mb-3 flex items-center gap-2.5 border-b border-white/10 px-1 pb-2 text-accent">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </span>
                        <h3 id="general-packages" className="font-display text-sm font-bold tracking-[0.08em]">
                          General
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                        {generalProducts.map(renderProductCard)}
                      </div>
                    </section>
                  )}
                </div>
              )}
              {!loadingProducts && totalProductPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProductPage((page) => Math.max(0, page - 1))}
                    disabled={productPage === 0}
                    aria-label="Previous packages"
                    className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-20 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {productPage + 1} / {totalProductPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductPage((page) => Math.min(totalProductPages - 1, page + 1))}
                    disabled={productPage === totalProductPages - 1}
                    aria-label="Next packages"
                    className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </SectionCard>
            </div>

            {/* 3 — Apply Coupon */}
            <SectionCard step={3} label="Apply Coupon">
              {promoResult ? (
                <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-emerald-400 uppercase">{promoResult.code}</p>
                    <p className="text-[11px] text-emerald-400/70 mt-0.5">
                      {promoResult.discountType === "percent" ? `${promoResult.discountValue}% off` : `$${promoResult.discountValue} off`}
                      {" "}— saving {formatCurrency(String(promoResult.discountUsd))}
                    </p>
                  </div>
                  <button type="button" onClick={clearPromo} className="text-emerald-400/50 hover:text-emerald-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                 <div className="flex gap-2.5">
                  <Input
                    placeholder="Enter Coupon Code"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), validatePromo())}
                      className="bg-background/60 border-white/10 h-11 rounded-xl font-medium text-sm flex-1 focus:border-primary/50"
                    style={{ textTransform: "uppercase" }}
                  />
                  <button
                    type="button"
                    onClick={validatePromo}
                    disabled={!promoInput.trim() || promoLoading}
                      className="h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors disabled:opacity-40 shrink-0"
                  >
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-3 h-3" /> {promoError}
                </p>
              )}
            </SectionCard>

            {/* 4 — Payment Methods */}
            <div className="outline-none">
            <SectionCard step={4} label="Payment Methods">
               <div className="space-y-2">
                 <div className="flex w-full items-center gap-2.5 rounded-xl border border-primary/60 bg-primary/10 p-2.5 shadow-sm shadow-primary/10">
                    <img src="/aba-khqr.webp" alt="ABA KHQR" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">ABA KHQR</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">Scan to pay with any banking App</p>
                  </div>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </span>
                </div>
                 <div
                   aria-disabled="true"
                     className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-background/40 p-2.5 opacity-70"
                 >
                   <img
                     src={bakongKhqrLogo}
                     alt="Bakong KHQR"
                       className="h-9 w-9 shrink-0 rounded-xl object-cover"
                   />
                   <div className="min-w-0 flex-1">
                       <p className="text-sm font-bold text-white">BAKONG KHQR</p>
                       <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                       Coming Soon
                     </p>
                   </div>
                 </div>
              </div>

              {/* Terms */}
              <button
                data-validation-target="terms"
                type="button"
                onClick={() => { setAgreedToTerms((v) => !v); setTermsError(false); }}
                aria-pressed={agreedToTerms}
                aria-invalid={termsError}
                 className={`flex items-center gap-2.5 mt-2.5 group w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/70 rounded-xl ${termsError ? "animate-pulse" : ""}`}
              >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  agreedToTerms ? "bg-primary border-primary" : "border-white/20 bg-white/5"
                }`}>
                   {agreedToTerms && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </div>
                  <span className="text-sm font-medium text-muted-foreground">
                  I agree{" "}
                  <span className="text-primary font-bold">Terms and Conditions</span>
                </span>
              </button>
            </SectionCard>
            </div>

          </form>
        </Form>
      </div>

      {/* Sticky order summary — only shown after a package is selected */}
      {selectedProduct && (
        <div className="checkout-summary-dock fixed inset-x-0 bottom-0 z-[100] p-0">
          <div className="checkout-summary-panel w-full max-w-none rounded-t-3xl rounded-b-none border border-primary/25 border-b-0 px-3 py-2.5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                {selectedProduct.imageUrl && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 sm:h-11 sm:w-11">
                    <img src={selectedProduct.imageUrl} alt="" aria-hidden="true" className="h-6 w-6 object-contain sm:h-8 sm:w-8" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white sm:text-base">{selectedDisplayName}</p>
                  <p className="text-xs text-muted-foreground">Total:</p>
                </div>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={finalPrice}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 font-display text-xl font-black text-white sm:text-2xl"
                >
                  {formatCurrency(String(finalPrice))}
                </motion.p>
              </AnimatePresence>
            </div>

            {playerCheckCompleted && playerUsername && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-300">Username:</span>
                <strong className="min-w-0 truncate text-white">{playerUsername}</strong>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-label="Verified" />
              </div>
            )}

            {orderError && (
              <p
                role="alert"
                className="mt-2 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-left text-xs font-semibold leading-relaxed text-red-200"
                data-testid="order-error"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{orderError}</span>
              </p>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-2.5 sm:gap-3">
              <button
                type="button"
                onClick={clearSelectedProduct}
                className="focus-ring flex h-10 items-center justify-center rounded-xl border border-white/10 bg-card px-3 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:h-11 sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="game-checkout-form"
                disabled={createOrder.isPending || validatePlayer.isPending}
                className="focus-ring flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/70 bg-primary px-3 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-base"
                data-testid="btn-submit-order"
              >
                {validatePlayer.isPending || createOrder.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Pay Now</>
                  : <><CreditCard className="h-4 w-4" /> Pay Now</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function SectionCard({ step, label, children }: { step: number; label: string; children: React.ReactNode }) {
  return (
        <div className="surface space-y-3 rounded-2xl p-3 sm:space-y-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/30">
           <span className="font-black text-xs text-white">{step}</span>
        </div>
          <span className="font-display text-sm font-bold text-white">{label}</span>
      </div>
      {children}
    </div>
  );
}
