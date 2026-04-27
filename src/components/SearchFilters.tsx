"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  SHERPA_SPECIALTIES,
  LANGUAGES,
  COUNTRY_FLAGS,
} from "@/lib/sherpa";

type SearchType = "all" | "sherpa" | "clinic" | "theme";

interface Props {
  type: SearchType;
}

const COMMON_COUNTRIES = ["KR", "JP", "TR", "TH", "FR", "IT", "ES", "DE"];
const THEME_CATEGORIES = ["food", "nature", "history", "adventure", "wellness"];

export default function SearchFilters({ type }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const countries = useMemo(
    () => parseList(params.get("country")),
    [params]
  );
  const languages = useMemo(
    () => parseList(params.get("language")),
    [params]
  );
  const specialties = useMemo(
    () => parseList(params.get("specialty")),
    [params]
  );
  const city = params.get("city") ?? "";
  const direction = params.get("direction") ?? "";
  const category = params.get("category") ?? "";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const minRating = params.get("minRating") ?? "";

  const update = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // 필터가 바뀌면 페이지는 1로
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  };

  const toggleList = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [key]: next.length > 0 ? next.join(",") : null });
  };

  const activeCount =
    countries.length +
    languages.length +
    specialties.length +
    (city ? 1 : 0) +
    (direction ? 1 : 0) +
    (category ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0);

  const clearAll = () => {
    const keep = new URLSearchParams();
    const q = params.get("q");
    const t = params.get("type");
    const sort = params.get("sort");
    if (q) keep.set("q", q);
    if (t) keep.set("type", t);
    if (sort) keep.set("sort", sort);
    router.push(`/search?${keep.toString()}`);
  };

  const showSherpaFilters = type === "all" || type === "sherpa";
  const showClinicFilters = type === "all" || type === "clinic";
  const showThemeFilters = type === "all" || type === "theme";

  return (
    <div className="space-y-1 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">
          필터
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center text-[10px] bg-slate-900 text-white rounded-full px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-0.5"
          >
            <X className="w-3 h-3" /> 초기화
          </button>
        )}
      </div>

      {/* 도시 (모든 타입) */}
      <Group title="도시" defaultOpen>
        <input
          type="text"
          defaultValue={city}
          placeholder="예: 서울, Seoul, 도쿄..."
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== city) update({ city: v || null });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value.trim();
              update({ city: v || null });
            }
          }}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
        />
      </Group>

      {/* 국가 (모든 타입) */}
      <Group title="국가">
        <div className="flex flex-wrap gap-1.5">
          {COMMON_COUNTRIES.map((c) => {
            const active = countries.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleList("country", c, countries)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {COUNTRY_FLAGS[c] ?? ""} {c}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 셰르파: 언어 */}
      {showSherpaFilters && (
        <Group title="언어 (셰르파)">
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.slice(0, 8).map((l) => {
              const active = languages.includes(l.code);
              return (
                <button
                  key={l.code}
                  onClick={() => toggleList("language", l.code, languages)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    active
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {l.emoji} {l.label}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {/* 셰르파: 전문 분야 */}
      {showSherpaFilters && (
        <Group title="전문 분야 (셰르파)">
          <div className="flex flex-wrap gap-1.5">
            {SHERPA_SPECIALTIES.map((sp) => {
              const active = specialties.includes(sp.id);
              return (
                <button
                  key={sp.id}
                  onClick={() => toggleList("specialty", sp.id, specialties)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    active
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {sp.emoji} {sp.label}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {/* 셰르파: 가격 */}
      {showSherpaFilters && (
        <Group title="가격 / 시간 (셰르파)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              defaultValue={minPrice}
              placeholder="최소"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== minPrice) update({ minPrice: v || null });
              }}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="number"
              defaultValue={maxPrice}
              placeholder="최대"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== maxPrice) update({ maxPrice: v || null });
              }}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">시간당 KRW</p>
        </Group>
      )}

      {/* 셰르파: 평점 */}
      {showSherpaFilters && (
        <Group title="최소 평점 (셰르파)">
          <div className="flex gap-1">
            {[0, 3, 4, 4.5].map((r) => (
              <button
                key={r}
                onClick={() =>
                  update({ minRating: r === 0 ? null : String(r) })
                }
                className={`flex-1 px-2 py-1 rounded-md text-xs font-medium border ${
                  String(r) === minRating ||
                  (r === 0 && !minRating)
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                }`}
              >
                {r === 0 ? "전체" : `${r}+`}
              </button>
            ))}
          </div>
        </Group>
      )}

      {/* 클리닉: 방향 */}
      {showClinicFilters && (
        <Group title="여행 방향 (의료관광)">
          <div className="flex gap-1.5">
            {[
              { id: "", label: "전체" },
              { id: "inbound", label: "Inbound (한국行)" },
              { id: "outbound", label: "Outbound (해외行)" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => update({ direction: d.id || null })}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border ${
                  direction === d.id
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Group>
      )}

      {/* 테마: 카테고리 */}
      {showThemeFilters && (
        <Group title="카테고리 (테마)">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => update({ category: null })}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                !category
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              전체
            </button>
            {THEME_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => update({ category: c })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  category === c
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-bold text-slate-700 mb-2"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
