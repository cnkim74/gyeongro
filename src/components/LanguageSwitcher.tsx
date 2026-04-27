"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";

type LocaleCode = "ko" | "en" | "ja" | "zh";

interface Props {
  current: LocaleCode;
  variant?: "light" | "dark";
}

const LOCALES: Array<{
  code: LocaleCode;
  label: string;
  native: string;
  flag: string;
}> = [
  { code: "ko", label: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", native: "English", flag: "🇺🇸" },
  { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", native: "简体中文", flag: "🇨🇳" },
];

export default function LanguageSwitcher({ current, variant = "dark" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSelect = (locale: LocaleCode) => {
    setOpen(false);
    if (locale === current) return;
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      router.refresh();
    });
  };

  const triggerClass =
    variant === "light"
      ? "text-white/85 hover:text-white"
      : "text-gray-600 hover:text-blue-500";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className={`text-sm font-medium inline-flex items-center gap-1 transition-colors ${triggerClass} disabled:opacity-50`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{current.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close language menu"
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left ${
                  current === l.code ? "bg-slate-50" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span className="text-slate-700">{l.native}</span>
                </span>
                {current === l.code && (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
