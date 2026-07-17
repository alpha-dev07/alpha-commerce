export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReviewInput {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
}
