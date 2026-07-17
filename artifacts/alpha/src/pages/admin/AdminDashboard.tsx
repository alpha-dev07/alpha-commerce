import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
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
} from "lucide-react";
import type { Order, OrderStatus } from "../../types/order";

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  pending: number;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  confirmed: "text-primary bg-primary/10",
  preparing: "text-amber-400 bg-amber-400/10",
  out_for_delivery: "text-blue-400 bg-blue-400/10",
  delivered: "text-muted-foreground bg-muted/30",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      setStats((prev) => ({
        ...prev,
        orders: snap.size,
        revenue: orders.reduce((s, o) => s + (o.total || 0), 0),
        pending: orders.filter((o) => o.status !== "delivered").length,
      }));
      setRecentOrders(
        [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
      );
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setStats((prev) => ({ ...prev, products: snap.size }));
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const statCards = [
    {
      label: "Products",
      value: stats.products,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      format: "number",
    },
    {
      label: "Total Orders",
      value: stats.orders,
      icon: ClipboardList,
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
      format: "number",
    },
    {
      label: "Revenue",
      value: stats.revenue,
      icon: IndianRupee,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
      format: "currency",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-rose-400",
      bg: "bg-rose-400/10 border-rose-400/20",
      format: "number",
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-5" data-testid="page-admin-dashboard">
      {/* Greeting */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-bold">
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 17
            ? "afternoon"
            : "evening"}{" "}
          👋
        </h2>
        <p className="text-sm text-muted-foreground">{adminUser?.email}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, format }) => (
          <div
            key={label}
            className={`flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border`}
          >
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${bg}`}
            >
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-xl font-bold ${color}`}>
                {format === "currency" ? formatINR(value) : value.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend badge */}
      {stats.revenue > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs text-primary font-medium">
            Total revenue across {stats.orders} orders — avg{" "}
            {formatINR(Math.round(stats.revenue / Math.max(stats.orders, 1)))} per order
          </span>
        </div>
      )}

      {/* Recent orders */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Recent Orders</h3>
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-0.5 text-xs text-primary font-medium"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex items-center justify-center py-10 rounded-2xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card border border-border gap-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold">
                    ORD-{order.id.slice(0, 6).toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {order.deliveryAddress?.name} · {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {formatINR(order.total)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      STATUS_COLORS[order.status]
                    }`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
