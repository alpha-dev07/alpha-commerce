import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useCart } from "../context/CartContext";
import { formatINR } from "../lib/currency";
import { validateCoupon, recordCouponUsage } from "../lib/coupons";
import { BottomNav } from "../components/BottomNav";
import type { AppliedCoupon } from "../types/coupon";
import {
  ChevronLeft,
  Banknote,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Building,
  Hash,
  ShieldCheck,
  Loader2,
  Tag,
  X,
  BadgePercent,
} from "lucide-react";

const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 49;

interface FormState {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  pincode?: string;
}

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive pl-1">{error}</p>}
    </div>
  );
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    addressLine: "",
    city: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Computed totals
  const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const orderTotal = Math.max(0, totalPrice + deliveryFee - discount);

  // Guard: empty cart
  useEffect(() => {
    if (items.length === 0) navigate("/cart", { replace: true });
  }, [items.length, navigate]);

  // Clear coupon if cart changes (subtotal drops below min)
  useEffect(() => {
    if (appliedCoupon && totalPrice < appliedCoupon.coupon.minOrderValue) {
      setAppliedCoupon(null);
      setCouponError("Coupon removed — cart no longer meets the minimum order value.");
    }
  }, [totalPrice, appliedCoupon]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name";
    if (form.phone.replace(/\D/g, "").length < 10)
      e.phone = "Enter a valid 10-digit phone number";
    if (form.addressLine.trim().length < 5) e.addressLine = "Enter your street address";
    if (!form.city.trim()) e.city = "Enter your city";
    if (!/^\d{5,6}$/.test(form.pincode.trim()))
      e.pincode = "Enter a valid 5–6 digit ZIP / pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const user = auth.currentUser;
    if (!user) { setCouponError("Sign in to apply a coupon."); return; }

    setCouponLoading(true);
    setCouponError(null);

    const result = await validateCoupon(couponInput.trim(), user.uid, totalPrice);
    if (result.ok) {
      setAppliedCoupon({ coupon: result.coupon, discountAmount: result.discountAmount });
      setCouponInput("");
    } else {
      setCouponError(result.error);
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlaceError("");
    setPlacing(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: items.map(({ product, quantity }) => ({ product, quantity })),
        deliveryAddress: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
        },
        paymentMethod: "cash_on_delivery",
        subtotal: totalPrice,
        deliveryFee,
        couponCode: appliedCoupon?.coupon.code ?? null,
        couponDiscount: discount > 0 ? discount : null,
        total: orderTotal,
        status: "confirmed",
        createdAt: Date.now(),
      });

      // Record coupon usage after order is placed
      if (appliedCoupon) {
        await recordCouponUsage(
          appliedCoupon.coupon,
          user.uid,
          orderRef.id,
          appliedCoupon.discountAmount
        );
      }

      clearCart();
      navigate("/orders", { state: { newOrder: true }, replace: true });
    } catch {
      setPlaceError("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const inputCls =
    "w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm";
  const errorInputCls =
    "w-full h-12 px-4 rounded-xl bg-input border border-destructive/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent transition-all text-sm";

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col" data-testid="page-checkout">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            data-testid="btn-checkout-back"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-4 px-4 py-4 pb-36">
        {/* ── Delivery Details ── */}
        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Delivery Details</span>
          </div>

          <Field label="Full Name" icon={User} error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="John Smith"
              className={errors.name ? errorInputCls : inputCls}
              data-testid="input-checkout-name"
            />
          </Field>

          <Field label="Phone Number" icon={Phone} error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
              className={errors.phone ? errorInputCls : inputCls}
              data-testid="input-checkout-phone"
            />
          </Field>

          <Field label="Street Address" icon={MapPin} error={errors.addressLine}>
            <input
              type="text"
              value={form.addressLine}
              onChange={set("addressLine")}
              placeholder="123 Main St, Apt 4B"
              className={errors.addressLine ? errorInputCls : inputCls}
              data-testid="input-checkout-address"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City" icon={Building} error={errors.city}>
              <input
                type="text"
                value={form.city}
                onChange={set("city")}
                placeholder="Mumbai"
                className={errors.city ? errorInputCls : inputCls}
                data-testid="input-checkout-city"
              />
            </Field>
            <Field label="Pincode" icon={Hash} error={errors.pincode}>
              <input
                type="text"
                inputMode="numeric"
                value={form.pincode}
                onChange={set("pincode")}
                placeholder="400001"
                maxLength={6}
                className={errors.pincode ? errorInputCls : inputCls}
                data-testid="input-checkout-pincode"
              />
            </Field>
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Payment Method</span>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-primary/40 bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-bold">Cash on Delivery</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Pay with cash when your order arrives
              </span>
            </div>
            <CheckCircle2
              className="w-5 h-5 text-primary shrink-0"
              data-testid="icon-cod-selected"
            />
          </div>
        </div>

        {/* ── Promo Code ── */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2">
            <BadgePercent className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Promo Code</span>
          </div>

          {appliedCoupon ? (
            /* Applied coupon badge */
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-primary/5 border border-primary/20">
              <Tag className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold font-mono text-primary">
                  {appliedCoupon.coupon.code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {appliedCoupon.coupon.description ||
                    (appliedCoupon.coupon.type === "percentage"
                      ? `${appliedCoupon.coupon.value}% discount applied`
                      : `${formatINR(appliedCoupon.coupon.value)} discount applied`)}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="text-sm font-bold text-primary">
                  -{formatINR(appliedCoupon.discountAmount)}
                </span>
                <button
                  onClick={handleRemoveCoupon}
                  data-testid="btn-remove-coupon"
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          ) : (
            /* Coupon input */
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Enter promo code"
                  className="flex-1 h-11 px-4 rounded-xl bg-input border border-border text-sm font-mono uppercase placeholder:text-muted-foreground placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  data-testid="input-coupon-code-checkout"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  data-testid="btn-apply-coupon"
                  className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 shrink-0"
                >
                  {couponLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {couponError && (
                <p className="text-xs text-destructive font-medium" data-testid="coupon-error">
                  {couponError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Order Summary ── */}
        <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm font-bold">Order Summary</span>
          </div>

          {/* Items */}
          <div className="flex flex-col divide-y divide-border/50">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
                data-testid={`checkout-item-${product.id}`}
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

          {/* Price rows */}
          <div className="border-t border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-semibold">{formatINR(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Delivery</span>
              {deliveryFee === 0 ? (
                <span className="text-sm font-bold text-primary">FREE</span>
              ) : (
                <span className="text-sm font-semibold">{formatINR(deliveryFee)}</span>
              )}
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <Tag className="w-3.5 h-3.5" />
                  {appliedCoupon.coupon.code}
                </span>
                <span className="text-sm font-bold text-primary">
                  -{formatINR(appliedCoupon.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-base font-bold">Total</span>
              <span
                className="text-xl font-bold text-primary"
                data-testid="text-checkout-total"
              >
                {formatINR(orderTotal)}
              </span>
            </div>
          </div>
        </div>

        {placeError && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
            {placeError}
          </div>
        )}
      </div>

      {/* Fixed Place Order CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40">
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          data-testid="btn-place-order"
          className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed py-3.5"
        >
          {placing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing order...
            </>
          ) : (
            <>
              Place Order · {formatINR(orderTotal)}
              <ShieldCheck className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          By placing your order, you agree to our Terms of Service
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
