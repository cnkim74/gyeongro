"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, Trash2, Loader2, RotateCcw } from "lucide-react";

export default function AdminPostActions({
  postId,
  isPinned,
  isDeleted,
}: {
  postId: string;
  isPinned: boolean;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const callApi = async (action: string, body: object) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("실패");
    } finally {
      setLoading(null);
    }
  };

  const togglePin = () => callApi("pin", { is_pinned: !isPinned } as object);
  const restoreDelete = () =>
    callApi("restore", { is_deleted: false } as object);

  const handleDelete = async () => {
    if (!confirm("이 게시글을 삭제하시겠어요?")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제 실패");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {isDeleted ? (
        <button
          onClick={restoreDelete}
          disabled={loading !== null}
          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50"
          title="복원"
        >
          {loading === "restore" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </button>
      ) : (
        <>
          <button
            onClick={togglePin}
            disabled={loading !== null}
            className={`p-1.5 rounded-lg transition-colors ${
              isPinned
                ? "text-orange-500 bg-orange-50"
                : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
            }`}
            title={isPinned ? "고정 해제" : "고정"}
          >
            {loading === "pin" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading !== null}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="삭제"
          >
            {loading === "delete" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
