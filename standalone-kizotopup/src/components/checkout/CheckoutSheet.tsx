import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useListProducts,
  useValidatePlayer,
  useCreateOrder,
} from "@/lib/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, Zap, Check, ShieldCheck, ChevronRight, Tag, X, CheckCircle2 } from "lucide-react";
import {
  formatCurrency,
  parseMobileLegendsPlayerInput,
} from "@/lib/utils/game-helpers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";

const checkoutSchema = z.object({
  productCode: z.string().min(1, "Select a package"),
  playerId: z.string().min(3, "Player ID is required"),
  serverId: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

interface PromoResult {
  valid: boolean;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountUsd: number;
  finalAmountUsd: number;
}

interface CheckoutSheetProps {
  gameCode: string | null;
  requiresZoneId?: boolean;
  serverFieldLabel?: string;
  serverOptions?: Array<{ label: string; value: string }>;
  supportsPlayerCheck?: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutSheet({
  gameCode,
  requiresZoneId = false,
  serverFieldLabel = "Zone / Server ID",
  serverOptions = [],
  supportsPlayerCheck = false,
  onOpenChange,
}: CheckoutSheetProps) {
  const [, setLocation] = useLocation();
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [playerValidationError, setPlayerValidationError] = useState("");
  const [playerUsername, setPlayerUsername] = useState<string | null>(null);
  const [playerCheckCompleted, setPlayerCheckCompleted] = useState(false);
  const [playerLookupLoading, setPlayerLookupLoading] = useState(false);
  const playerLookupRequestId = useRef(0);
  const playerLookupInFlight = useRef(false);
  const validatedPlayerKey = useRef<string | null>(null);

  const { data: products, isLoading: isLoadingProducts, error: productsError } = useListProducts(
    gameCode ?? "",
    { query: { queryKey: ["products", gameCode], enabled: !!gameCode } }
  );

  const createOrder = useCreateOrder();
  const validatePlayer = useValidatePlayer();

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      productCode: "",
      playerId: "",
      serverId: "",
    },
  });

  const selectedProductCode = form.watch("productCode");
  const playerId = form.watch("playerId");
  const serverId = form.watch("serverId");
  const selectedProduct = products?.find((p) => p.productCode === selectedProductCode);

  useEffect(() => {
    setPromoResult(null);
    setPromoError("");
  }, [selectedProductCode]);

  const normalizedGameCode = gameCode?.toLowerCase() ?? "";
  const isMlbb = normalizedGameCode === "mlbb" || normalizedGameCode === "mlbb_special";
  const lookupSupported = supportsPlayerCheck;
  const needsServerId = isMlbb || requiresZoneId;

  const invalidatePlayerCheck = () => {
    validatedPlayerKey.current = null;
    ++playerLookupRequestId.current;
    setPlayerUsername(null);
    setPlayerCheckCompleted(false);
    setPlayerValidationError("");
  };

  const checkPlayerId = async () => {
    const trimmedPlayerId = playerId?.trim() ?? "";
    const trimmedServerId = serverId?.trim() ?? "";

    if (playerLookupInFlight.current) return;
    if (trimmedPlayerId.length < 3) {
      setPlayerValidationError("Please enter your Player ID first");
      return;
    }
    if (needsServerId && !trimmedServerId) {
      setPlayerValidationError(`Please enter your ${serverFieldLabel} first`);
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
      if (!result.valid) setPlayerValidationError("ID not found");
    } catch (error) {
      if (requestId !== playerLookupRequestId.current) return;
      setPlayerValidationError(
        error instanceof Error && /HTTP 422|not found|unknown player|invalid player/i.test(error.message)
          ? "ID not found"
          : error instanceof Error ? error.message.replace(/^HTTP \d+ [^:]+:\s*/, "") : "Unable to find this player",
      );
    } finally {
      playerLookupInFlight.current = false;
      setPlayerLookupLoading(false);
    }
  };

  const validatePromo = async () => {
    if (!promoInput.trim() || !selectedProduct) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const res = await fetch(apiUrl("/api/promos/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          orderAmountUsd: parseFloat(selectedProduct.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? "Invalid promo code");
      } else {
        setPromoResult(data);
      }
    } catch {
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const clearPromo = () => {
    setPromoInput("");
    setPromoResult(null);
    setPromoError("");
  };

  const onSubmit = async (data: CheckoutValues) => {
    if (!gameCode) return;

    setPlayerValidationError("");
    try {
      if (lookupSupported) {
        const validationKey = `${gameCode}:${data.playerId.trim()}:${data.serverId?.trim() ?? ""}`;
        if (validatedPlayerKey.current !== validationKey || !playerCheckCompleted) {
          setPlayerValidationError("Please click Check ID before continuing");
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
        if (!validation.valid) {
          setPlayerValidationError("ID not found");
          return;
        }
      }
    } catch (error) {
      setPlayerValidationError(
        error instanceof Error && /HTTP 422|not found|unknown player|invalid player/i.test(error.message)
          ? "ID not found"
          : error instanceof Error ? error.message.replace(/^HTTP \d+ [^:]+:\s*/, "") : "Unable to validate player details",
      );
      return;
    }

    createOrder.mutate(
      {
        data: {
          gameCode,
          ...data,
          playerId: data.playerId.trim(),
          serverId: data.serverId?.trim() || null,
          currency: "USD",
          ...(promoResult ? { promoCode: promoResult.code } : {}),
        } as any,
      },
      {
        onSuccess: (order) => {
          onOpenChange(false);
          setLocation(`/order/${order.id}`);
          form.reset();
          clearPromo();
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) { form.reset(); clearPromo(); setPlayerValidationError(""); }
    onOpenChange(open);
  };

  const basePrice = selectedProduct ? parseFloat(selectedProduct.price) : 0;
  const finalPrice = promoResult ? promoResult.finalAmountUsd : basePrice;

  return (
    <Sheet open={!!gameCode} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border shadow-2xl">
        <SheetHeader className="px-6 py-6 border-b border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
          <SheetTitle className="text-xl font-display font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-primary fill-primary" />
            Express Checkout
          </SheetTitle>
          <SheetDescription className="font-medium text-sm text-muted-foreground">
            Instant delivery directly to your account.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6 bg-background">
          {productsError && (
            <Alert variant="destructive" className="mb-6 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-display font-bold">Error</AlertTitle>
              <AlertDescription className="font-medium text-sm">Failed to load packages. Please try again.</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7 pb-24">
              <div className="space-y-3">
                <div className="flex items-center gap-3 font-display font-bold text-xs uppercase tracking-widest text-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</span>
                  Select Package
                </div>
                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {products?.map((product) => {
                      const isSelected = selectedProductCode === product.productCode;
                      return (
                        <div
                          key={product.productCode}
                          onClick={() => form.setValue("productCode", product.productCode, { shouldValidate: true })}
                           className={`relative cursor-pointer p-2.5 rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                          }`}
                          data-testid={`package-${product.productCode}`}
                        >
                          <div className={`font-display font-bold text-sm leading-tight mb-1.5 ${isSelected ? "text-primary" : "text-foreground"}`}>{product.name}</div>
                          <div className="font-bold text-lg text-foreground tracking-tight">{formatCurrency(product.price)}</div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {form.formState.errors.productCode && (
                  <p className="text-xs font-bold text-destructive font-display tracking-wide uppercase mt-1">
                    {form.formState.errors.productCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 font-display font-bold text-xs uppercase tracking-widest text-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</span>
                  Account Details
                </div>
                  <div className={`${needsServerId ? "grid grid-cols-2" : "grid grid-cols-1"} gap-3 bg-card p-4 rounded-xl border border-border shadow-sm`}>
                  <FormField control={form.control} name="playerId" render={({ field }) => (
                     <FormItem className={needsServerId ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                      <FormLabel className="font-display font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Player ID <span className="text-primary">*</span></FormLabel>
                       <FormControl><Input
                         placeholder="e.g. 12345678"
                         className="bg-background border-border font-medium h-11 rounded-md"
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
                         }}
                       /></FormControl>
                      <FormMessage className="font-display text-xs" />
                    </FormItem>
                  )} />
                   {needsServerId && (
                    <FormField control={form.control} name="serverId" render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel className="font-display font-bold uppercase text-[10px] tracking-wider text-muted-foreground">{serverFieldLabel} <span className="text-primary">*</span></FormLabel>
                        <FormControl>
                          {serverOptions.length > 0 ? (
                            <Select
                              value={field.value || undefined}
                              onValueChange={(value) => {
                                invalidatePlayerCheck();
                                field.onChange(value);
                              }}
                            >
                              <SelectTrigger className="bg-background border-border font-medium h-11 rounded-md">
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
                           <Input placeholder="e.g. 1234" className="bg-background border-border font-medium h-11 rounded-md" {...field} value={field.value || ""} onChange={(event) => { invalidatePlayerCheck(); field.onChange(event); }} />
                          )}
                        </FormControl>
                        <FormMessage className="font-display text-xs" />
                      </FormItem>
                    )} />
                  )}
                </div>
                {lookupSupported && !playerCheckCompleted && (
                  <Button
                    type="button"
                    onClick={() => void checkPlayerId()}
                    disabled={playerLookupLoading || !playerId?.trim() || (needsServerId && !serverId?.trim())}
                    variant="outline"
                    className="mt-3 h-10 w-full border-primary/60 bg-primary/10 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
                  >
                    {playerLookupLoading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking ID…</>
                      : <><CheckCircle2 className="mr-2 h-4 w-4" /> Check ID</>}
                  </Button>
                )}
                {playerValidationError && (
                  <p className="text-xs font-bold text-destructive font-display tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {playerValidationError}
                  </p>
                )}
                {playerUsername && !playerLookupLoading && !playerValidationError && (
                  <div className="flex items-center justify-between gap-3 rounded-full border border-teal-500/60 bg-emerald-950/70 px-3 py-2.5 text-xs font-display shadow-[0_0_18px_rgba(20,184,166,0.08)]">
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                      <span className="shrink-0 text-teal-300">Username:</span>
                      <strong className="truncate text-white">{playerUsername}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={invalidatePlayerCheck}
                      aria-label="Reset player ID check"
                      className="focus-ring shrink-0 rounded-full p-1 text-teal-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {playerCheckCompleted && !playerUsername && !playerLookupLoading && !playerValidationError && lookupSupported && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-display">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-500">Player ID:</span>
                      <strong className="text-foreground">Ready for top-up</strong>
                    </div>
                    <button
                      type="button"
                      onClick={invalidatePlayerCheck}
                      aria-label="Reset player ID check"
                      className="focus-ring shrink-0 rounded-full p-1 text-emerald-500 transition-colors hover:bg-black/10 hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 font-display font-bold text-xs uppercase tracking-widest text-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">3</span>
                    <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Promo Code</div>
                    <span className="text-muted-foreground text-[9px] tracking-normal font-medium ml-auto">(optional)</span>
                  </div>

                  {promoResult ? (
                    <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1">
                        <p className="font-display font-bold text-sm text-emerald-500 uppercase tracking-wide">{promoResult.code}</p>
                        <p className="text-[11px] text-emerald-500/80 font-medium mt-0.5">
                          {promoResult.discountType === "percent"
                            ? `${promoResult.discountValue}% off`
                            : `$${promoResult.discountValue} off`
                          } — saving {formatCurrency(String(promoResult.discountUsd))}
                        </p>
                      </div>
                      <button onClick={clearPromo} className="text-emerald-500/60 hover:text-emerald-500 transition-colors p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), validatePromo())}
                        className="bg-card border-border font-mono font-medium text-sm h-11 rounded-lg flex-1 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                        style={{ textTransform: "uppercase" }}
                      />
                      <Button
                        type="button"
                        onClick={validatePromo}
                        disabled={!promoInput.trim() || promoLoading}
                        variant="secondary"
                        className="h-11 px-5 font-display font-bold tracking-wide text-xs rounded-lg bg-card border border-border hover:bg-muted"
                      >
                        {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}

                  {promoError && (
                    <p className="text-xs font-bold text-destructive font-display tracking-wide flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="w-3 h-3" /> {promoError}
                    </p>
                  )}
                </div>
              )}

            </form>
          </Form>
        </ScrollArea>

        <div className="border-t border-border bg-card p-6 shrink-0 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.3)] z-10">
          <AnimatePresence mode="popLayout">
            {selectedProduct ? (
              <motion.div key="submit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold uppercase text-xs text-muted-foreground tracking-wider">Total Amount</span>
                  <div className="text-right flex flex-col items-end">
                    {promoResult && (
                      <span className="text-[11px] text-muted-foreground/70 line-through -mb-1">{formatCurrency(selectedProduct.price)}</span>
                    )}
                    <span className="font-display font-black text-2xl text-foreground">
                      {formatCurrency(String(finalPrice))}
                    </span>
                  </div>
                </div>
                {promoResult && (
                  <div className="flex items-center justify-end gap-1.5 mb-3">
                    <Tag className="w-3 h-3 text-emerald-500" />
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                      {promoResult.code} applied — {promoResult.discountType === "percent" ? `${promoResult.discountValue}%` : `$${promoResult.discountValue}`} off
                    </p>
                  </div>
                )}
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  size="lg"
                  className="w-full h-12 text-sm font-display font-bold uppercase tracking-widest rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 group transition-all"
                   disabled={createOrder.isPending || validatePlayer.isPending}
                  data-testid="btn-submit-order"
                >
                  {validatePlayer.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Pay Now</>
                  ) : createOrder.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Pay Now</>
                  ) : (
                    <span className="flex items-center">Pay Now <ChevronRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Secured by KHQR
                </div>
              </motion.div>
            ) : (
              <motion.div key="disabled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[96px] flex flex-col justify-center">
                <Button disabled size="lg" className="w-full h-12 text-sm font-display font-bold uppercase tracking-widest rounded-lg bg-muted text-muted-foreground border border-border">
                  Select a package
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}