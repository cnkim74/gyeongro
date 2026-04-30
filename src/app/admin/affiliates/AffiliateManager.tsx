"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, Wand2 } from "lucide-react";

interface Product {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_url: string;
  price_text: string | null;
  html_snippet: string | null;
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
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [fetchMsg, setFetchMsg] = useState<Record<string, string>>({});

  const fetchImage = async (p: Product) => {
    if (!p.affiliate_url || p.affiliate_url === "#") {
      setFetchMsg((m) => ({ ...m, [p.id]: "어필리에이트 URL을 먼저 입력해주세요." }));
      return;
    }
    setFetchingId(p.id);
    setFetchMsg((m) => ({ ...m, [p.id]: "가져오는 중..." }));
    try {
      const res = await fetch("/api/admin/affiliate-products/fetch-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: p.affiliate_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchMsg((m) => ({ ...m, [p.id]: data.error ?? "가져오기 실패" }));
        // 제목·설명만이라도 받으면 일부 필드 채움
        if (data.title && !p.name) updateField(p.id, "name", data.title);
        return;
      }
      // 성공: 이미지·제목·가격·affiliate URL 자동 채움 (기존 값 우선 보존)
      if (data.image_url) updateField(p.id, "image_url", data.image_url);
      if (data.title && (!p.name || p.name === "신규 상품")) {
        updateField(p.id, "name", data.title);
      }
      if (data.price_text && !p.price_text) {
        updateField(p.id, "price_text", data.price_text);
      }
      // 쿠팡 API가 정식 단축 affiliate URL 줄 때만 갱신 (link.coupang.com 형식)
      if (
        data.affiliate_url &&
        data.affiliate_url !== p.affiliate_url &&
        /link\.coupang\.com/.test(data.affiliate_url)
      ) {
        updateField(p.id, "affiliate_url", data.affiliate_url);
      }
      setFetchMsg((m) => ({
        ...m,
        [p.id]: "✅ 가져왔습니다. 저장 버튼 누르세요.",
      }));
    } catch (err) {
      setFetchMsg((m) => ({
        ...m,
        [p.id]: err instanceof Error ? err.message : "오류 발생",
      }));
    } finally {
      setFetchingId(null);
    }
  };

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
          html_snippet: p.html_snippet,
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
          html_snippet: "",
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
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={p.image_url ?? ""}
                    onChange={(e) => updateField(p.id, "image_url", e.target.value)}
                    placeholder="https://thumbnail7.coupangcdn.com/..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => fetchImage(p)}
                    disabled={fetchingId === p.id}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="어필리에이트 URL에서 이미지·제목 자동 가져오기"
                  >
                    {fetchingId === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    자동
                  </button>
                </div>
                {fetchMsg[p.id] && (
                  <p
                    className={`text-[10px] mt-1 leading-snug ${
                      fetchMsg[p.id].startsWith("✅")
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {fetchMsg[p.id]}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                  🪄 <strong>자동 버튼</strong> 누르면 어필리에이트 URL에서 이미지·제목을
                  추출합니다. 실패 시 쿠팡 상품 페이지 → 이미지 우클릭 → &lsquo;이미지
                  주소 복사&rsquo;로 수동 입력하세요. 비워두면 카테고리 이모지로 대체.
                </p>
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

            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1.5">
                🪄 HTML 스니펫 (선택, 최우선 노출)
                {p.html_snippet ? (
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                    HTML 모드
                  </span>
                ) : null}
              </label>
              <textarea
                value={p.html_snippet ?? ""}
                onChange={(e) =>
                  updateField(p.id, "html_snippet", e.target.value)
                }
                rows={4}
                placeholder='쿠팡 파트너스 다이나믹 배너 iframe을 여기에 붙여넣기. 예:&#10;&lt;iframe src="https://ads-partners.coupang.com/widgets.html?id=..." width="680" height="140" frameborder="0"&gt;&lt;/iframe&gt;'
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                💡 <strong>HTML이 입력되면 위 image/제목/가격 무시되고 이 코드만 노출</strong>됩니다.
                쿠팡 파트너스 → ''링크 만들기'' → ''다이나믹 배너'' 또는 ''위젯'' 메뉴에서
                생성된 iframe 코드를 그대로 붙여넣으세요. 안전을 위해 허용 도메인:
                <code>ads-partners.coupang.com</code>, <code>link.coupang.com</code>,
                <code>image*.coupangcdn.com</code>.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
