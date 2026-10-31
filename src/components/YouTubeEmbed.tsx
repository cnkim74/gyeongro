"use client";

// 가벼운 유튜브 플레이어 — 처음엔 썸네일만, 누르면 그때 플레이어를 불러옴 (페이지 속도 보호)

import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeThumb } from "@/lib/youtube";

export default function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md">
      {play ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title ?? "YouTube 영상"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full" aria-label={`${title ?? "영상"} 재생`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={youtubeThumb(id)} alt={title ?? ""} className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
