"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";

export default function LikeButton({
  storyId,
  initialLiked,
  initialCount,
  loggedIn,
}: {
  storyId: string;
  initialLiked: boolean;
  initialCount: number;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/stories/${storyId}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      alert("실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`group inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all ${
        liked
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-white border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50"
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
      )}
      <span className="font-semibold">
        {liked ? "좋아요 ✓" : "좋아요"} · {count}
      </span>
    </button>
  );
}
