"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-amber-400 text-amber-400" : "text-gray-300"}
            />
          </button>
        );
      })}
    </div>
  );
}

export function StarDisplay({
  score,
  size = 14,
  showNumber = true,
}: {
  score: number | null;
  size?: number;
  showNumber?: boolean;
}) {
  if (score === null) return null;

  const full = Math.floor(score);
  const half = score - full >= 0.5;

  return (
    <span className="inline-flex items-center gap-1">
      <Star
        style={{ width: size, height: size }}
        className="fill-amber-400 text-amber-400"
      />
      {showNumber && (
        <span className="text-sm font-semibold text-gray-800">
          {score.toFixed(1)}
        </span>
      )}
    </span>
  );
}
