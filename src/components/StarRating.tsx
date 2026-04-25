"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
}

const SIZE_MAP = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  showValue = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const sizeClass = SIZE_MAP[size];

  return (
    <div className="inline-flex items-center gap-1">
      <div className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= display;
          if (readonly) {
            return (
              <Star
                key={star}
                className={`${sizeClass} ${
                  filled ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                }`}
              />
            );
          }
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange?.(star)}
              className="p-0.5 hover:scale-110 transition-transform"
              aria-label={`${star}점`}
            >
              <Star
                className={`${sizeClass} transition-colors ${
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-sm font-semibold text-gray-700 ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
