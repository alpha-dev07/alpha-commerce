import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Settings, Save, Loader2 } from "lucide-react";

interface AppSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  freeShippingThreshold: number;
  taxRate: number;
  currency: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "Alpha Store",
  storeEmail: "support@alpha.com",
  storePhone: "+91 9999999999",
  maintenanceMode: false,
  maintenanceMessage: "We are currently under maintenance. Please try again later.",
  freeShippingThreshold: 500,
  taxRate: 18,
  currency: "INR",
};

export function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, "admin", "settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "admin", "settings");
      await setDoc(docRef, settings, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const inputCls =
    "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";
  const labelCls = "text-xs font-semibold text-muted-foreground";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 pb-20" data-testid="page-admin-settings">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Store Information */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border">
        <h2 className="text-sm font-bold">Store Information</h2>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Store Name</label>
          <input
            type="text"
            value={settings.storeName}
            onChange={(e) => handleChange("storeName", e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Store Email</label>
          <input
            type="email"
            value={settings.storeEmail}
            onChange={(e) => handleChange("storeEmail", e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Store Phone</label>
          <input
            type="tel"
            value={settings.storePhone}
            onChange={(e) => handleChange("storePhone", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Business Settings */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border">
        <h2 className="text-sm font-bold">Business Settings</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Free Shipping Threshold (₹)</label>
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) =>
                handleChange("freeShippingThreshold", parseInt(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.taxRate}
              onChange={(e) =>
                handleChange("taxRate", parseFloat(e.target.value) || 0)
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border">
        <h2 className="text-sm font-bold">Maintenance Mode</h2>

        <div className="flex items-center justify-between">
          <label className={labelCls}>Enable Maintenance Mode</label>
          <button
            onClick={() => handleChange("maintenanceMode", !settings.maintenanceMode)}
            className={`w-12 h-6 rounded-full border transition-colors flex items-center ${
              settings.maintenanceMode
                ? "bg-primary/20 border-primary/40"
                : "bg-muted/40 border-border"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-primary transition-transform ${
                settings.maintenanceMode ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {settings.maintenanceMode && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Maintenance Message</label>
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) => handleChange("maintenanceMessage", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground font-semibold active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Settings
            </>
          )}
        </button>
      </div>

      {saved && (
        <div className="fixed bottom-20 left-4 right-4 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
          ✓ Settings saved successfully
        </div>
      )}
    </div>
  );
}
