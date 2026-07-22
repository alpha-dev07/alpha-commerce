import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PromoBanner } from "../components/PromoBanner";
import { BannerCarousel } from "../components/BannerCarousel";
import { ProductCard } from "../components/ProductCard";
import { BottomNav } from "../components/BottomNav";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";
import { seedProductsIfEmpty } from "../lib/seedProducts";
import { Bell, Package, MapPin, X, Check, Loader2 } from "lucide-react";

interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export function Home() {
  const { user } = useAuth();
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const navigate = useNavigate();

  // Delivery address sheet state
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [savingAddressId, setSavingAddressId] = useState<string | null>(null);

  useEffect(() => {
    seedProductsIfEmpty().catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setAddressesLoading(false);
      return;
    }

    let isMounted = true;
    setAddressesLoading(true);
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!isMounted) return;
        const data = snap.exists() ? snap.data() : null;
        const list: Address[] = Array.isArray(data?.addresses) ? data.addresses : [];
        setAddresses(list);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setAddressesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const handleOpenAddressSheet = () => {
    setShowAddressSheet(true);
  };

  const handleCloseAddressSheet = () => {
    setShowAddressSheet(false);
  };

  const handleSelectAddress = async (id: string) => {
    if (!user) return;
    const previous = addresses;
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    setSavingAddressId(id);
    setShowAddressSheet(false);
    try {
      await setDoc(doc(db, "users", user.uid), { addresses: updated }, { merge: true });
    } catch (err) {
      console.error(err);
      setAddresses(previous);
    } finally {
      setSavingAddressId(null);
    }
  };

  const isFiltered = query.trim() !== "" || activeCategory !== "";

  const filtered = products.filter((p) => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const featured = products.filter((p) => p.featured);
  const bestSellers = products.filter((p) => p.bestSeller);
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-20 animate-in fade-in duration-300"
      data-testid="page-home"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={handleOpenAddressSheet}
            data-testid="btn-delivery-address"
            className="flex flex-col items-start active:opacity-70 transition-opacity"
          >
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Delivering to
            </span>
            <span className="text-sm font-semibold flex items-center gap-1">
              {defaultAddress
                ? `${defaultAddress.label}${defaultAddress.pincode ? ` · ${defaultAddress.pincode}` : ""}`
                : "Home · 10001"}{" "}
              <span className="text-primary text-xs">▼</span>
            </span>
          </button>
          <button
            type="button"
            data-testid="btn-notifications"
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <Bell className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="px-4 pb-3 flex flex-col gap-2">
          <SearchBar value={query} onChange={setQuery} />
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-4 py-4">
        {/* Offer Banner Carousel — sits directly below the search bar */}
        <BannerCarousel />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading products...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-sm text-destructive font-medium">Failed to load products</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : isFiltered ? (
          /* ── Filtered Results ── */
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "result" : "results"}
              {query.trim() ? ` for "${query.trim()}"` : ""}
            </p>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Package className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No products found</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("");
                  }}
                  className="text-sm text-primary font-medium"
                  data-testid="btn-clear-filters"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Default Home View ── */
          <>
            {firstName && (
              <p className="text-sm text-muted-foreground -mb-2">
                Hey, <span className="font-semibold text-foreground">{firstName}</span> 👋
              </p>
            )}

            <PromoBanner />

            {/* Featured */}
            {(loading || featured.length > 0) && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Featured</h3>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary active:opacity-70 transition-opacity"
                    onClick={() => setActiveCategory("")}
                  >
                    See all
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar">
                  {featured.map((product) => (
                    <div key={product.id} className="snap-start w-40 flex-shrink-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Sellers */}
            {(loading || bestSellers.length > 0) && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Best Sellers</h3>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary active:opacity-70 transition-opacity"
                    onClick={() => setActiveCategory("")}
                  >
                    See all
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar">
                  {bestSellers.map((product) => (
                    <div key={product.id} className="snap-start w-40 flex-shrink-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All products fallback — when no featured/bestSeller flags yet */}
            {!loading && featured.length === 0 && bestSellers.length === 0 && products.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold">All Products</h3>
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Delivery Address Bottom Sheet */}
      {showAddressSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 animate-in fade-in duration-200"
          onClick={handleCloseAddressSheet}
        >
          <div
            className="w-full bg-card rounded-t-3xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            data-testid="address-sheet"
          >
            <div className="flex items-center justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h2 className="text-base font-bold">Delivery Address</h2>
              <button
                type="button"
                onClick={handleCloseAddressSheet}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                data-testid="btn-close-address-sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-2 pb-6">
              {addressesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <MapPin className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No saved addresses</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {addresses.map((address) => (
                    <button
                      type="button"
                      key={address.id}
                      onClick={() => handleSelectAddress(address.id)}
                      disabled={savingAddressId === address.id}
                      data-testid={`address-option-${address.id}`}
                      className="w-full flex items-center gap-3 py-3.5 text-left disabled:opacity-60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold">{address.label}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {address.line1}, {address.city} {address.pincode}
                        </span>
                      </div>
                      {savingAddressId === address.id ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                      ) : address.isDefault ? (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

