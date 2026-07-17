export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  expiresAt: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  isPublic: boolean;
  allowedUserIds: string[];
  createdAt: number;
}

export type CouponInput = Omit<Coupon, "id" | "usedCount" | "createdAt">;

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

export type CouponValidationResult =
  | { ok: true; coupon: Coupon; discountAmount: number }
  | { ok: false; error: string };
