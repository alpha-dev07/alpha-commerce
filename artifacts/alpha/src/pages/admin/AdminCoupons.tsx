import { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
} from "../../lib/coupons";
import { formatINR } from "../../lib/currency";
import type { Coupon, CouponInput, CouponType } from "../../types/coupon";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function couponStatus(c: Coupon): "active" | "inactive" | "expired" | "maxed" {
  if (!c.isActive) return "inactive";
  if (c.expiresAt !== null && c.expiresAt < Date.now()) return "expired";
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return "maxed";
  return "active";
}

const STATUS_CFG = {
  active: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-muted/40 text-muted-foreground border-border",
  expired: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  maxed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const STATUS_LABEL = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  maxed: "Limit reached",
};

// ─── empty form ────────────────────────────────────────────────────────────────

type FormData = {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  maxDiscount: string;
  minOrderValue: string;
  expiresAt: string; // date string YYYY-MM-DD
  usageLimit: string;
  isActive: boolean;
  isPublic: boolean;
  allowedUserIds: string; // comma-separated
};

const EMPTY_FORM: FormData = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  maxDiscount: "",
  minOrderValue: "0",
  expiresAt: "",
  usageLimit: "",
  isActive: true,
  isPublic: true,
  allowedUserIds: "",
};

function couponToForm(c: Coupon): FormData {
  return {
    code: c.code,
    description: c.description,
    type: c.type,
    value: String(c.value),
    maxDiscount: c.maxDiscount !== null ? String(c.maxDiscount) : "",
    minOrderValue: String(c.minOrderValue),
    expiresAt: c.expiresAt
      ? new Date(c.expiresAt).toISOString().slice(0, 10)
      : "",
    usageLimit: c.usageLimit !== null ? String(c.usageLimit) : "",
    isActive: c.isActive,
    isPublic: c.isPublic,
    allowedUserIds: (c.allowedUserIds ?? []).join(", "),
  };
}

function formToInput(f: FormData): CouponInput {
  return {
    code: f.code.trim().toUpperCase(),
    description: f.description.trim(),
    type: f.type,
    value: parseFloat(f.value) || 0,
    maxDiscount: f.type === "percentage" && f.maxDiscount.trim() ? parseFloat(f.maxDiscount) : null,
    minOrderValue: parseFloat(f.minOrderValue) || 0,
    expiresAt: f.expiresAt
      ? new Date(f.expiresAt + "T23:59:59").getTime()
      : null,
    usageLimit: f.usageLimit.trim() ? parseInt(f.usageLimit) : null,
    isActive: f.isActive,
    isPublic: f.isPublic,
    allowedUserIds: f.isPublic
      ? []
      : f.allowedUserIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
  };
}

// ─── CouponCard ────────────────────────────────────────────────────────────────

