export interface Product {
  id: string;
  name: string;
  price: number;
  imageColor: string;
  unit: string;
  category: string;
}

export const mockProducts: Product[] = [
  { id: "1", name: "Full Fat Milk", price: 58, imageColor: "bg-blue-900/50", unit: "1 L", category: "dairy" },
  { id: "2", name: "Whole Wheat Bread", price: 45, imageColor: "bg-amber-900/50", unit: "1 Loaf", category: "groceries" },
  { id: "3", name: "Organic Bananas", price: 49, imageColor: "bg-yellow-900/50", unit: "1 kg", category: "fruits" },
  { id: "4", name: "Sea Salt Chips", price: 30, imageColor: "bg-red-900/50", unit: "150 g", category: "snacks" },
  { id: "5", name: "Fresh Orange Juice", price: 99, imageColor: "bg-orange-900/50", unit: "1 L", category: "beverages" },
  { id: "6", name: "Whitening Toothpaste", price: 89, imageColor: "bg-teal-900/50", unit: "100 g", category: "personal-care" },
  { id: "7", name: "Free-Range Eggs", price: 99, imageColor: "bg-orange-800/50", unit: "12 pack", category: "dairy" },
  { id: "8", name: "Red Apples", price: 129, imageColor: "bg-red-800/50", unit: "1 kg", category: "fruits" },
];

export const featuredProducts = mockProducts.slice(0, 4);
export const bestSellers = mockProducts.slice(4, 8);
