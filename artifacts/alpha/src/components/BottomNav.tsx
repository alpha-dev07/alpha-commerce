import { Home, ShoppingCart, Receipt, User, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  const navItems = [
    { icon: Home, label: "Home", path: "/home", testId: "nav-home" },
    {
      icon: Heart,
      label: "Wishlist",
      path: "/wishlist",
      testId: "nav-wishlist",
      badge: totalWishlist > 0 ? totalWishlist : undefined,
      badgeColor: "bg-rose-500",
    },
    {
      icon: ShoppingCart,
      label: "Cart",
      path: "/cart",
      testId: "nav-cart",
      badge: totalItems > 0 ? totalItems : undefined,
      badgeColor: "bg-primary",
    },
    { icon: Receipt, label: "Orders", path: "/orders", testId: "nav-orders" },
    { icon: User, label: "Profile", path: "/profile", testId: "nav-profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#000000] border-t border-border flex items-center justify-around px-2 pb-safe z-50">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path === "/home" && location.pathname === "/");
        const isWishlistTab = item.path === "/wishlist";
        return (
          <button
            key={item.path}
            data-testid={item.testId}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ease-out active:scale-95 ${
              isActive
                ? isWishlistTab
                  ? "text-rose-400"
                  : "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <item.icon
                className={`w-6 h-6 mb-1 ${
                  isActive && isWishlistTab
                    ? "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] fill-rose-400 text-rose-400"
                    : isActive
                    ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    : ""
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-2 ${item.badgeColor ?? "bg-primary"} text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
