import { useState } from "react";
import { Star } from "lucide-react";

interface StarPickerProps {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "lg";
  readonly?: boolean;
}

const LABELS = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

export function StarPicker({ value, onChange, size = "lg", readonly = false }: StarPickerProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const starSize = size === "lg" ? "w-8 h-8" : "w-5 h-5";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => !readonly && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(s)}
            onMouseEnter={() => !readonly && setHovered(s)}
            className={`transition-transform ${!readonly ? "active:scale-110 cursor-pointer" : "cursor-default"}`}
          >
            <Star
              className={`${starSize} transition-colors ${
                s <= active
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      {size === "lg" && !readonly && (
        <span
          className={`text-sm font-semibold transition-colors ${
            active > 0 ? "text-yellow-400" : "text-muted-foreground"
          }`}
        >
          {active > 0 ? LABELS[active] : "Tap to rate"}
        </span>
      )}
    </div>
  );
}
