"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff } from "lucide-react";

interface Board {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_published: boolean;
  is_admin_only: boolean;
  post_count: number;
}

export default function BoardManager({
  initialBoards,
}: {
  initialBoards: Board[];
}) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const update = (id: string, field: keyof Board, value: unknown) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const save = async (b: Board) => {
    setSavingId(b.id);
    try {
      const res = await fetch(`/api/admin/boards/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: b.slug,
          name: b.name,
          description: b.description,
          icon: b.icon,
          display_order: b.display_order,
          is_published: b.is_published,
          is_admin_only: b.is_admin_only,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (
      !confirm(
        "이 게시판을 삭제하시겠어요?\n게시판이 삭제되면 해당 글들은 게시판이 없는 상태가 됩니다."
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/boards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBoards((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    } catch {
      alert("삭제 실패");
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const slug = `new-board-${Date.now().toString(36)}`;
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: "새 게시판",
          icon: "📋",
          display_order: boards.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setBoards((prev) => [
        ...prev,
        {
          id: data.id,
          slug,
          name: "새 게시판",
          description: "",
          icon: "📋",
          display_order: prev.length + 1,
          is_published: true,
          is_admin_only: false,
          post_count: 0,
        },
      ]);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          💡 slug는 URL에 사용됩니다 (영문/숫자/하이픈만). 예: <code>notice</code> →{" "}
          <code>/board/notice</code>
        </p>
        <button
          onClick={create}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          게시판 추가
        </button>
      </div>

      <div className="space-y-3">
        {boards.map((b) => (
          <div
            key={b.id}
            className={`bg-white rounded-2xl border border-gray-100 p-5 ${
              !b.is_published ? "opacity-60" : ""
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  아이콘
                </label>
                <input
                  type="text"
                  value={b.icon ?? ""}
                  onChange={(e) => update(b.id, "icon", e.target.value)}
                  maxLength={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-center text-xl"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  게시판 이름
                </label>
                <input
                  type="text"
                  value={b.name}
                  onChange={(e) => update(b.id, "name", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={b.slug}
                  onChange={(e) =>
                    update(
                      b.id,
                      "slug",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  순서
                </label>
                <input
                  type="number"
                  value={b.display_order}
                  onChange={(e) =>
                    update(b.id, "display_order", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  글 수
                </label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 text-center">
                  {b.post_count}
                </div>
              </div>

              <div className="md:col-span-3 flex items-end gap-2">
                <button
                  onClick={() => update(b.id, "is_published", !b.is_published)}
                  className={`p-2 rounded-lg ${
                    b.is_published
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  title={b.is_published ? "공개 중" : "비공개"}
                >
                  {b.is_published ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => save(b)}
                  disabled={savingId === b.id}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {savingId === b.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  저장
                </button>
                <button
                  onClick={() => remove(b.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-10">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  설명
                </label>
                <input
                  type="text"
                  value={b.description ?? ""}
                  onChange={(e) => update(b.id, "description", e.target.value)}
                  placeholder="이 게시판에 대한 짧은 설명"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b.is_admin_only}
                    onChange={(e) => update(b.id, "is_admin_only", e.target.checked)}
                    className="w-4 h-4"
                  />
                  관리자만 작성
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {boards.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 mb-4">아직 등록된 게시판이 없어요</p>
          <button
            onClick={create}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />첫 게시판 추가
          </button>
        </div>
      )}
    </div>
  );
}
