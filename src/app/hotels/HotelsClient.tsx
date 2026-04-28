"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import HotelSearchPanel from "@/components/HotelSearchPanel";
import { HOTEL_DESTINATION_HINTS } from "@/lib/hotels";

const POPULAR_HOTEL_DESTINATIONS = [
  "도쿄", "오사카", "후쿠오카", "오키나와",
  "방콕", "푸켓", "발리", "다낭",
  "세부", "타이베이", "홍콩", "싱가포르",
  "괌", "하와이", "LA", "파리",
];

export default function HotelsClient() {
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
          도시 또는 호텔명
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          list="hotel-dest-suggest"
          placeholder="예: 도쿄, 시부야, Conrad Tokyo..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <datalist id="hotel-dest-suggest">
          {Object.keys(HOTEL_DESTINATION_HINTS).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {/* 인기 도시 */}
        <div className="mt-4">
          <p className="text-[11px] text-slate-500 mb-2">인기 도시</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_HOTEL_DESTINATIONS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setDestination(c);
                  setShowPanel(true);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  destination === c
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
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
          className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/20 transition-all"
        >
          호텔 가격 비교 시작
        </button>
      </div>

      {showPanel && destination.trim() && (
        <HotelSearchPanel destination={destination} nights={3} adults={2} />
      )}
    </div>
  );
}
