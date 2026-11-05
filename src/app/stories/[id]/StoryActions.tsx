"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Loader2, Pencil } from "lucide-react";

export default function StoryActions({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("이 스토리를 삭제하시겠어요?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/stories");
      router.refresh();
    } catch {
      alert("삭제 실패");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/stories/${storyId}/edit`}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Pencil className="w-4 h-4" /> 수정
      </Link>
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      aria-label="삭제"
    >
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
    </div>
  );
}
