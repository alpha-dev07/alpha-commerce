import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  MessageCircle,
  Package,
  CreditCard,
  RefreshCcw,
  Clock,
  Truck,
} from "lucide-react";

interface FAQ {
  q: string;
  a: string;
  icon: React.ElementType;
}

const FAQS: FAQ[] = [
  {
    q: "How fast is Alpha delivery?",
    a: "Alpha delivers in 10–20 minutes for most locations. Estimated delivery time is shown on your order tracking screen after placing an order.",
    icon: Truck,
  },
  {
    q: "What are the delivery charges?",
    a: "Delivery is completely FREE on orders above ₹499. A flat ₹49 delivery fee applies on smaller orders.",
    icon: Package,
  },
  {
    q: "How do I track my order?",
    a: "Go to My Orders from your Profile or tap the Orders tab in the bottom navigation. Your order status updates in real-time — Confirmed → Preparing → Out for Delivery → Delivered.",
    icon: Clock,
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be cancelled within 2 minutes of placing. Once your order moves to Preparing status, cancellation is not possible. Please contact support for urgent cases.",
    icon: RefreshCcw,
  },
  {
    q: "What payment methods are accepted?",
    a: "Currently Alpha accepts Cash on Delivery (COD). UPI, credit/debit cards, and wallet payments are coming soon.",
    icon: CreditCard,
  },
  {
    q: "What if I receive a wrong or damaged item?",
    a: "We sincerely apologize for such instances. Please reach out to our support team within 24 hours with a photo of the item. We will arrange an immediate replacement or refund.",
    icon: HelpCircle,
  },
  {
    q: "How do I change my delivery address?",
    a: "You can add and manage delivery addresses from Profile → Saved Addresses. You can also change the delivery address at checkout before placing your order.",
    icon: Package,
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  const Icon = faq.icon;

  return (
    <div className="flex flex-col overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-start gap-3 px-4 py-4 active:bg-secondary transition-colors text-left w-full"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold flex-1 leading-relaxed">{faq.q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pl-[60px]">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-24 animate-in fade-in duration-300"
      data-testid="page-help-support"
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
          <h1 className="text-xl font-bold">Help & Support</h1>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        {/* Contact support cards */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="mailto:support@alpha.in"
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-border active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-sm font-bold">Email Us</span>
              <span className="text-[11px] text-muted-foreground">support@alpha.in</span>
            </div>
          </a>

          <a
            href="mailto:support@alpha.in?subject=Chat%20Support%20Request"
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-border active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-sm font-bold">Live Chat</span>
              <span className="text-[11px] text-muted-foreground">9 AM – 9 PM</span>
            </div>
          </a>
        </div>

        {/* Response time note */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary/80">
            Average response time: <span className="font-semibold">under 2 hours</span> during business hours.
          </p>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold px-1">Frequently Asked Questions</h2>
          <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <a
          href="mailto:support@alpha.in?subject=Support%20Request"
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </a>
      </div>

      <BottomNav />
    </div>
  );
}
