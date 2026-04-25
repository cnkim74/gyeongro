"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff } from "lucide-react";

interface Product {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_url: string;
  price_text: string | null;
  display_order: number;
  is_active: boolean;
}

const CATEGORIES = [
  { value: "connectivity", label: "통신 (와이파이/이심)" },
  { value: "power", label: "전원·충전" },
  { value: "luggage", label: "캐리어·짐" },
  { value: "comfort", label: "편의용품" },
  { value: "health", label: "건강·약품" },
  { value: "etc", label: "기타" },
];

export default function AffiliateManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const updateField = (id: string, field: keyof Product, value: unknown) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const save = async (p: Product) => {
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/affiliate-products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: p.category,
          name: p.name,
          description: p.description,
          image_url: p.image_url,
          affiliate_url: p.affiliate_url,
          price_text: p.price_text,
          display_order: p.display_order,
          is_active: p.is_active,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("저장 실패");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 상품을 삭제하시겠어요?")) return;
    try {
      const res = await fetch(`/api/admin/affiliate-products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch {
      alert("삭제 실패");
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/affiliate-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "etc",
          name: "신규 상품",
          affiliate_url: "https://link.coupang.com/",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setProducts((prev) => [
        ...prev,
        {
          id: data.id,
          category: "etc",
          name: "신규 상품",
          description: "",
          image_url: "",
          affiliate_url: "https://link.coupang.com/",
          price_text: "",
          display_order: prev.length + 1,
          is_active: true,
        },
      ]);
      router.refresh();
    } catch {
      alert("추가 실패");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          ⚠️ 쿠팡 파트너스에서 발급받은 추적 URL을 <strong>affiliate_url</strong>에 입력하세요.
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
          상품 추가
        </button>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-2xl border border-gray-100 p-5 ${
              !p.is_active ? "opacity-60" : ""
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  카테고리
                </label>
                <select
                  value={p.category}
                  onChange={(e) => updateField(p.id, "category", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  상품명
                </label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateField(p.id, "name", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  가격 (선택)
                </label>
                <input
                  type="text"
                  value={p.price_text ?? ""}
                  onChange={(e) => updateField(p.id, "price_text", e.target.value)}
                  placeholder="예: 18,900원~"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  순서
                </label>
                <input
                  type="number"
                  value={p.display_order}
                  onChange={(e) =>
                    updateField(p.id, "display_order", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <div className="md:col-span-4 flex items-end gap-2">
                <button
                  onClick={() => updateField(p.id, "is_active", !p.is_active)}
                  className={`p-2 rounded-lg ${
                    p.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  title={p.is_active ? "활성" : "비활성"}
                >
                  {p.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => save(p)}
                  disabled={savingId === p.id}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {savingId === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  저장
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  쿠팡 파트너스 URL
                </label>
                <input
                  type="url"
                  value={p.affiliate_url}
                  onChange={(e) => updateField(p.id, "affiliate_url", e.target.value)}
                  placeholder="https://link.coupang.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  이미지 URL (선택)
                </label>
                <input
                  type="url"
                  value={p.image_url ?? ""}
                  onChange={(e) => updateField(p.id, "image_url", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                설명 (선택)
              </label>
              <input
                type="text"
                value={p.description ?? ""}
                onChange={(e) => updateField(p.id, "description", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
