import { useLocation } from "wouter";
import { ArrowLeft, Gamepad2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <div className="min-h-[58vh] flex items-center justify-center py-16">
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-card/80 px-6 py-12 text-center shadow-2xl shadow-primary/10 backdrop-blur-sm sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/20">
              <Gamepad2 className="h-10 w-10" />
            </div>
            <p className="mb-2 font-display text-xs font-black uppercase tracking-[0.35em] text-primary">
              Error 404
            </p>
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              Page not found
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              This link does not lead to a game or page in KizoTopup. Head back home and choose a game to top up.
            </p>
            <Button
              type="button"
              onClick={() => setLocation("/")}
              className="mt-8 rounded-xl bg-primary px-6 font-display font-bold uppercase tracking-wide text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
