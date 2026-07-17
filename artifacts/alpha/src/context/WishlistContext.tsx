import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface WishlistContextValue {
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  totalWishlist: number;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlistIds: new Set(),
  toggleWishlist: () => {},
  isWishlisted: () => false,
  totalWishlist: 0,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      if (!user) setWishlistIds(new Set());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!userId) return;
    const docRef = doc(db, "wishlists", userId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setWishlistIds(new Set((snap.data().productIds as string[]) ?? []));
      } else {
        setWishlistIds(new Set());
      }
    });
    return unsub;
  }, [userId]);

  const toggleWishlist = (productId: string) => {
    if (!userId) return;
    const newIds = new Set(wishlistIds);
    if (newIds.has(productId)) {
      newIds.delete(productId);
    } else {
      newIds.add(productId);
    }
    setWishlistIds(newIds);
    setDoc(doc(db, "wishlists", userId), { productIds: Array.from(newIds) });
  };

  const isWishlisted = (productId: string) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, toggleWishlist, isWishlisted, totalWishlist: wishlistIds.size }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
