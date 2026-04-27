"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoMark } from "./Logo";
import UserMenu from "./UserMenu";
import LanguageSwitcher from "./LanguageSwitcher";

import type { UserRole } from "@/lib/admin";
import type { Locale } from "@/lib/i18n";
import type { MessageKey } from "@/messages";

interface HeaderClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    businessName?: string | null;
  } | null;
  locale: Locale;
  labels: Record<MessageKey, string>;
}

export default function HeaderClient({ user, locale, labels }: HeaderClientProps) {
  const t = (k: MessageKey) => labels[k] ?? k;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 메인 페이지(/)는 어두운 hero가 있어 투명 헤더 + 흰 글씨, 그 외는 항상 밝은 헤더
  const isLanding = pathname === "/";
  const useDarkBg = !isLanding || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        useDarkBg
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 ${
                useDarkBg
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-white/10 backdrop-blur-md border border-white/20 text-white"
              }`}
            >
              <LogoMark size={18} />
            </div>
            <span
              className={`text-xl font-bold tracking-tight transition-colors ${
                useDarkBg ? "text-slate-900" : "text-white"
              }`}
              style={{ letterSpacing: "-0.02em" }}
            >
              Pothos
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: t("nav.planner"), href: "/planner" },
              { label: t("nav.themes"), href: "/themes" },
              { label: t("nav.sherpa"), href: "/sherpa" },
              { label: t("nav.medical"), href: "/medical" },
              { label: t("nav.partners"), href: "/partners" },
              { label: t("nav.stories"), href: "/stories" },
              { label: t("nav.community"), href: "/board" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  useDarkBg ? "text-gray-600" : "text-white/80"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher
              current={locale}
              variant={useDarkBg ? "dark" : "light"}
            />
            {user ? (
              <UserMenu user={user} isScrolled={useDarkBg} />
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors ${
                    useDarkBg ? "text-gray-600 hover:text-blue-500" : "text-white/80 hover:text-white"
                  }`}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  className={`text-sm font-medium transition-colors ${
                    useDarkBg ? "text-gray-600 hover:text-blue-500" : "text-white/80 hover:text-white"
                  }`}
                >
                  {t("nav.signup")}
                </Link>
                <Link
                  href="/planner"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                >
                  {t("nav.cta")}
                </Link>
              </>
            )}
          </div>

          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              useDarkBg ? "text-gray-700" : "text-white"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {[
              { label: t("nav.planner"), href: "/planner" },
              { label: t("nav.themes"), href: "/themes" },
              { label: t("nav.sherpa"), href: "/sherpa" },
              { label: t("nav.medical"), href: "/medical" },
              { label: t("nav.partners"), href: "/partners" },
              { label: t("nav.stories"), href: "/stories" },
              { label: t("nav.community"), href: "/board" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-sm font-medium text-gray-600 hover:text-blue-500 py-2"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="py-2 border-t border-slate-100">
              <LanguageSwitcher current={locale} variant="dark" />
            </div>
            {user ? (
              <>
                <Link
                  href="/my-trips"
                  className="block text-sm font-medium text-gray-600 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.my_trips")}
                </Link>
                <Link
                  href="/planner"
                  className="block w-full text-center px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.cta")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-sm font-medium text-gray-600 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  className="block text-sm font-medium text-gray-600 py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.signup")}
                </Link>
                <Link
                  href="/planner"
                  className="block w-full text-center px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.cta")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
