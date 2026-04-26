"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Bookmark, User, Shield, Megaphone } from "lucide-react";
import RoleBadge from "./RoleBadge";
import type { UserRole } from "@/lib/admin";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    businessName?: string | null;
  };
  isScrolled: boolean;
}

export default function UserMenu({ user, isScrolled }: UserMenuProps) {
  const role: UserRole = user.role ?? "user";
  const isAdmin = role === "admin";
  const isBusiness = role === "business";
  const displayName =
    isBusiness && user.businessName
      ? user.businessName
      : user.name ?? user.email?.split("@")[0] ?? "사용자";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = displayName.charAt(0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-colors ${
          isScrolled ? "hover:bg-gray-100" : "hover:bg-white/10"
        }`}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={displayName}
            className="w-8 h-8 rounded-full border-2 border-white/20 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {initial.toUpperCase()}
          </div>
        )}
        <div className="hidden sm:flex items-center gap-1.5">
          <span
            className={`text-sm font-semibold max-w-[8rem] truncate ${
              isScrolled ? "text-gray-900" : "text-white"
            }`}
          >
            {displayName}
          </span>
          <RoleBadge role={role} size="xs" />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate flex-1">
                {displayName}
              </p>
              <RoleBadge role={role} size="xs" />
            </div>
            {user.email && (
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            )}
            {isBusiness && user.name && user.businessName && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                담당자: {user.name}
              </p>
            )}
          </div>

          <div className="p-1">
            <Link
              href="/my-trips"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-blue-500" />내 여행 계획
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 text-gray-400" />
              프로필
            </Link>
            {isBusiness && (
              <Link
                href="/sponsor"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
              >
                <Megaphone className="w-4 h-4 text-emerald-500" />
                스폰서 / 홍보 관리
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-purple-700 bg-purple-50/50 hover:bg-purple-50 transition-colors"
              >
                <Shield className="w-4 h-4 text-purple-500" />
                관리자
              </Link>
            )}
          </div>

          <div className="p-1 border-t border-gray-100">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
