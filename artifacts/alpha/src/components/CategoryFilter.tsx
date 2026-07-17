import { Apple, Milk, Wheat, Cookie, Coffee, Smile, LayoutGrid } from "lucide-react";

const filters = [
  { id: "", label: "All", icon: LayoutGrid },
  { id: "groceries", label: "Groceries", icon: Wheat },
  { id: "fruits", label: "Fruits", icon: Apple },
  { id: "dairy", label: "Dairy", icon: Milk },
  { id: "snacks", label: "Snacks", icon: Cookie },
  { id: "beverages", label: "Beverages", icon: Coffee },
  { id: "personal-care", label: "Personal Care", icon: Smile },
];

interface CategoryFilterProps {
  active: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
      {filters.map((f) => {
        const isActive = active === f.id;
        const Icon = f.icon;
        return (
          <button
            key={f.id || "all"}
            onClick={() => onChange(f.id)}
            data-testid={`filter-${f.id || "all"}`}
            className={`flex items-center gap-1.5 px-3.5 h-9 rounded-full whitespace-nowrap shrink-0 text-sm font-medium transition-all active:scale-95 border ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
