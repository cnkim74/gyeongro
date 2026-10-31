"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, AlertTriangle, HardDrive } from "lucide-react";

type Status = {
  heroConfigInR2: boolean;
  heroFiles: { field: string; url: string }[];
  avatars: { id: string; name: string | null; url: string }[];
};

export default function StorageMigration({
  initial,
  initialError,
}: {
  initial: Status | null;
  initialError: string | null;
}) {
  const [status, setStatus] = useState<Status | null>(initial);
  const [error, setError] = useState<string | null>(initialError);
  const [checking, setChecking] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<{ ok: boolean; text: string }[]>([]);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/storage-migration", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "점검 실패");
      setStatus(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "점검 실패");
    } finally {
      setChecking(false);
    }
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    setLog([]);
    try {
      for (let round = 0; round < 20; round++) {
        const r = await fetch("/api/admin/storage-migration", { method: "POST" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "이전 실패");
        setLog((p) => [
          ...p,
          ...j.done.map((t: string) => ({ ok: true, text: t })),
          ...j.failed.map((t: string) => ({ ok: false, text: t })),
        ]);
        if (j.remaining === 0 || (j.done.length === 0 && j.failed.length > 0)) break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "이전 실패");
    } finally {
      setRunning(false);
      check();
    }
  };

  const pending = status ? status.heroFiles.length + status.avatars.length + (status.heroConfigInR2 ? 0 : 1) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HardDrive className="w-6 h-6" /> 저장소 이전 (Supabase → R2)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          예전에 Supabase Storage에 올린 프로필 사진과 메인 히어로 파일을 Cloudflare R2로 복사하고 주소를 바꿔요.
          Supabase의 원본은 지우지 않아요.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">남은 대상</h2>
          <button
            onClick={check}
            disabled={checking || running}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} /> 다시 점검
          </button>
        </div>
        {!status ? (
          <p className="text-sm text-gray-400">{checking ? "점검 중…" : "-"}</p>
        ) : (
          <ul className="text-sm text-gray-700 space-y-1">
            <li>히어로 설정: {status.heroConfigInR2 ? "R2에 저장됨 ✅" : "아직 Supabase"}</li>
            <li>히어로 영상·사진: {status.heroFiles.length}개</li>
            <li>프로필 사진: {status.avatars.length}명</li>
          </ul>
        )}
        {status && pending === 0 && (
          <p className="text-sm text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 옮길 파일이 없어요. 이전이 끝났어요.
          </p>
        )}
        <button
          onClick={run}
          disabled={running || checking || !status || pending === 0}
          className="w-full rounded-xl bg-indigo-600 text-white font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {running ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {running ? "옮기는 중… 창을 닫지 마세요" : "R2로 옮기기"}
        </button>
      </section>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      {log.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 max-h-80 overflow-auto">
          <ul className="text-xs font-mono space-y-1">
            {log.map((l, i) => (
              <li key={i} className={l.ok ? "text-gray-700" : "text-red-600"}>
                {l.ok ? "✓" : "✗"} {l.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
