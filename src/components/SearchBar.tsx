"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface Props {
  variant?: "light" | "dark";
}

export default function SearchBar({ variant = "dark" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
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

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-3 pr-1 py-1 shadow-sm w-64 sm:w-72"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="셰르파·클리닉·테마..."
          className="flex-1 px-1 py-1 outline-none text-slate-900 text-sm bg-transparent"
        />
        {q.length > 0 ? (
          <button
            type="button"
            onClick={() => setQ("")}
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
    </div>
  );
}
