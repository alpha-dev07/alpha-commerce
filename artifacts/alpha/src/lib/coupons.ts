import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Coupon, CouponValidationResult } from "../types/coupon";

export function calcDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === "fixed") {
    return Math.min(coupon.value, subtotal);
  }
  const raw = (subtotal * coupon.value) / 100;
  return coupon.maxDiscount !== null ? Math.min(raw, coupon.maxDiscount) : raw;
}

export async function validateCoupon(
  code: string,
  userId: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const upper = code.trim().toUpperCase();
  const snap = await getDocs(
    query(collection(db, "coupons"), where("code", "==", upper))
  );
  if (snap.empty) return { ok: false, error: "Coupon code not found." };

  const couponDoc = snap.docs[0];
  const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

  if (!coupon.isActive) return { ok: false, error: "This coupon is no longer active." };

  if (coupon.expiresAt !== null && coupon.expiresAt < Date.now()) {
    return { ok: false, error: "This coupon has expired." };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }

  if (subtotal < coupon.minOrderValue) {
    const { formatINR } = await import("./currency");
    return {
      ok: false,
      error: `Minimum order of ${formatINR(coupon.minOrderValue)} required for this coupon.`,
    };
  }

  if (!coupon.isPublic && !coupon.allowedUserIds.includes(userId)) {
    return { ok: false, error: "This coupon is not available for your account." };
  }

  const usageRef = doc(db, "couponUsage", `${coupon.id}_${userId}`);
  const usageSnap = await getDoc(usageRef);
  if (usageSnap.exists()) {
    return { ok: false, error: "You have already used this coupon." };
  }

  const discountAmount = Math.round(calcDiscount(coupon, subtotal));
  return { ok: true, coupon, discountAmount };
}

export async function recordCouponUsage(
  coupon: Coupon,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> {
  await setDoc(doc(db, "couponUsage", `${coupon.id}_${userId}`), {
    couponId: coupon.id,
    couponCode: coupon.code,
    userId,
    orderId,
    discountAmount,
    usedAt: Date.now(),
  });
  await updateDoc(doc(db, "coupons", coupon.id), {
    usedCount: increment(1),
  });
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export type CouponInput = Omit<Coupon, "id" | "usedCount" | "createdAt">;

export async function createCoupon(input: CouponInput): Promise<string> {
  const upper = input.code.trim().toUpperCase();
  const existing = await getDocs(
    query(collection(db, "coupons"), where("code", "==", upper))
  );
  if (!existing.empty) throw new Error(`Coupon code "${upper}" already exists.`);

  const ref = await addDoc(collection(db, "coupons"), {
    ...input,
    code: upper,
    usedCount: 0,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateCoupon(
  id: string,
  input: Partial<CouponInput>
): Promise<void> {
  if (input.code) input = { ...input, code: input.code.trim().toUpperCase() };
  await updateDoc(doc(db, "coupons", id), { ...input });
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, "coupons", id));
}

export async function toggleCouponActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, "coupons", id), { isActive });
}

export async function fetchAllCoupons(): Promise<Coupon[]> {
  const snap = await getDocs(collection(db, "coupons"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Coupon))
    .sort((a, b) => b.createdAt - a.createdAt);
}
