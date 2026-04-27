"use client";

import { useState, type ReactNode } from "react";
import { LayoutDashboard, Inbox, Send, UserCog, Star } from "lucide-react";

interface Props {
  stats: ReactNode;
  bookings: ReactNode;
  proposals: ReactNode;
  reviews: ReactNode;
  profile: ReactNode;
  bookingCount: number;
  proposalCount: number;
  reviewCount: number;
}

const TABS = [
  { id: "stats", label: "통계", icon: LayoutDashboard },
  { id: "bookings", label: "받은 예약", icon: Inbox },
  { id: "proposals", label: "내 제안", icon: Send },
  { id: "reviews", label: "후기", icon: Star },
  { id: "profile", label: "프로필", icon: UserCog },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DashboardTabs({
  stats,
  bookings,
  proposals,
  reviews,
  profile,
  bookingCount,
  proposalCount,
  reviewCount,
}: Props) {
  const [active, setActive] = useState<TabId>("stats");

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto border-b border-slate-100">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const badge =
            tab.id === "bookings"
              ? bookingCount
              : tab.id === "proposals"
              ? proposalCount
              : tab.id === "reviews"
              ? reviewCount
              : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 px-4 py-3 -mb-px border-b-2 inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {badge !== null && badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {active === "stats" && stats}
        {active === "bookings" && bookings}
        {active === "proposals" && proposals}
        {active === "reviews" && reviews}
        {active === "profile" && profile}
      </div>
    </div>
  );
}
