import type { CartItem } from "../context/CartContext";

export interface DeliveryAddress {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
}

export type OrderStatus = "confirmed" | "preparing" | "out_for_delivery" | "delivered";

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: "cash_on_delivery";
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  couponCode: string | null;
  couponDiscount: number | null;
  createdAt: number;
}
