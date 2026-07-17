import { useState, useEffect } from "react";
import { PromoBanner } from "../components/PromoBanner";
import { ProductCard } from "../components/ProductCard";
import { BottomNav } from "../components/BottomNav";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";
import { seedProductsIfEmpty } from "../lib/seedProducts";
import { Bell, Package } from "lucide-react";

export function Home() {
  const { user } = useAuth();
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    seedProductsIfEmpty().catch(console.error);
  }, []);

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
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Delivering to
            </span>
            <span className="text-sm font-semibold flex items-center gap-1">
              Home · 10001{" "}
              <span className="text-primary text-xs">▼</span>
            </span>
          </div>
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

      <BottomNav />
    </div>
  );
}
