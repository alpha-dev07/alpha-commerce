import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, LogOut, Zap, Tag, Users, Settings } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

const TABS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/orders", label: "Orders", icon: ClipboardList },
  { path: "/admin/coupons", label: "Coupons", icon: Tag },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AdminLayout() {
  const { adminUser, isAdmin, loading, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <AdminSkeleton />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-bold">
              <span className="text-primary">al</span>pha{" "}
              <span className="text-muted-foreground font-normal text-sm">admin</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground max-w-[140px] truncate hidden sm:block">
              {adminUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border text-xs font-medium text-muted-foreground active:scale-95 transition-transform"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50 overflow-x-auto">
        <div className="flex items-stretch h-16 min-w-max">
          {TABS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative px-3 min-w-max ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                <span className={`text-[10px] font-medium ${active ? "text-primary" : ""}`}>
                  {label}
                </span>
                {active && (
                  <div className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
