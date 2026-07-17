import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { Product } from "../types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; product: Product }
  | { type: "REMOVE"; productId: string }
  | { type: "INCREMENT"; productId: string }
  | { type: "DECREMENT"; productId: string }
  | { type: "LOAD"; items: CartItem[] }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const exists = state.items.find((i) => i.product.id === action.product.id);
      if (exists) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.product.id !== action.productId) };
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    case "DECREMENT": {
      const item = state.items.find((i) => i.product.id === action.productId);
      if (!item) return state;
      if (item.quantity <= 1) {
        return { items: state.items.filter((i) => i.product.id !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }
    case "LOAD":
      return { items: action.items };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clearCart: () => void;
  getQuantity: (productId: string) => number;
  totalItems: number;
  totalPrice: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [syncing, setSyncing] = useState(false);
  const firestoreReady = useRef(false);

  // Load cart from Firestore when auth resolves
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      firestoreReady.current = false;
      if (user) {
        try {
          const snap = await getDoc(doc(db, "carts", user.uid));
          if (snap.exists()) {
            dispatch({ type: "LOAD", items: snap.data().items ?? [] });
          }
        } catch {
          // fall through — cart still works locally
        } finally {
          firestoreReady.current = true;
        }
      } else {
        dispatch({ type: "LOAD", items: [] });
      }
    });
    return unsub;
  }, []);

  // Sync cart to Firestore on every change (debounced 600 ms)
  useEffect(() => {
    if (!firestoreReady.current) return;
    const user = auth.currentUser;
    if (!user) return;

    setSyncing(true);
    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, "carts", user.uid), { items: state.items });
      } catch {
        // silent — local state is still correct
      } finally {
        setSyncing(false);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [state.items]);

  const value: CartContextValue = {
    items: state.items,
    addToCart: (product) => dispatch({ type: "ADD", product }),
    removeFromCart: (id) => dispatch({ type: "REMOVE", productId: id }),
    increment: (id) => dispatch({ type: "INCREMENT", productId: id }),
    decrement: (id) => dispatch({ type: "DECREMENT", productId: id }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    getQuantity: (id) => state.items.find((i) => i.product.id === id)?.quantity ?? 0,
    totalItems: state.items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    syncing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
