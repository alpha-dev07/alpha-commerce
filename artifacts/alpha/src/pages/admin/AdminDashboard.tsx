import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { formatINR } from "../../lib/currency";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
  Package,
  ClipboardList,
  IndianRupee,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Tag,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  BarChart3,
  PieChart,
  Inbox,
  PackageSearch,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import type { Order, OrderStatus } from "../../types/order";
import type { Product } from "../../types/product";

// ---------------------------------------------------------------------------
// Status maps (with safe fallbacks in case a document has a bad/missing value)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<OrderStatus, string> = {
  confirmed: "text-primary bg-primary/10",
  preparing: "text-amber-400 bg-amber-400/10",
  out_for_delivery: "text-blue-400 bg-blue-400/10",
  delivered: "text-muted-foreground bg-muted/30",
};

const STATUS_BAR_COLORS: Record<OrderStatus, string> = {
  confirmed: "bg-primary",
  preparing: "bg-amber-400",
  out_for_delivery: "bg-blue-400",
  delivered: "bg-muted-foreground/50",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const DEFAULT_STATUS_COLOR = "text-muted-foreground bg-muted/30";
const DEFAULT_STATUS_BAR_COLOR = "bg-muted-foreground/50";
const DEFAULT_STATUS_LABEL = "Unknown";

const ALL_STATUSES: OrderStatus[] = ["confirmed", "preparing", "out_for_delivery", "delivered"];

// ---------------------------------------------------------------------------
// Safe helpers — never throw on missing/malformed Firestore fields
// ---------------------------------------------------------------------------

function safeDate(ts?: number | null): Date | null {
  if (ts === undefined || ts === null || Number.isNaN(ts)) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(ts?: number | null) {
  const d = safeDate(ts);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeOnly(ts?: number | null) {
  const d = safeDate(ts);
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isSameDay(a: Date | null, b: Date) {
  if (!a) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date | null, b: Date) {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function statusColor(status?: OrderStatus) {
  return status && STATUS_COLORS[status] ? STATUS_COLORS[status] : DEFAULT_STATUS_COLOR;
}
function statusBarColor(status?: OrderStatus) {
  return status && STATUS_BAR_COLORS[status] ? STATUS_BAR_COLORS[status] : DEFAULT_STATUS_BAR_COLOR;
}
function statusLabel(status?: OrderStatus) {
  return status && STATUS_LABELS[status] ? STATUS_LABELS[status] : DEFAULT_STATUS_LABEL;
}

const QUICK_ACTIONS = [
  { label: "Products", icon: Package, path: "/admin/products", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { label: "Orders", icon: ClipboardList, path: "/admin/orders", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { label: "Users", icon: Users, path: "/admin/users", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
  { label: "Coupons", icon: Tag, path: "/admin/coupons", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  { label: "Settings", icon: Settings, path: "/admin/settings", color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/20" },
] as const;

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border animate-pulse"
      aria-hidden="true"
    >
      <div className="w-9 h-9 rounded-xl bg-muted/30" />
      <div className="flex flex-col gap-1.5">
        <div className="h-5 w-16 rounded bg-muted/30" />
        <div className="h-3 w-20 rounded bg-muted/20" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border animate-pulse"
      aria-hidden="true"
    >
      <div className="w-10 h-10 rounded-lg bg-muted/30 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3.5 w-2/3 rounded bg-muted/30" />
        <div className="h-3 w-1/3 rounded bg-muted/20" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border animate-pulse"
      aria-hidden="true"
    >
      <div className="h-4 w-40 rounded bg-muted/30" />
      <div className="h-32 rounded bg-muted/15" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Inbox;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl bg-card border border-border border-dashed text-center px-4">
      <div className="w-11 h-11 rounded-full bg-muted/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();

  // Pull-to-refresh state (mobile touch gesture)
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 70;

  useEffect(() => {
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
        setLoadingOrders(false);
      },
      () => setLoadingOrders(false)
    );

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
        setLoadingProducts(false);
      },
      () => setLoadingProducts(false)
    );

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  // Trigger the bar-chart grow-in animation once initial data has settled
  useEffect(() => {
    if (!loadingOrders) {
      const id = requestAnimationFrame(() => setBarsAnimated(true));
      return () => cancelAnimationFrame(id);
    }
  }, [loadingOrders]);

  const loading = loadingOrders || loadingProducts;

  // -------------------------------------------------------------------------
  // Manual refresh (used by pull-to-refresh). onSnapshot already keeps data
  // live, but this re-fetches once so a pull gesture has a visible effect.
  // -------------------------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [orderSnap, productSnap] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "products")),
      ]);
      setOrders(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } catch (err) {
      console.error("Failed to refresh dashboard data", err);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [refreshing]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > PULL_THRESHOLD) {
      handleRefresh();
    }
    setPullDistance(0);
    touchStartY.current = null;
  }, [pullDistance, handleRefresh]);

  // -------------------------------------------------------------------------
  // Derived stats — every numeric read is guarded against missing fields
  // -------------------------------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const safeOrders = orders.filter((o) => !!o?.id);

    const revenue = safeOrders.reduce((s, o) => s + (o.total ?? 0), 0);

    const todayOrders = safeOrders.filter((o) => isSameDay(safeDate(o.createdAt), now));
    const yesterdayOrders = safeOrders.filter((o) => isSameDay(safeDate(o.createdAt), yesterday));
    const monthOrders = safeOrders.filter((o) => isSameMonth(safeDate(o.createdAt), now));

    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    const monthRevenue = monthOrders.reduce((s, o) => s + (o.total ?? 0), 0);

    const avgOrderValue = safeOrders.length > 0 ? Math.round(revenue / safeOrders.length) : 0;
    const deliveredOrders = safeOrders.filter((o) => o.status === "delivered").length;
    const pendingOrders = safeOrders.filter((o) => o.status !== "delivered").length;

    let revenueChangePct: number | null = null;
    if (yesterdayRevenue > 0) {
      revenueChangePct = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    } else if (todayRevenue > 0) {
      revenueChangePct = 100;
    } else {
      revenueChangePct = 0;
    }

    return {
      products: products.filter((p) => !!p?.id).length,
      orders: safeOrders.length,
      revenue,
      todayRevenue,
      monthRevenue,
      avgOrderValue,
      deliveredOrders,
      pendingOrders,
      todayOrderCount: todayOrders.length,
      monthOrderCount: monthOrders.length,
      revenueChangePct,
    };
  }, [orders, products]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .filter((o) => !!o?.id)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .slice(0, 5),
    [orders]
  );

  const lowStockProducts = useMemo(
    () =>
      [...products]
        .filter((p) => !!p?.id)
        .filter((p) => (p.stock ?? 0) < 10)
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        .slice(0, 5),
    [products]
  );

  const topProducts = useMemo(
    () =>
      [...products]
        .filter((p) => !!p?.id)
        .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 5),
    [products]
  );

  const statusSummary = useMemo(() => {
    const counts = ALL_STATUSES.map((status) => ({
      status,
      count: orders.filter((o) => o?.status === status).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max };
  }, [orders]);

  const revenueTrend = useMemo(() => {
    const days: { label: string; date: Date; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        date: d,
        total: 0,
      });
    }
    orders.forEach((o) => {
      const orderDate = safeDate(o?.createdAt);
      if (!orderDate) return;
      const match = days.find((d) => isSameDay(orderDate, d.date));
      if (match) match.total += o.total ?? 0;
    });
    const max = Math.max(1, ...days.map((d) => d.total));
    return { days, max };
  }, [orders]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const statCards = useMemo(
    () => [
      {
        key: "products",
        label: "Products",
        value: stats.products,
        icon: Package,
        color: "text-primary",
        bg: "bg-primary/10 border-primary/20",
        format: "number" as const,
      },
      {
        key: "orders",
        label: "Total Orders",
        value: stats.orders,
        icon: ClipboardList,
        color: "text-blue-400",
        bg: "bg-blue-400/10 border-blue-400/20",
        format: "number" as const,
      },
      {
        key: "revenue",
        label: "Revenue",
        value: stats.revenue,
        icon: IndianRupee,
        color: "text-amber-400",
        bg: "bg-amber-400/10 border-amber-400/20",
        format: "currency" as const,
      },
      {
        key: "pending",
        label: "Pending",
        value: stats.pendingOrders,
        icon: Clock,
        color: "text-rose-400",
        bg: "bg-rose-400/10 border-rose-400/20",
        format: "number" as const,
      },
      {
        key: "todayRevenue",
        label: "Today's Revenue",
        value: stats.todayRevenue,
        icon: TrendingUp,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10 border-emerald-400/20",
        format: "currency" as const,
        trendPct: stats.revenueChangePct,
      },
      {
        key: "todayOrders",
        label: "Today's Orders",
        value: stats.todayOrderCount,
        icon: CalendarCheck,
        color: "text-teal-400",
        bg: "bg-teal-400/10 border-teal-400/20",
        format: "number" as const,
      },
      {
        key: "monthRevenue",
        label: "This Month",
        value: stats.monthRevenue,
        icon: BarChart3,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10 border-cyan-400/20",
        format: "currency" as const,
      },
      {
        key: "monthOrders",
        label: "This Month's Orders",
        value: stats.monthOrderCount,
        icon: ClipboardList,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10 border-indigo-400/20",
        format: "number" as const,
      },
      {
        key: "avgOrderValue",
        label: "Avg. Order Value",
        value: stats.avgOrderValue,
        icon: ShoppingBag,
        color: "text-fuchsia-400",
        bg: "bg-fuchsia-400/10 border-fuchsia-400/20",
        format: "currency" as const,
      },
      {
        key: "delivered",
        label: "Delivered",
        value: stats.deliveredOrders,
        icon: CheckCircle2,
        color: "text-primary",
        bg: "bg-primary/10 border-primary/20",
        format: "number" as const,
      },
    ],
    [stats]
  );

  const handleQuickAction = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const handleViewAllOrders = useCallback(() => {
    navigate("/admin/orders");
  }, [navigate]);

  const handleOpenOrder = useCallback(
    (orderId: string) => {
      navigate(`/admin/orders/${orderId}`);
    },
    [navigate]
  );

  const pullSpinnerRotation = Math.min((pullDistance / PULL_THRESHOLD) * 180, 180);

  return (
    <div
      ref={scrollRef}
      className="relative flex flex-col gap-6 px-4 py-5 overflow-y-auto"
      data-testid="page-admin-dashboard"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pullDistance ? `translateY(${pullDistance}px)` : undefined,
        transition: pullDistance ? "none" : "transform 0.25s ease-out",
      }}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-12 flex items-center justify-center w-9 h-9 rounded-full bg-card border border-border shadow-sm"
        style={{ opacity: pullDistance > 4 || refreshing ? 1 : 0 }}
        aria-live="polite"
        aria-label={refreshing ? "Refreshing dashboard" : undefined}
      >
        <Loader2
          className={`w-4 h-4 text-primary ${refreshing ? "animate-spin" : ""}`}
          style={!refreshing ? { transform: `rotate(${pullSpinnerRotation}deg)` } : undefined}
          aria-hidden="true"
        />
      </div>

      {/* Greeting */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{greeting} 👋</h2>
        <p className="text-sm text-muted-foreground truncate">{adminUser?.email ?? "Admin"}</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {statCards.map(({ key, label, value, icon: Icon, color, bg, format, trendPct }) => (
            <div
              key={key}
              className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm transition-all duration-200 active:scale-[0.97] hover:border-border/80 hover:shadow-md"
              role="group"
              aria-label={`${label}: ${format === "currency" ? formatINR(value) : value.toLocaleString("en-IN")}`}
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-lg sm:text-xl font-bold ${color}`}>
                    {format === "currency" ? formatINR(value) : value.toLocaleString("en-IN")}
                  </span>
                  {typeof trendPct === "number" && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        trendPct >= 0
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-rose-400 bg-rose-400/10"
                      }`}
                      aria-label={`${trendPct >= 0 ? "up" : "down"} ${Math.abs(trendPct)} percent versus yesterday`}
                    >
                      {trendPct >= 0 ? (
                        <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" aria-hidden="true" />
                      )}
                      {Math.abs(trendPct)}%
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
                {typeof trendPct === "number" && (
                  <span className="text-[10px] text-muted-foreground/70">vs yesterday</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue trend badge */}
      {!loading && stats.revenue > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs text-primary font-medium">
            Total revenue across {stats.orders} orders — avg {formatINR(stats.avgOrderValue)} per order
          </span>
        </div>
      )}

      {/* Revenue Overview chart */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold">Revenue Overview (Last 7 Days)</h3>
          </div>
          {stats.revenue === 0 ? (
            <EmptyState icon={BarChart3} title="No revenue yet" subtitle="Revenue will appear here once orders come in." />
          ) : (
            <div
              className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 px-1"
              role="img"
              aria-label="Bar chart of revenue for the last 7 days"
            >
              {revenueTrend.days.map((d, i) => {
                const heightPct = Math.max(4, Math.round((d.total / revenueTrend.max) * 100));
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end min-w-0">
                    <span className="text-[9px] text-muted-foreground truncate">
                      {d.total > 0 ? formatINR(d.total) : ""}
                    </span>
                    <div className="w-full h-full flex items-end">
                      <div
                        className="w-full rounded-md bg-primary/80 transition-all ease-out hover:bg-primary"
                        style={{
                          height: barsAnimated ? `${heightPct}%` : "0%",
                          transitionDuration: "700ms",
                          transitionDelay: `${i * 60}ms`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Status Summary chart */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold">Order Status Summary</h3>
          </div>
          {stats.orders === 0 ? (
            <EmptyState icon={ClipboardList} title="No orders yet" subtitle="Order statuses will show up here." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {statusSummary.counts.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 sm:w-28 shrink-0 truncate">
                    {statusLabel(status)}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${statusBarColor(status)}`}
                      style={{ width: barsAnimated ? `${Math.round((count / statusSummary.max) * 100)}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, path, color, bg }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickAction(path)}
              aria-label={`Open ${label}`}
              className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-card border border-border shadow-sm transition-all duration-200 ease-out active:scale-90 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${bg}`}
              >
                <Icon className={`w-[18px] h-[18px] ${color}`} aria-hidden="true" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Recent Orders</h3>
          <button
            type="button"
            onClick={handleViewAllOrders}
            aria-label="View all orders"
            className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
          >
            View all <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState icon={Inbox} title="No orders yet" subtitle="New orders will show up here as they come in." />
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => {
              const shortId = order.id ? order.id.slice(0, 6).toUpperCase() : "------";
              const customerName = order.deliveryAddress?.name || "Customer";
              const total = order.total ?? 0;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => handleOpenOrder(order.id)}
                  aria-label={`View order ORD-${shortId} for ${customerName}, ${formatINR(total)}, status ${statusLabel(order.status)}`}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card border border-border shadow-sm gap-3 text-left transition-all duration-200 active:scale-[0.98] hover:border-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold">ORD-{shortId}</span>
                    <span className="text-xs text-muted-foreground truncate">{customerName}</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatDate(order.createdAt)}
                      {formatTimeOnly(order.createdAt) && ` · ${formatTimeOnly(order.createdAt)}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-primary">{formatINR(total)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Low Stock */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" aria-hidden="true" />
          <h3 className="text-sm font-bold">Low Stock (below 10)</h3>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : lowStockProducts.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All products well stocked" />
        ) : (
          <div className="flex flex-col gap-2">
            {lowStockProducts.map((product) => {
              const name = product.name || "Unnamed product";
              const stock = product.stock ?? 0;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-rose-400/20 shadow-sm"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg shrink-0"
                      role="img"
                      aria-label={`${name} placeholder image`}
                      style={{
                        background: `linear-gradient(135deg, ${product.imageColor ?? "#666666"}55, #0a0a0a)`,
                      }}
                    />
                  )}
                  <span className="text-sm font-medium flex-1 truncate">{name}</span>
                  <span
                    className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full shrink-0"
                    aria-label={`${stock} left in stock`}
                  >
                    {stock} left
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Selling Products */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold">Top Selling Products</h3>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No products yet" subtitle="Add products to see top sellers here." />
        ) : (
          <div className="flex flex-col gap-2">
            {topProducts.map((product, idx) => {
              const name = product.name || "Unnamed product";
              const price = product.price ?? 0;
              const reviewCount = product.reviewCount ?? 0;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-sm"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{idx + 1}</span>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg shrink-0"
                      role="img"
                      aria-label={`${name} placeholder image`}
                      style={{
                        background: `linear-gradient(135deg, ${product.imageColor ?? "#666666"}55, #0a0a0a)`,
                      }}
                    />
                  )}
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatINR(price)} · {reviewCount} reviews
                    </span>
                  </div>
                  {product.bestSeller && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full shrink-0">
                      Best Seller
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
