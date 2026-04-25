"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Loader2 } from "lucide-react";

export default function PostActions({
  postId,
  canEdit,
}: {
  postId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!canEdit) return null;

  const handleDelete = async () => {
    if (!confirm("이 게시글을 삭제하시겠어요?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/board");
      router.refresh();
    } catch {
      alert("삭제 실패");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/board/${postId}/edit`}
        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        aria-label="수정"
      >
        <Edit2 className="w-4 h-4" />
      </Link>
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
    </div>
  );
}
