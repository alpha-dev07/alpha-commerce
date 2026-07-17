import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { formatINR } from "../../lib/currency";
import { formatDate } from "../../lib/dateFormat";
import type { Order, OrderStatus } from "../../types/order";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CheckCircle2,
  Clock,
  Bike,
  PackageCheck,
} from "lucide-react";

const STATUSES: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "On the Way" },
  { value: "delivered", label: "Delivered" },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; badge: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  preparing: {
    label: "Preparing",
    icon: Clock,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Bike,
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    badge: "bg-muted/40 text-muted-foreground border-border",
  },
};

const STATUS_OPTIONS: OrderStatus[] = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.icon;
  const shortId = `ORD-${order.id.slice(0, 6).toUpperCase()}`;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), { status: newStatus });
    } catch {
      /* silent */
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="rounded-2xl bg-card border border-border overflow-hidden"
      data-testid={`admin-order-${order.id}`}
    >
      {/* Summary row */}
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{shortId}</span>
          <span
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}
          >
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium truncate">
              {order.deliveryAddress?.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {order.deliveryAddress?.phone}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)} · {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-base font-bold text-primary">
              {formatINR(order.total)}
            </span>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-[11px] text-muted-foreground flex items-center gap-0.5"
            >
              {expanded ? (
                <>
                  Less <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Details <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground shrink-0">Change status:</span>
          <div className="relative flex-1">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              disabled={updating}
              className="w-full h-8 pl-3 pr-7 rounded-lg bg-input border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
          {updating && (
            <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border">
          {/* Delivery address */}
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Delivery Address
            </p>
            <p className="text-sm font-medium">{order.deliveryAddress?.name}</p>
            <p className="text-xs text-muted-foreground">
              {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.city}{" "}
              {order.deliveryAddress?.pincode}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.deliveryAddress?.phone}
            </p>
          </div>

          {/* Items */}
          <div className="flex flex-col divide-y divide-border/40">
            {order.items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-4 py-2.5 gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${product.imageColor}55, #0a0a0a)`,
                    }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">{product.name}</span>
                    <span className="text-[11px] text-muted-foreground">
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
            <div className="flex justify-between px-4 py-2 border-b border-border/40">
              <span className="text-xs text-muted-foreground">Subtotal</span>
              <span className="text-xs font-medium">{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-b border-border/40">
              <span className="text-xs text-muted-foreground">Delivery</span>
              {order.deliveryFee === 0 ? (
                <span className="text-xs font-bold text-primary">FREE</span>
              ) : (
                <span className="text-xs font-medium">{formatINR(order.deliveryFee)}</span>
              )}
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm font-bold">Total</span>
              <span className="text-sm font-bold text-primary">
                {formatINR(order.total)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) => b.createdAt - a.createdAt);
      setOrders(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.slice(0, 6).toLowerCase().includes(q) ||
        (o.deliveryAddress?.name?.toLowerCase() ?? "").includes(q) ||
        (o.deliveryAddress?.phone ?? "").includes(q)
      );
    }
    return true;
  });

  const counts = orders.reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-5" data-testid="page-admin-orders">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-bold">Orders</h2>
        <p className="text-xs text-muted-foreground">
          {orders.length} total · {counts["confirmed"] || 0} confirmed ·{" "}
          {counts["preparing"] || 0} preparing · {counts["out_for_delivery"] || 0} on the way
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID or customer name..."
          className="w-full h-11 pl-9 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(({ value, label }) => {
          const active = statusFilter === value;
          const count = value === "all" ? orders.length : counts[value] || 0;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value as OrderStatus | "all")}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all border ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "all" ? "No orders match your filter" : "No orders yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
