import { Apple, Milk, Wheat, Cookie, Coffee, Smile } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: any;
}

export const mockCategories: Category[] = [
  { id: "groceries", name: "Groceries", icon: Wheat },
  { id: "fruits", name: "Fruits", icon: Apple },
  { id: "dairy", name: "Dairy", icon: Milk },
  { id: "snacks", name: "Snacks", icon: Cookie },
  { id: "beverages", name: "Beverages", icon: Coffee },
  { id: "personal-care", name: "Personal Care", icon: Smile },
];
