import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PromoBanner } from "../components/PromoBanner";
import { ProductCard } from "../components/ProductCard";
import { BottomNav } from "../components/BottomNav";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";
import { seedProductsIfEmpty } from "../lib/seedProducts";
import { Bell, Package, ChevronDown, Plus, MapPin, Home as HomeIcon, Briefcase, X } from "lucide-react";

interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  // Delivery address state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    seedProductsIfEmpty().catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoadingAddresses(false);
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    getDoc(userDocRef)
      .then((snap) => {
        const addrs = (snap.exists() ? (snap.data().addresses as SavedAddress[]) : []) ?? [];
        setAddresses(addrs);
      })
      .finally(() => setLoadingAddresses(false));
  }, [user?.uid]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const handleSelectAddress = async (id: string) => {
    if (!user || id === defaultAddress?.id) {
      setShowAddressSheet(false);
      return;
    }
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setUpdatingDefaultId(id);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { addresses: updated }, { merge: true });
      setAddresses(updated);
      setShowAddressSheet(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingDefaultId(null);
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
            onClick={() => setShowAddressSheet(true)}
            data-testid="btn-delivery-address"
            className="flex flex-col items-start active:opacity-70 transition-opacity"
          >
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Delivering to
            </span>
            <span className="text-sm font-semibold flex items-center gap-1">
              {loadingAddresses ? (
                "Loading…"
              ) : defaultAddress ? (
                <>
                  {defaultAddress.label} · {defaultAddress.pincode}
                </>
              ) : (
                "Select address"
              )}{" "}
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            </span>
          </button>
          <button
            data-testid="btn-notifications"
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
                  onClick={() => { setQuery(""); setActiveCategory(""); }}
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

      {/* Delivery Address Bottom Sheet */}
      {showAddressSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddressSheet(false)}
          />
          <div className="relative mt-auto w-full max-h-[85dvh] bg-background rounded-t-3xl border-t border-border flex flex-col">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="text-base font-bold">Delivery Address</h3>
              <button
                onClick={() => setShowAddressSheet(false)}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {loadingAddresses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2Spin />
                </div>
              ) : addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-sm font-semibold">No saved addresses</p>
                    <p className="text-xs text-muted-foreground">
                      Add a delivery address to get started
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddressSheet(false);
                      navigate("/addresses");
                    }}
                    data-testid="btn-add-address-empty"
                    className="flex items-center gap-2 px-6 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                </div>
              ) : (
                <>
                  {addresses.map((addr) => {
                    const isCurrent = addr.id === defaultAddress?.id;
                    const isUpdating = updatingDefaultId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectAddress(addr.id)}
                        disabled={updatingDefaultId !== null}
                        data-testid={`select-home-address-${addr.id}`}
                        className={`flex flex-col gap-2 p-3.5 rounded-2xl border text-left transition-colors disabled:opacity-70 ${
                          isCurrent
                            ? "border-primary/40 bg-primary/[0.05]"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {addr.label === "Work" ? (
                                <Briefcase className="w-3 h-3 text-primary" />
                              ) : (
                                <HomeIcon className="w-3 h-3 text-primary" />
                              )}
                            </div>
                            <span className="text-sm font-bold">{addr.label}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Default
                              </span>
                            )}
                          </div>
                          {isUpdating && (
                            <Loader2Spin className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 pl-8">
                          <span className="text-sm font-semibold">{addr.name}</span>
                          <span className="text-xs text-muted-foreground">{addr.addressLine}</span>
                          <span className="text-xs text-muted-foreground">
                            {addr.city} — {addr.pincode}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setShowAddressSheet(false);
                      navigate("/addresses");
                    }}
                    data-testid="btn-add-new-address"
                    className="flex items-center justify-center gap-1.5 mt-1 h-11 rounded-xl border border-dashed border-border text-sm font-medium text-primary active:opacity-70"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </button>
                </>
              )}
              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function Loader2Spin({ className = "w-6 h-6 text-muted-foreground" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
