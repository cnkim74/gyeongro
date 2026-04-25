"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminToggle({
  userId,
  isAdmin,
  disabled,
}: {
  userId: string;
  isAdmin: boolean;
  disabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (disabled) return;
    if (isAdmin && !confirm("이 사용자의 관리자 권한을 해제하시겠어요?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("변경 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading || disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isAdmin ? "bg-purple-500" : "bg-gray-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      title={disabled ? "본인은 변경할 수 없어요" : ""}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          isAdmin ? "translate-x-6" : "translate-x-1"
        }`}
      />
      {loading && (
        <Loader2 className="absolute -right-6 w-4 h-4 animate-spin text-gray-400" />
      )}
    </button>
  );
}
