"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/admin";

const OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "일반" },
  { value: "business", label: "기업회원" },
  { value: "admin", label: "관리자" },
];

export default function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: UserRole;
  disabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<UserRole>(currentRole);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    if (newRole === currentRole) return;
    if (newRole === "admin" && !confirm("이 사용자를 관리자로 지정하시겠어요?")) return;
    if (currentRole === "admin" && !confirm("관리자 권한을 해제하시겠어요?")) return;

    setLoading(true);
    setValue(newRole);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "변경 실패");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "변경 실패");
      setValue(currentRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title={disabled ? "본인은 변경할 수 없어요" : ""}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
    </div>
  );
}
