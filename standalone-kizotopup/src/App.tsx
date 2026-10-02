import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { apiUrl } from '@/lib/api';

const NotFound = lazy(() => import('@/pages/not-found'));
const Home = lazy(() => import('@/pages/Home'));
const GamePage = lazy(() => import('@/pages/GamePage'));
const OrderPage = lazy(() => import('@/pages/OrderPage'));
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
const maintenanceFallback = import.meta.env.VITE_MAINTENANCE_MODE === "true";
const MAINTENANCE_SYNC_KEY = "kizotopup-maintenance-sync";
const maintenanceChannel = typeof BroadcastChannel === "undefined"
  ? null
  : new BroadcastChannel(MAINTENANCE_SYNC_KEY);

export interface MaintenanceContent {
  maintenanceMode: boolean;
  maintenanceStatusLabel: string;
  maintenanceTitle: string;
  maintenanceMessage: string;
}

function isMaintenanceContent(data: unknown): data is MaintenanceContent {
  if (typeof data !== "object" || data === null) return false;
  const content = data as Partial<MaintenanceContent>;
  return (
    typeof content.maintenanceMode === "boolean" &&
    typeof content.maintenanceStatusLabel === "string" &&
    typeof content.maintenanceTitle === "string" &&
    typeof content.maintenanceMessage === "string"
  );
}

function useMaintenanceMode() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const applyUpdate = (data: unknown) => {
      if (isMaintenanceContent(data)) {
        queryClient.setQueryData(["storefront-maintenance-mode"], data);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== MAINTENANCE_SYNC_KEY || !event.newValue) return;
      try {
        applyUpdate(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed cross-tab messages and keep polling the API.
      }
    };

    const handleChannelMessage = (event: MessageEvent<unknown>) => {
      applyUpdate(event.data);
    };

    window.addEventListener("storage", handleStorage);
    maintenanceChannel?.addEventListener("message", handleChannelMessage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      maintenanceChannel?.removeEventListener("message", handleChannelMessage);
    };
  }, [queryClient]);

  return useQuery<MaintenanceContent>({
    queryKey: ["storefront-maintenance-mode"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/site-settings/maintenance"), { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load storefront status (${response.status})`);
      const data: unknown = await response.json();
      if (!isMaintenanceContent(data)) {
        throw new Error("Invalid storefront status response");
      }
      return data;
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

function StorefrontStatusLoading() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background" aria-label="Checking storefront status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </main>
  );
}

function Router() {
  const { data, isLoading, isError } = useMaintenanceMode();
  if (isLoading) return <StorefrontStatusLoading />;

  const maintenanceMode = data?.maintenanceMode ?? (isError ? maintenanceFallback : false);
  if (maintenanceMode) return <MaintenancePage content={data} />;

  return (
    <Suspense fallback={<StorefrontStatusLoading />}>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/game/:gameCode" component={GamePage} />
          <Route path="/order/:orderId" component={OrderPage} />
          <Route path="/event/:eventId" component={EventDetailPage} />
          <Route path="/track-order" component={TrackOrderPage} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/about-us" component={AboutUs} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Suspense>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
