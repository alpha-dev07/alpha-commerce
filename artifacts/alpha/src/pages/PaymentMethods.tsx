import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  ChevronRight,
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface MethodSectionProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  active?: boolean;
  comingSoon?: boolean;
  actionLabel?: string;
}

function MethodSection({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  active,
  comingSoon,
  actionLabel = "Add",
}: MethodSectionProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-bold">{title}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        {comingSoon && (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
            Coming Soon
          </span>
        )}
      </div>

      {active && (
        <div className="mx-4 mb-4 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/5 border border-primary/20">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-semibold">Cash on Delivery</span>
            <span className="text-xs text-muted-foreground">Pay when your order arrives</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        </div>
      )}

      {comingSoon && (
        <div className="mx-4 mb-4">
          <button
            disabled
            className="w-full h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
            {actionLabel} — Coming Soon
          </button>
        </div>
      )}
    </div>
  );
}

export function PaymentMethods() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-24 animate-in fade-in duration-300"
      data-testid="page-payment-methods"
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
          <h1 className="text-xl font-bold">Payment Methods</h1>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Info banner */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-primary/5 border border-primary/20">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary/80 leading-relaxed">
            Your payment information is encrypted and secure.
          </p>
        </div>

        {/* Cash on Delivery */}
        <MethodSection
          icon={Banknote}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          title="Cash on Delivery"
          subtitle="Default payment method"
          active
        />

        {/* UPI */}
        <MethodSection
          icon={Smartphone}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          title="UPI"
          subtitle="GPay, PhonePe, Paytm & more"
          comingSoon
          actionLabel="Add UPI ID"
        />

        {/* Cards */}
        <MethodSection
          icon={CreditCard}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          title="Credit / Debit Cards"
          subtitle="Visa, Mastercard, RuPay"
          comingSoon
          actionLabel="Add Card"
        />

        {/* Wallets */}
        <MethodSection
          icon={Wallet}
          iconColor="text-purple-400"
          iconBg="bg-purple-400/10"
          title="Wallets"
          subtitle="Paytm Wallet, Amazon Pay & more"
          comingSoon
          actionLabel="Link Wallet"
        />

        {/* Note */}
        <p className="text-center text-xs text-muted-foreground px-4">
          More payment options will be available soon. Currently all orders use Cash on Delivery.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
