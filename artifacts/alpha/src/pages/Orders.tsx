import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrders } from "../hooks/useOrders";
import { formatINR } from "../lib/currency";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Receipt,
  CheckCircle2,
  Clock,
  Bike,
  PackageCheck,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import type { Order, OrderStatus } from "../types/order";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  preparing: {
    label: "Preparing",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Bike,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    className: "bg-muted/40 text-muted-foreground border-border",
  },
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.icon;
  const shortId = `ORD-${order.id.slice(0, 6).toUpperCase()}`;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className="rounded-2xl bg-card border border-border overflow-hidden"
      data-testid={`order-card-${order.id}`}
    >
      {/* Top summary row */}
      <button
        className="w-full flex flex-col gap-2 p-4 text-left active:bg-secondary/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        data-testid={`btn-order-expand-${order.id}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{shortId}</span>
          <span
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}
          >
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
            <span className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
              {order.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary">
              {formatINR(order.total)}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border">
          {/* Delivery address */}
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Delivering to</p>
            <p className="text-sm font-medium">{order.deliveryAddress.name}</p>
            <p className="text-xs text-muted-foreground">
              {order.deliveryAddress.addressLine}, {order.deliveryAddress.city} {order.deliveryAddress.pincode}
            </p>
            <p className="text-xs text-muted-foreground">{order.deliveryAddress.phone}</p>
          </div>

          {/* Items */}
          <div className="flex flex-col divide-y divide-border/40">
            {order.items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${product.imageColor}55, #0a0a0a)`,
                    }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {quantity} × {formatINR(product.price)}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0">
                  {formatINR(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="border-t border-border/50">
            <div className="flex justify-between px-4 py-2.5 border-b border-border/40">
              <span className="text-xs text-muted-foreground">Subtotal</span>
              <span className="text-xs font-medium">{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 border-b border-border/40">
              <span className="text-xs text-muted-foreground">Delivery</span>
              {order.deliveryFee === 0 ? (
                <span className="text-xs font-bold text-primary">FREE</span>
              ) : (
                <span className="text-xs font-medium">{formatINR(order.deliveryFee)}</span>
              )}
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm font-bold">Total</span>
              <span className="text-sm font-bold text-primary">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, loading, error } = useOrders();
  const isNewOrder = location.state?.newOrder === true;

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-20 animate-in fade-in duration-300"
      data-testid="page-orders"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate("/home")}
            data-testid="btn-orders-back"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">My Orders</h1>
          {orders.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
              {orders.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Success banner */}
        {isNewOrder && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-primary">Order placed successfully!</span>
              <span className="text-xs text-primary/70">
                Your order is confirmed and will arrive in 10–20 minutes.
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-destructive font-medium">Failed to load orders</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-28 h-28 rounded-full bg-card border border-border flex items-center justify-center">
              <Receipt className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-xl font-bold">No orders yet</h2>
              <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">
                Your completed orders will appear here.
              </p>
            </div>
            <button
              onClick={() => navigate("/home")}
              data-testid="btn-start-shopping"
              className="flex items-center gap-2 px-6 h-11 rounded-xl border border-primary text-primary font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Orders list */
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
