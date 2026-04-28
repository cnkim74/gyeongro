"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import ActivitySearchPanel from "@/components/ActivitySearchPanel";
import { ACTIVITY_DESTINATION_HINTS } from "@/lib/activities";

const POPULAR_ACTIVITY_DESTINATIONS = [
  "도쿄", "오사카", "후쿠오카", "오키나와",
  "방콕", "푸켓", "치앙마이", "발리",
  "다낭", "세부", "보라카이", "코타키나발루",
  "타이베이", "홍콩", "싱가포르", "괌",
];

export default function ActivitiesClient() {
  const [destination, setDestination] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const handleSearch = () => {
    if (!destination.trim()) return;
    setShowPanel(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          도시 또는 지역명
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          list="activity-dest-suggest"
          placeholder="예: 도쿄, 발리, 푸켓..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <datalist id="activity-dest-suggest">
          {Object.keys(ACTIVITY_DESTINATION_HINTS).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="mt-4">
          <p className="text-[11px] text-slate-500 mb-2">인기 도시</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_ACTIVITY_DESTINATIONS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setDestination(c);
                  setShowPanel(true);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  destination === c
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!destination.trim()}
          className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
        >
          액티비티 가격 비교 시작
        </button>
      </div>

      {showPanel && destination.trim() && (
        <ActivitySearchPanel destination={destination} />
      )}
    </div>
  );
}
