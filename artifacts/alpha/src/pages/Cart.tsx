import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatINR } from "../lib/currency";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  ArrowRight,
  CloudUpload,
} from "lucide-react";

const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 49;

function EmptyCart() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 py-24 px-8">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-card border border-border flex items-center justify-center">
          <ShoppingCart className="w-14 h-14 text-muted-foreground/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
          Looks like you haven't added anything yet. Start browsing!
        </p>
      </div>
      <button
        onClick={() => navigate("/home")}
        data-testid="btn-browse-products"
        className="flex items-center gap-2 px-6 h-11 rounded-xl border border-primary text-primary font-semibold text-sm active:scale-[0.97] transition-transform"
      >
        Browse Products
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Cart() {
  const navigate = useNavigate();
  const { items, increment, decrement, removeFromCart, totalItems, totalPrice, syncing } =
    useCart();

  const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const orderTotal = totalPrice + deliveryFee;
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice);
  const freeDeliveryProgress = Math.min(100, (totalPrice / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col" data-testid="page-cart">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            data-testid="btn-cart-back"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-xl font-bold">My Cart</h1>
            {totalItems > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          {syncing && (
            <CloudUpload className="w-4 h-4 text-muted-foreground animate-pulse" />
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          {/* Scrollable body */}
          <div className="flex flex-col gap-4 px-4 py-4 pb-44">
            {/* Free delivery progress */}
            {totalPrice < FREE_DELIVERY_THRESHOLD && (
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Add{" "}
                      <span className="font-bold text-foreground">
                        {formatINR(amountToFreeDelivery)}
                      </span>{" "}
                      more for free delivery
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            )}

            {totalPrice >= FREE_DELIVERY_THRESHOLD && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                <Truck className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  You qualify for free delivery!
                </span>
              </div>
            )}

            {/* Cart items */}
            <div className="flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-2xl bg-card border border-border"
                  data-testid={`cart-item-${product.id}`}
                >
                  {/* Color swatch */}
                  <div
                    className="w-16 h-16 rounded-xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${product.imageColor}55 0%, #0a0a0a 100%)`,
                    }}
                  />

                  {/* Info */}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold leading-tight truncate">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {product.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        data-testid={`btn-remove-${product.id}`}
                        className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive active:scale-90 transition-transform shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-bold text-primary" data-testid={`cart-price-${product.id}`}>
                        {formatINR(product.price * quantity)}
                      </span>

                      {/* Qty controls */}
                      <div className="flex items-center bg-primary rounded-lg h-7 px-0.5">
                        <button
                          onClick={() => decrement(product.id)}
                          data-testid={`btn-cart-dec-${product.id}`}
                          className="w-7 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className="text-xs font-bold text-primary-foreground w-5 text-center"
                          data-testid={`cart-qty-${product.id}`}
                        >
                          {quantity}
                        </span>
                        <button
                          onClick={() => increment(product.id)}
                          data-testid={`btn-cart-inc-${product.id}`}
                          className="w-7 h-full flex items-center justify-center text-primary-foreground active:opacity-70"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border">
              <Truck className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Delivering to Home · 10001</span>
                <span className="text-xs text-muted-foreground">Estimated 10–20 mins</span>
              </div>
            </div>

            {/* Price summary */}
            <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-sm font-bold">Order Summary</span>
              </div>
              <div className="flex flex-col gap-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                  <span className="text-sm font-semibold" data-testid="text-subtotal">
                    {formatINR(totalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Delivery fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-sm font-bold text-primary" data-testid="text-delivery-fee">
                      FREE
                    </span>
                  ) : (
                    <span className="text-sm font-semibold" data-testid="text-delivery-fee">
                      {formatINR(deliveryFee)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-xl font-bold text-primary" data-testid="text-order-total">
                    {formatINR(orderTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed checkout CTA */}
          <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40">
            <button
              data-testid="btn-proceed-checkout"
              className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform py-3"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Secure checkout — 128-bit SSL encrypted
            </p>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
