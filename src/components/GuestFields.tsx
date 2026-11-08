"use client";

// 비회원 댓글 입력칸 (이름 · 비밀번호 · 이메일 선택) — 블로그·스토리·게시판 공용
// 이름·이메일은 이 브라우저에 기억해 둠 (비밀번호는 저장하지 않음)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const KEY = "pothos_guest_profile";

export function useGuestFields(enabled: boolean, loginHref: string) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // 숨은 칸 — 봇만 채움
  const openedAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as { name?: string; email?: string };
      // 저장해 둔 이름·이메일 불러오기 (마운트 때 한 번)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.name) setName(saved.name);
      if (saved.email) setEmail(saved.email);
    } catch {
      // 저장소를 못 쓰는 브라우저 — 무시
    }
  }, [enabled]);

  /** 글 입력을 시작할 때 호출 (너무 빠른 자동 등록 차단용) */
  const touch = () => {
    if (!openedAt.current) openedAt.current = Date.now();
  };

  const payload = () =>
    enabled ? { guestName: name, guestPassword: password, guestEmail: email, website, openedAt: openedAt.current || Date.now() } : {};

  const remember = () => {
    if (!enabled) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ name, email }));
    } catch {
      // 무시
    }
    setPassword("");
    openedAt.current = 0;
  };

  const ready = !enabled || (name.trim().length > 0 && password.length >= 4);

  const input = "rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-w-0";
  const fields = enabled ? (
    <div className="mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (필수)" maxLength={20} autoComplete="nickname" />
        <input
          className={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (지울 때 필요)"
          maxLength={64}
          autoComplete="new-password"
        />
        <input
          className={input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 (선택 · 답글 알림)"
          maxLength={120}
          autoComplete="email"
        />
      </div>
      {/* 봇 차단용 숨은 칸 — 사람에게는 보이지 않음 */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px opacity-0"
      />
      <p className="mt-1.5 text-[11px] text-slate-400">
        비회원으로 남겨요. 이메일은 답글 알림에만 쓰고 공개되지 않아요.{" "}
        <Link href={loginHref} className="font-semibold text-blue-600 hover:underline">
          로그인
        </Link>
        하면 앱 알림도 받을 수 있어요.
      </p>
    </div>
  ) : null;

  return { fields, payload, remember, touch, ready };
}
