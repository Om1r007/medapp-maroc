import { cn } from "@/lib/cn";

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
} as const;

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function Avatar({ src, firstName, lastName, size = "md", className }: AvatarProps) {
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={cn(
          "rounded-full object-cover",
          SIZE_CLASSES[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-semibold flex-shrink-0",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