function CouponCard({
  coupon,
  onEdit,
  onDelete,
  onToggle,
  toggling,
  deleting,
}: {
  coupon: Coupon;
  onEdit: (c: Coupon) => void;
  onDelete: (c: Coupon) => void;
  onToggle: (c: Coupon) => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = couponStatus(coupon);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-secondary/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold tracking-wider">{coupon.code}</span>
            <span
              className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                coupon.type === "percentage"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              }`}
            >
              {coupon.type === "percentage" ? (
                <Percent className="w-2.5 h-2.5" />
              ) : (
                <IndianRupee className="w-2.5 h-2.5" />
              )}
              {coupon.type === "percentage"
                ? `${coupon.value}% OFF`
                : `${formatINR(coupon.value)} OFF`}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${STATUS_CFG[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          {coupon.description && (
            <span className="text-xs text-muted-foreground truncate">{coupon.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Detail rows */}
          <div className="px-4 py-3 flex flex-col gap-2.5 border-b border-border/50">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow label="Discount">
                {coupon.type === "percentage"
                  ? `${coupon.value}%${coupon.maxDiscount ? ` (max ${formatINR(coupon.maxDiscount)})` : ""}`
                  : formatINR(coupon.value)}
              </InfoRow>
              <InfoRow label="Min Order">
                {coupon.minOrderValue > 0 ? formatINR(coupon.minOrderValue) : "None"}
              </InfoRow>
              <InfoRow label="Expiry">{fmtDate(coupon.expiresAt)}</InfoRow>
              <InfoRow label="Usage">
                {coupon.usedCount} / {coupon.usageLimit ?? "∞"}
              </InfoRow>
              <InfoRow label="Access">
                {coupon.isPublic ? (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {coupon.allowedUserIds.length} users
                  </span>
                )}
              </InfoRow>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => onToggle(coupon)}
              disabled={toggling}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border text-xs font-semibold active:scale-95 transition-transform disabled:opacity-50"
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : coupon.isActive ? (
                <>
                  <ToggleRight className="w-3.5 h-3.5 text-primary" /> Disable
                </>
              ) : (
                <>
                  <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" /> Enable
                </>
              )}
            </button>
            <button
              onClick={() => onEdit(coupon)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border text-xs font-semibold active:scale-95 transition-transform"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(coupon)}
              disabled={deleting}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold active:scale-95 transition-transform disabled:opacity-50 ml-auto"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xs font-semibold">{children}</span>
    </div>
  );
}

// ─── CouponForm modal ──────────────────────────────────────────────────────────

function CouponFormModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Coupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>(editing ? couponToForm(editing) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.code.trim()) { setError("Coupon code is required."); return; }
    if (!form.value.trim() || parseFloat(form.value) <= 0) {
      setError("Discount value must be greater than 0.");
      return;
    }
    if (form.type === "percentage" && parseFloat(form.value) > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const input = formToInput(form);
      if (editing) {
        await updateCoupon(editing.id, input);
      } else {
        await createCoupon(input);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";
  const labelCls = "text-xs font-semibold text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-background border-t border-border rounded-t-3xl max-h-[90dvh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold">{editing ? "Edit Coupon" : "New Coupon"}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex flex-col gap-4 px-5 py-4 pb-safe">
          {/* Code */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Coupon Code *</label>
            <input
              type="text"
              placeholder="e.g. SAVE20"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className={inputCls + " font-mono uppercase"}
              data-testid="input-coupon-code"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <input
              type="text"
              placeholder="e.g. 20% off on orders above ₹500"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Type toggle */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Discount Type *</label>
            <div className="flex gap-2">
              {(["percentage", "fixed"] as CouponType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex-1 h-10 rounded-lg border text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    form.type === t
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {t === "percentage" ? (
                    <><Percent className="w-3.5 h-3.5" /> Percentage</>
                  ) : (
                    <><IndianRupee className="w-3.5 h-3.5" /> Fixed Amount</>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Value + Max Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>
                {form.type === "percentage" ? "Discount %" : "Amount (₹)"} *
              </label>
              <div className="relative">
                {form.type === "percentage" ? (
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                )}
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  className={inputCls + " pl-8"}
                  data-testid="input-coupon-value"
                />
              </div>
            </div>
            {form.type === "percentage" && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Max Discount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    placeholder="No cap"
                    value={form.maxDiscount}
                    onChange={(e) => set("maxDiscount", e.target.value)}
                    className={inputCls + " pl-8"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Min Order + Usage Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Min Order (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => set("minOrderValue", e.target.value)}
                  className={inputCls + " pl-8"}
                  data-testid="input-coupon-min-order"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Usage Limit</label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Expiry date */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Expiry Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
                className={inputCls + " pl-8"}
                data-testid="input-coupon-expiry"
              />
            </div>
          </div>

          {/* Access */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-semibold">Public Coupon</label>
                <span className="text-xs text-muted-foreground">Anyone can use this code</span>
              </div>
              <button
                type="button"
                onClick={() => set("isPublic", !form.isPublic)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  form.isPublic ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.isPublic ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {!form.isPublic && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Allowed User IDs (comma-separated)</label>
                <textarea
                  rows={3}
                  placeholder="uid1, uid2, uid3"
                  value={form.allowedUserIds}
                  onChange={(e) => set("allowedUserIds", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none font-mono"
                />
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-semibold">Active</label>
              <span className="text-xs text-muted-foreground">Enable this coupon for use</span>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                form.isActive ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.isActive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium" data-testid="coupon-form-error">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold active:scale-97 transition-transform disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="btn-save-coupon"
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-97 transition-transform disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Create Coupon"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({
  coupon,
  onClose,
  onDeleted,
}: {
  coupon: Coupon;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCoupon(coupon.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 w-full max-w-sm">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold">Delete Coupon?</h3>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-mono font-bold text-foreground">{coupon.code}</span>? This
            cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            data-testid="btn-confirm-delete-coupon"
            className="flex-1 h-10 rounded-xl bg-destructive text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await fetchAllCoupons());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (c: Coupon) => {
    setTogglingId(c.id);
    try {
      await toggleCouponActive(c.id, !c.isActive);
      await load();
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCoupon(null);
  };

  const handleSaved = () => {
    handleFormClose();
    load();
  };

  const handleDeleteRequest = (c: Coupon) => {
    setDeletingCoupon(c);
    setDeletingId(c.id);
  };

  const handleDeleted = () => {
    setDeletingCoupon(null);
    setDeletingId(null);
    load();
  };

  const active = coupons.filter((c) => c.isActive && (c.expiresAt === null || c.expiresAt > Date.now())).length;

  return (
    <div className="flex flex-col min-h-full pb-4" data-testid="page-admin-coupons">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3.5 gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h1 className="text-base font-bold">Coupons</h1>
            {coupons.length > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {active} active
              </span>
            )}
          </div>
          <button
            onClick={() => { setEditingCoupon(null); setShowForm(true); }}
            data-testid="btn-add-coupon"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> Add Coupon
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
              <Tag className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">No coupons yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-primary text-primary text-xs font-semibold active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" /> Create first coupon
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {coupons.map((c) => (
              <CouponCard
                key={c.id}
                coupon={c}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onToggle={handleToggle}
                toggling={togglingId === c.id}
                deleting={deletingId === c.id}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CouponFormModal
          editing={editingCoupon}
          onClose={handleFormClose}
          onSaved={handleSaved}
        />
      )}

      {deletingCoupon && (
        <DeleteModal
          coupon={deletingCoupon}
          onClose={() => { setDeletingCoupon(null); setDeletingId(null); }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
