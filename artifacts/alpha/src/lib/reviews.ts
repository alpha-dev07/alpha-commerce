import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ReviewInput } from "../types/review";

export async function recalcProductRating(productId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, "reviews"), where("productId", "==", productId))
  );
  const ratings = snap.docs.map((d) => (d.data().rating as number) ?? 0);
  const count = ratings.length;
  const avg =
    count === 0
      ? 0
      : Math.round((ratings.reduce((s, r) => s + r, 0) / count) * 10) / 10;
  await updateDoc(doc(db, "products", productId), {
    rating: avg,
    reviewCount: count,
  });
}

export async function addReview(input: ReviewInput): Promise<string> {
  const existing = await getDocs(
    query(
      collection(db, "reviews"),
      where("productId", "==", input.productId),
      where("userId", "==", input.userId)
    )
  );
  if (!existing.empty) {
    throw new Error("You have already reviewed this product.");
  }
  const now = Date.now();
  const ref = await addDoc(collection(db, "reviews"), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  await recalcProductRating(input.productId);
  return ref.id;
}

export async function updateReview(
  reviewId: string,
  productId: string,
  patch: { rating: number; title: string; body: string }
): Promise<void> {
  await updateDoc(doc(db, "reviews", reviewId), {
    ...patch,
    updatedAt: Date.now(),
  });
  await recalcProductRating(productId);
}

export async function deleteReview(reviewId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, "reviews", reviewId));
  await recalcProductRating(productId);
}
