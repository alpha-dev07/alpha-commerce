export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  unit: string;
  imageColor: string;
  description: string;
  inStock: boolean;
  featured: boolean;
  bestSeller: boolean;
  stock?: number;
  imageUrl?: string;
}
