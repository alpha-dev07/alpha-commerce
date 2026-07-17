import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import {
  User,
  Mail,
  ChevronRight,
  Package,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  Info,
  HelpCircle,
  LogOut,
} from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  testId: string;
  path: string;
  iconBg?: string;
  iconColor?: string;
}

const MENU_GROUPS: { title?: string; items: MenuItem[] }[] = [
  {
    title: "Account",
    items: [
      {
        icon: Package,
        label: "My Orders",
        testId: "menu-orders",
        path: "/orders",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        icon: MapPin,
        label: "Saved Addresses",
        testId: "menu-addresses",
        path: "/addresses",
        iconBg: "bg-blue-400/10",
        iconColor: "text-blue-400",
      },
      {
        icon: CreditCard,
        label: "Payment Methods",
        testId: "menu-payments",
        path: "/payment-methods",
        iconBg: "bg-amber-400/10",
        iconColor: "text-amber-400",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        icon: Bell,
        label: "Notifications",
        testId: "menu-notifications",
        path: "/notifications",
        iconBg: "bg-purple-400/10",
        iconColor: "text-purple-400",
      },
      {
        icon: Shield,
        label: "Privacy & Security",
        testId: "menu-privacy",
        path: "/privacy-security",
        iconBg: "bg-rose-400/10",
        iconColor: "text-rose-400",
      },
    ],
  },
  {
    title: "More",
    items: [
      {
        icon: Info,
        label: "About Alpha",
        testId: "menu-about",
        path: "/about",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      },
      {
        icon: HelpCircle,
        label: "Help & Support",
        testId: "menu-help",
        path: "/help",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      },
    ],
  },
];

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AU";

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-20 animate-in fade-in duration-300"
      data-testid="page-profile"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="flex items-center px-4 py-4">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        {/* User Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
            {user?.displayName ? (
              <span className="text-xl font-black text-primary">{initials}</span>
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="text-base font-bold truncate"
              data-testid="text-profile-name"
            >
              {user?.displayName ?? "Alpha User"}
            </span>
            <span
              className="text-sm text-muted-foreground flex items-center gap-1.5 truncate"
              data-testid="text-profile-email"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {user?.email}
            </span>
          </div>
        </div>

        {/* Menu groups */}
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-2">
            {group.title && (
              <span className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider">
                {group.title}
              </span>
            )}
            <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
              {group.items.map((item, idx) => (
                <button
                  key={item.label}
                  data-testid={item.testId}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-4 py-3.5 active:bg-secondary transition-colors text-left ${
                    idx < group.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      item.iconBg ?? "bg-muted"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${item.iconColor ?? "text-muted-foreground"}`}
                    />
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button
          onClick={() => navigate("/privacy-security")}
          data-testid="btn-logout"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive font-semibold text-sm active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
