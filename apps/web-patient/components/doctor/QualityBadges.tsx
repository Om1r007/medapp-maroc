const BADGE_ICONS: Record<string, string> = {
  "Médecin Premium": "🏆",
  "Expérimenté": "⭐",
  "Réactif": "⚡",
  "Vétéran Medapp": "🎖️",
  "Bilingue": "🌍",
};

interface QualityBadgesProps {
  badges: string[];
  className?: string;
}

export function QualityBadges({ badges, className = "" }: QualityBadgesProps) {
  if (!badges.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-dark"
        >
          <span>{BADGE_ICONS[badge] ?? "✓"}</span>
          {badge}
        </span>
      ))}
    </div>
  );
}
