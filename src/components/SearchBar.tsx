"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Mountain, HeartPulse, Sparkles, Star } from "lucide-react";

interface Props {
  variant?: "light" | "dark";
}

interface Suggestion {
  sherpas: Array<{
    slug: string;
    display_name: string;
    cities: string[];
    rating_avg: number | null;
    rating_count: number;
  }>;
  clinics: Array<{
    slug: string;
    name: string;
    city: string;
    country: string;
  }>;
  themes: Array<{
    slug: string;
    title: string;
    destination: string | null;
  }>;
  totals: { sherpa: number; clinic: number; theme: number };
}

export default function SearchBar({ variant = "dark" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggest, setSuggest] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced suggest fetch
  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(term)}&suggest=1`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggest(data as Suggestion);
      } catch {
        // ignore aborts
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query.length === 0) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const iconClass =
    variant === "light"
      ? "text-white/85 hover:text-white"
      : "text-gray-600 hover:text-blue-500";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`p-1.5 rounded-full transition-colors ${iconClass}`}
        aria-label="검색"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  const term = q.trim();
  const hasResults =
    !!suggest &&
    (suggest.sherpas.length > 0 ||
      suggest.clinics.length > 0 ||
      suggest.themes.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-3 pr-1 py-1 shadow-sm w-64 sm:w-80"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (v.trim().length < 1) setSuggest(null);
          }}
          placeholder="셰르파·클리닉·테마..."
          className="flex-1 px-1 py-1 outline-none text-slate-900 text-sm bg-transparent"
        />
        {q.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSuggest(null);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
            aria-label="지우기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <button
          type="submit"
          disabled={q.trim().length === 0}
          className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          검색
        </button>
      </form>

      {/* Suggestion dropdown */}
      {term.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
          {loading && !suggest ? (
            <p className="px-4 py-3 text-xs text-slate-400">검색 중...</p>
          ) : !hasResults ? (
            <p className="px-4 py-3 text-xs text-slate-500">
              &lsquo;{term}&rsquo; 결과가 없습니다.
            </p>
          ) : (
            <>
              {suggest && suggest.sherpas.length > 0 && (
                <Group
                  icon={<Mountain className="w-3.5 h-3.5 text-emerald-500" />}
                  title="셰르파"
                  count={suggest.totals.sherpa}
                  seeAllHref={`/search?q=${encodeURIComponent(term)}&type=sherpa`}
                  onNavigate={() => setOpen(false)}
                >
                  {suggest.sherpas.map((s) => (
                    <SuggestRow
                      key={s.slug}
                      href={`/sherpa/${s.slug}`}
                      onNavigate={() => setOpen(false)}
                      title={s.display_name}
                      subtitle={s.cities.slice(0, 2).join(", ")}
                      meta={
                        s.rating_count > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {Number(s.rating_avg ?? 0).toFixed(1)}
                          </span>
                        ) : null
                      }
                    />
                  ))}
                </Group>
              )}

              {suggest && suggest.clinics.length > 0 && (
                <Group
                  icon={<HeartPulse className="w-3.5 h-3.5 text-rose-500" />}
                  title="의료관광"
                  count={suggest.totals.clinic}
                  seeAllHref={`/search?q=${encodeURIComponent(term)}&type=clinic`}
                  onNavigate={() => setOpen(false)}
                >
                  {suggest.clinics.map((c) => (
                    <SuggestRow
                      key={c.slug}
                      href={`/medical/clinic/${c.slug}`}
                      onNavigate={() => setOpen(false)}
                      title={c.name}
                      subtitle={`${c.country} · ${c.city}`}
                    />
                  ))}
                </Group>
              )}

              {suggest && suggest.themes.length > 0 && (
                <Group
                  icon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />}
                  title="테마"
                  count={suggest.totals.theme}
                  seeAllHref={`/search?q=${encodeURIComponent(term)}&type=theme`}
                  onNavigate={() => setOpen(false)}
                >
                  {suggest.themes.map((t) => (
                    <SuggestRow
                      key={t.slug}
                      href={`/themes/${t.slug}`}
                      onNavigate={() => setOpen(false)}
                      title={t.title}
                      subtitle={t.destination ?? ""}
                    />
                  ))}
                </Group>
              )}

              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-xs font-semibold text-center bg-slate-50 text-slate-700 hover:bg-slate-100 border-t border-slate-100"
              >
                &lsquo;{term}&rsquo; 전체 결과 보기 →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  icon,
  title,
  count,
  seeAllHref,
  onNavigate,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  seeAllHref: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/60">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
          {icon}
          <span>{title}</span>
          <span className="text-slate-400 font-medium">({count})</span>
        </div>
        <Link
          href={seeAllHref}
          onClick={onNavigate}
          className="text-[10px] text-slate-500 hover:text-slate-800"
        >
          전체 →
        </Link>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SuggestRow({
  href,
  onNavigate,
  title,
  subtitle,
  meta,
}: {
  href: string;
  onNavigate: () => void;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
        )}
      </div>
      {meta && <div className="text-xs ml-2 shrink-0">{meta}</div>}
    </Link>
  );
}
