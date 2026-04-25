"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("이 후기를 삭제하시겠어요?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/reviews");
      router.refresh();
    } catch {
      alert("삭제 실패");
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      aria-label="삭제"
    >
      {deleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
