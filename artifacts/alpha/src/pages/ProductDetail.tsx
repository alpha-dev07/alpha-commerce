import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { BottomNav } from "../components/BottomNav";
import { formatINR } from "../lib/currency";
import { ChevronLeft, Star, Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import { ReviewsSection } from "../components/ReviewsSection";
import type { Product } from "../types/product";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, increment, decrement, getQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const qty = product ? getQuantity(product.id) : 0;
  const wishlisted = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "products", id)).then((d) => {
      if (d.exists()) {
        setProduct({ id: d.id, ...d.data() } as Product);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-sm">Product not found.</p>
        <button onClick={() => navigate(-1)} className="text-primary font-medium text-sm">
          Go back
        </button>
      </div>
    );
  }

  const fullStars = Math.floor(product.rating);
  const savings = product.originalPrice - product.price;

  return (
    <div
      className="min-h-[100dvh] bg-background pb-36 animate-in fade-in duration-300"
      data-testid="page-product-detail"
    >
      {/* Hero Image */}
      <div
        className="relative w-full h-72"
        style={{
          background: `linear-gradient(160deg, ${product.imageColor}55 0%, #000000 100%)`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${product.imageColor}33, transparent 70%)`,
          }}
        />

        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          data-testid="btn-back"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center active:scale-90 transition-transform z-10"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Wishlist heart button */}
        <button
          onClick={() => toggleWishlist(product.id)}
          data-testid="btn-wishlist-detail"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center active:scale-90 transition-transform z-10"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              wishlisted ? "fill-rose-500 text-rose-500" : "text-white"
            }`}
          />
        </button>

        {/* Discount badge — bottom-left of hero */}
        {product.discount > 0 && (
          <div className="absolute bottom-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-lg z-10">
            -{product.discount}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Category + Name */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-primary uppercase tracking-widest capitalize">
            {product.category.replace("-", " ")}
          </span>
          <h1 className="text-2xl font-bold leading-tight" data-testid="text-product-name">
            {product.name}
          </h1>
          <span className="text-sm text-muted-foreground">{product.unit}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= fullStars ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold">{product.rating}</span>
          <span className="text-sm text-muted-foreground">
            ({product.reviewCount.toLocaleString("en-IN")} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
            {formatINR(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatINR(product.originalPrice)}
              </span>
              <span className="text-sm font-semibold text-primary/80">
                Save {formatINR(savings)}
              </span>
            </>
          )}
        </div>

        {/* Wishlist shortcut row */}
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-colors active:scale-[0.98] ${
            wishlisted
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-card border-border text-muted-foreground"
          }`}
          data-testid="btn-wishlist-row"
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`}
          />
          <span className="text-sm font-semibold">
            {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
          </span>
        </button>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Description */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">About this item</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Reviews */}
        <ReviewsSection productId={product.id} />

        {/* Out of stock notice */}
        {!product.inStock && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium text-center">
            Currently out of stock
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40">
        {qty === 0 ? (
          <button
            disabled={!product.inStock}
            onClick={() => addToCart(product)}
            data-testid="btn-add-to-cart"
            className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 py-3"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-primary rounded-xl flex-1 h-12">
              <button
                onClick={() => decrement(product.id)}
                data-testid="btn-dec-product"
                className="flex-1 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span
                className="text-lg font-bold text-primary-foreground w-10 text-center"
                data-testid="qty-product"
              >
                {qty}
              </span>
              <button
                onClick={() => increment(product.id)}
                data-testid="btn-inc-product"
                className="flex-1 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-primary" data-testid="text-cart-total">
                {formatINR(product.price * qty)}
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
