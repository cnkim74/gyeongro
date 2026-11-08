"use client";

// 웹 푸시 알림 켜기/끄기 (이 브라우저·기기 기준)
import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function toKey(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function detect(): State | null {
  if (typeof window === "undefined") return "loading";
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return ios ? "ios-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return null;
}

export default function PushToggle({ compact = false, label = "새 댓글 알림" }: { compact?: boolean; label?: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = detect();
      if (d) {
        if (alive) setState(d);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const sub = await reg.pushManager.getSubscription();
        if (alive) setState(sub ? "on" : "off");
      } catch {
        if (alive) setState("unsupported");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const turnOn = async () => {
    setBusy(true);
    setNote(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = (await (await fetch("/api/push/subscribe")).json()) as { publicKey: string | null };
      if (!publicKey) throw new Error("알림 서버 준비가 안 됐어요. 잠시 후 다시 시도해 주세요.");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) }));
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "알림 켜기 실패");
      setState("on");
      // 시험 알림
      await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test" }) });
    } catch (e) {
      setNote(e instanceof Error ? e.message : "알림 켜기 실패");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  const hint: Partial<Record<State, string>> = {
    unsupported: "이 브라우저·앱에서는 푸시 알림을 쓸 수 없어요. 대신 이메일로 알려 드려요.",
    "ios-install": "아이폰은 Safari 공유 버튼 → '홈 화면에 추가' 후, 홈 화면의 Pothos에서 알림을 켤 수 있어요. 그 전엔 이메일로 알려 드려요.",
    denied: "브라우저에서 알림이 차단돼 있어요. 주소창 왼쪽 자물쇠 → 알림 → 허용으로 바꿔 주세요.",
  };

  if (state === "loading") return null;
  if (hint[state]) {
    return <p className={`text-xs text-gray-500 ${compact ? "" : "mt-1"}`}>🔔 {hint[state]}</p>;
  }
  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        disabled={busy}
        onClick={state === "on" ? turnOff : turnOn}
        className={`inline-flex items-center gap-1.5 rounded-full font-bold disabled:opacity-60 ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        } ${state === "on" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-600 text-white"}`}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : state === "on" ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
        {state === "on" ? `${label} 켜짐 (끄기)` : `${label} 받기`}
      </button>
      {note && <span className="mt-1 text-xs text-rose-600">{note}</span>}
    </div>
  );
}
