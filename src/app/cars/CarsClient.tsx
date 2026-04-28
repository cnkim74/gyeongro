"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import CarSearchPanel from "@/components/CarSearchPanel";
import { CAR_DESTINATION_HINTS } from "@/lib/cars";

const POPULAR_CAR_DESTINATIONS = [
  "제주", "오키나와", "후쿠오카", "삿포로",
  "괌", "하와이", "LA", "라스베가스",
  "발리", "코타키나발루", "다낭", "방콕",
  "타이베이", "오클랜드", "시드니", "로마",
];

export default function CarsClient() {
  const [city, setCity] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const handleSearch = () => {
    if (!city.trim()) return;
    setShowPanel(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          픽업 도시·공항
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          list="car-dest-suggest"
          placeholder="예: 제주, 후쿠오카, 라스베가스 공항..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <datalist id="car-dest-suggest">
          {Object.keys(CAR_DESTINATION_HINTS).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="mt-4">
          <p className="text-[11px] text-slate-500 mb-2">렌트카 인기 도시</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CAR_DESTINATIONS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCity(c);
                  setShowPanel(true);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  city === c
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!city.trim()}
          className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-teal-500/20 transition-all"
        >
          렌트카 가격 비교 시작
        </button>
      </div>

      {showPanel && city.trim() && (
        <CarSearchPanel pickupCity={city} nights={3} />
      )}
    </div>
  );
}
