import {
  ROLE_LABELS,
  ROLE_EMOJIS,
  ROLE_COLORS,
  parseRole,
  type UserRole,
} from "@/lib/admin";

interface RoleBadgeProps {
  role?: UserRole | string | null;
  size?: "xs" | "sm" | "md";
  showEmoji?: boolean;
  showLabel?: boolean;
  /** user(여행자) 뱃지를 강제로 보여줄지 — 기본은 size="md"일 때만 */
  showTraveler?: boolean;
}

const SIZE_MAP = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export default function RoleBadge({
  role,
  size = "sm",
  showEmoji = true,
  showLabel = true,
  showTraveler,
}: RoleBadgeProps) {
  const r: UserRole = parseRole(role);

  // 여행자 뱃지는 너무 흔하니 기본 노출 ❌ (size=md 또는 showTraveler=true 일 때만)
  const shouldShowTraveler = showTraveler ?? size === "md";
  if (r === "user" && !shouldShowTraveler) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-semibold whitespace-nowrap ${ROLE_COLORS[r]} ${SIZE_MAP[size]}`}
    >
      {showEmoji && <span>{ROLE_EMOJIS[r]}</span>}
      {showLabel && <span>{ROLE_LABELS[r]}</span>}
    </span>
  );
}
