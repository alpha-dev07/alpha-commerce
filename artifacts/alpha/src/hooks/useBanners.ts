import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  targetType: "product" | "category";
  targetId: string;
  isActive: boolean;
  priority: number;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);

    getDocs(collection(db, "banners"))
      .then((snap) => {
        if (!isMountedRef.current) return;
        const list: Banner[] = snap.docs
          .map((d) => {
            const data = d.data() as Omit<Banner, "id">;
            return { id: d.id, ...data };
          })
          // Only show active banners
          .filter((b) => b.isActive === true)
          // Sort by priority (ascending — lower number = shown first)
          .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

        setBanners(list);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load banners:", err);
        if (isMountedRef.current) setError(err.message ?? "Failed to load banners");
      })
      .finally(() => {
        if (isMountedRef.current) setLoading(false);
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { banners, loading, error };
}
