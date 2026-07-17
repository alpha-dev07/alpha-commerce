import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import { ChevronLeft, Bell, Package, Tag, Megaphone, Loader2 } from "lucide-react";

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

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userDocRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    if (!userDocRef) { setLoading(false); return; }
    getDoc(userDocRef).then((snap) => {
      if (snap.exists() && snap.data().notificationSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data().notificationSettings });
      }
      setLoading(false);
    });
  }, [user?.uid]);

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
          <h1 className="text-xl font-bold">Notifications</h1>
          {saving && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin ml-auto" />}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Notification settings */}
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
