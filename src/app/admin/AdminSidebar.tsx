"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Map,
  Shield,
  ChevronRight,
  Home,
  ShoppingBag,
  Layers,
} from "lucide-react";

const MENU = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/users", label: "사용자 관리", icon: Users },
  { href: "/admin/boards", label: "게시판 관리", icon: Layers },
  { href: "/admin/posts", label: "게시글 관리", icon: MessageSquare },
  { href: "/admin/trips", label: "여행 계획", icon: Map },
  { href: "/admin/affiliates", label: "쿠팡 파트너스", icon: ShoppingBag },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold text-gray-900">관리자</h2>
        </div>
        <p className="text-xs text-gray-400 ml-10">서비스 관리 콘솔</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {MENU.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                {item.label}
              </span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          서비스로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
