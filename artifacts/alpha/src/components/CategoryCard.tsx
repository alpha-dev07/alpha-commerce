import type { Category } from "../data/mockCategories";

export function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon;
  
  return (
    <div 
      className="flex flex-col items-center gap-2"
      data-testid={`category-card-${category.id}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <span className="text-xs font-medium text-center">{category.name}</span>
    </div>
  );
}
