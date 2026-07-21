import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  Bell,
  BellOff,
  Package,
  Tag,
  CreditCard,
  Settings as SettingsIcon,
  Megaphone,
  Loader2,
  CheckCheck,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   Notification settings (unchanged from previous implementation)
   ──────────────────────────────────────────────────────────────────────── */

interface NotifSettings {
  orderUpdates: boolean;
  offers: boolean;
  promotions: boolean;
}

const DEFAULT_SETTINGS: NotifSettings = {
  orderUpdates: true,
  offers: true,
  promotions: false,
};

interface ToggleRowProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  saving?: boolean;
}

function ToggleRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  checked,
  onChange,
  saving,
}: ToggleRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground leading-relaxed">{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={saving}
        className={`w-11 h-6 rounded-full transition-colors shrink-0 relative disabled:opacity-60 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${
            checked ? "left-[calc(100%-22px)]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Notification feed
   ──────────────────────────────────────────────────────────────────────── */

type NotificationCategory = "orders" | "offers" | "payments" | "system";

interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

interface CategoryStyle {
  icon: React.ElementType;
  bg: string;
  color: string;
  label: string;
}

const CATEGORY_STYLES: Record<NotificationCategory, CategoryStyle> = {
  orders: {
    icon: Package,
    bg: "bg-primary/10",
    color: "text-primary",
    label: "Order",
  },
  offers: {
    icon: Tag,
    bg: "bg-amber-400/10",
    color: "text-amber-400",
    label: "Offer",
  },
  payments: {
    icon: CreditCard,
    bg: "bg-green-400/10",
    color: "text-green-400",
    label: "Payment",
  },
  system: {
    icon: SettingsIcon,
    bg: "bg-slate-400/10",
    color: "text-slate-400",
    label: "System",
  },
};

function formatRelativeTime(date: Date | null): string {
  if (!date) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface NotificationRowProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}

function NotificationRow({ notification, onMarkRead }: NotificationRowProps) {
  const style = CATEGORY_STYLES[notification.category];
  const Icon = style.icon;
  const time = formatRelativeTime(notification.createdAt ? notification.createdAt.toDate() : null);

  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id);
      }}
      data-testid={`notification-row-${notification.id}`}
      className="w-full flex items-start gap-3 px-4 py-4 text-left active:bg-muted/40 transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
        <Icon className={`w-4.5 h-4.5 ${style.color}`} />
      </div>

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${notification.read ? "font-medium" : "font-semibold"}`}
          >
            {notification.title}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {notification.message}
        </p>
      </div>

      {!notification.read && (
        <span
          aria-label="Unread"
          className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"
        />
      )}
    </button>
  );
}

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Settings state
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification feed state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const userDocRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    if (!userDocRef) {
      setSettingsLoading(false);
      return;
    }
    getDoc(userDocRef).then((snap) => {
      if (snap.exists() && snap.data().notificationSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data().notificationSettings });
      }
      setSettingsLoading(false);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setFeedLoading(false);
      return;
    }

    setFeedLoading(true);
    const notifsQuery = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notifsQuery,
      (snapshot) => {
        const items: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<AppNotification>;
          return {
            id: docSnap.id,
            category: (data.category as NotificationCategory) ?? "system",
            title: data.title ?? "Notification",
            message: data.message ?? "",
            read: Boolean(data.read),
            createdAt: (data.createdAt as Timestamp) ?? null,
          };
        });
        setNotifications(items);
        setFeedLoading(false);
      },
      () => {
        setFeedLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleToggle = async (key: keyof NotifSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (!userDocRef) return;
    setSaving(true);
    try {
      await setDoc(userDocRef, { notificationSettings: updated }, { merge: true });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
    } catch {
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const unread = notifications.filter((n) => !n.read);
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch {
      setNotifications((prev) =>
        prev.map((n) =>
          unread.some((u) => u.id === n.id) ? { ...n, read: false } : n
        )
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-24 animate-in fade-in duration-300"
      data-testid="page-notifications"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-bold truncate">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          {saving && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin ml-auto" />}
        </div>

        {unreadCount > 0 && (
          <div className="px-4 pb-3 flex justify-end">
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              data-testid="btn-mark-all-read"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary active:opacity-70 transition-opacity disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Mark all as read
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Notification feed */}
        {feedLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-testid="notifications-empty-state"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <BellOff className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">You're all caught up</p>
            <p className="text-xs text-muted-foreground text-center max-w-[220px] leading-relaxed">
              New order updates, offers, and payment alerts will show up here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}

        {/* Notification settings */}
        {settingsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
              <ToggleRow
                icon={Package}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="Order Updates"
                description="Get notified about your order status — confirmed, preparing, and delivered"
                checked={settings.orderUpdates}
                onChange={(v) => handleToggle("orderUpdates", v)}
                saving={saving}
              />
              <ToggleRow
                icon={Tag}
                iconBg="bg-amber-400/10"
                iconColor="text-amber-400"
                title="Offers & Deals"
                description="Be the first to know about exclusive deals and limited-time discounts"
                checked={settings.offers}
                onChange={(v) => handleToggle("offers", v)}
                saving={saving}
              />
              <ToggleRow
                icon={Megaphone}
                iconBg="bg-blue-400/10"
                iconColor="text-blue-400"
                title="Promotional Notifications"
                description="Product launches, seasonal sales, and brand campaigns"
                checked={settings.promotions}
                onChange={(v) => handleToggle("promotions", v)}
                saving={saving}
              />
            </div>

            {/* Note */}
            <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl bg-card border border-border">
              <Bell className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Notification preferences are saved to your account. Order update notifications are
                recommended to track your deliveries in real-time.
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
