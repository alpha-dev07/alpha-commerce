import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { BottomNav } from "../components/BottomNav";
import { formatINR } from "../lib/currency";
import type { Product } from "../types/product";
import {
  Heart,
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
  Star,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";

function WishlistProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { toggleWishlist } = useWishlist();
  const { addToCart, increment, decrement, getQuantity } = useCart();
  const qty = getQuantity(product.id);
  const fullStars = Math.floor(product.rating);

  return (
    <div
      className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform relative"
      data-testid={`wishlist-card-${product.id}`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div
        className="w-full h-28 relative"
        style={{
          background: `linear-gradient(135deg, ${product.imageColor}55 0%, #0a0a0a 100%)`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 60% 35%, ${product.imageColor}44, transparent 70%)`,
          }}
        />
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10">
            -{product.discount}%
          </span>
        )}

        {/* Wishlist remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          data-testid={`btn-wishlist-remove-${product.id}`}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center z-20 active:scale-90 transition-transform"
        >
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
        </button>

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <span className="text-[10px] font-semibold text-muted-foreground">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2.5 flex-grow">
        <span className="text-[10px] text-muted-foreground capitalize">{product.unit}</span>
        <span className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</span>

        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3 h-3 ${
                s <= fullStars ? "fill-yellow-400 text-yellow-400" : "text-muted fill-muted"
              }`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-0.5">{product.rating}</span>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-primary">{formatINR(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatINR(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Cart controls */}
        <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          {qty === 0 ? (
            <button
              disabled={!product.inStock}
              onClick={() => addToCart(product)}
              className="w-full h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1 active:bg-primary/20 transition-colors disabled:opacity-40"
              data-testid={`btn-wishlist-add-cart-${product.id}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-primary rounded-lg h-8 px-0.5">
              <button
                onClick={() => decrement(product.id)}
                className="w-8 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-primary-foreground w-5 text-center">
                {qty}
              </span>
              <button
                onClick={() => increment(product.id)}
                className="w-8 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Wishlist() {
  const navigate = useNavigate();
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = Array.from(wishlistIds);

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(ids.map((id) => getDoc(doc(db, "products", id)))).then((docs) => {
      const fetched = docs
        .filter((d) => d.exists())
        .map((d) => ({ id: d.id, ...d.data() } as Product));
      setProducts(fetched);
      setLoading(false);
    });
  }, [wishlistIds]);

  const isEmpty = !loading && products.length === 0;

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-20 animate-in fade-in duration-300"
      data-testid="page-wishlist"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h1 className="text-xl font-bold">Wishlist</h1>
          </div>
          {products.length > 0 && (
            <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading wishlist...</p>
        </div>
      ) : isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-28 gap-5 px-6">
          <div className="w-28 h-28 rounded-full bg-card border border-border flex items-center justify-center">
            <Heart className="w-12 h-12 text-muted-foreground/30" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-bold">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
              Tap the heart icon on any product to save it here for later.
            </p>
          </div>
          <button
            onClick={() => navigate("/home")}
            data-testid="btn-browse-products"
            className="flex items-center gap-2 px-6 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4">
          {/* Quick add-all to cart hint */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border">
            <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              Tap <span className="font-semibold text-foreground">Add</span> on any card to move it to your cart.
            </p>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <WishlistProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
