import { useNavigate } from "react-router-dom";
import { Star, Plus, Minus, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatINR } from "../lib/currency";
import type { Product } from "../types/product";

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${
            s <= full ? "fill-yellow-400 text-yellow-400" : "text-muted fill-muted"
          }`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-0.5">{rating}</span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { addToCart, increment, decrement, getQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const qty = getQuantity(product.id);
  const wishlisted = isWishlisted(product.id);

  return (
    <div
      className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      data-testid={`product-card-${product.id}`}
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

        {/* Wishlist heart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          data-testid={`btn-wishlist-${product.id}`}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center z-20 active:scale-90 transition-transform"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              wishlisted ? "fill-rose-500 text-rose-500" : "text-white/80"
            }`}
          />
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
        <RatingStars rating={product.rating} />

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-primary" data-testid={`price-${product.id}`}>
            {formatINR(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatINR(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Cart controls — stop click propagation so card tap ≠ add */}
        <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          {qty === 0 ? (
            <button
              disabled={!product.inStock}
              onClick={() => addToCart(product)}
              className="w-full h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1 active:bg-primary/20 transition-colors disabled:opacity-40"
              data-testid={`btn-add-${product.id}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-primary rounded-lg h-8 px-0.5">
              <button
                onClick={() => decrement(product.id)}
                className="w-8 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
                data-testid={`btn-dec-${product.id}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                className="text-xs font-bold text-primary-foreground w-5 text-center"
                data-testid={`qty-${product.id}`}
              >
                {qty}
              </span>
              <button
                onClick={() => increment(product.id)}
                className="w-8 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
                data-testid={`btn-inc-${product.id}`}
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
