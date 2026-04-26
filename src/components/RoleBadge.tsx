import { ROLE_LABELS, ROLE_EMOJIS, ROLE_COLORS, type UserRole } from "@/lib/admin";

interface RoleBadgeProps {
  role?: UserRole | string | null;
  size?: "xs" | "sm" | "md";
  showEmoji?: boolean;
  showLabel?: boolean;
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
}: RoleBadgeProps) {
  const r = (role as UserRole) ?? "user";
  if (r !== "user" && r !== "business" && r !== "admin") return null;
  // 일반회원(여행자)은 너무 흔하니 기본적으로 안 보이게 (옵션으로 제어)
  if (r === "user" && size !== "md") return null;

  const label = ROLE_LABELS[r];
  const emoji = ROLE_EMOJIS[r];
  const color = ROLE_COLORS[r];

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-semibold whitespace-nowrap ${color} ${SIZE_MAP[size]}`}
    >
      {showEmoji && <span>{emoji}</span>}
      {showLabel && <span>{label}</span>}
    </span>
  );
}
