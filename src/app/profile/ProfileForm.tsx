"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";

interface Props {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatarPreset: string | null;
  currentImage: string | null;
  hasCustomImage: boolean;
}

const NICKNAME_RE = /^[A-Za-z0-9가-힣]{2,12}$/;

function formatPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function ProfileForm({
  name,
  email,
  phone,
  nickname,
  avatarPreset,
  currentImage,
  hasCustomImage,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneEdit, setPhoneEdit] = useState(false);

  // 닉네임
  const [nicknameInput, setNicknameInput] = useState(nickname ?? "");
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  type ServerResult = { value: string; result: "available" | "taken" } | null;
  const [nicknameServer, setNicknameServer] = useState<ServerResult>(null);

  // 아바타 프리셋
  const [presetInput, setPresetInput] = useState<string | null>(avatarPreset);
  const [presetSaving, setPresetSaving] = useState(false);

  useEffect(() => {
    if (!nicknameEdit) return;
    if (!nicknameInput) return;
    if (nicknameInput === nickname) return;
    if (!NICKNAME_RE.test(nicknameInput)) return;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check?field=nickname&value=${encodeURIComponent(nicknameInput)}`
        );
        const data = await res.json();
        setNicknameServer({
          value: nicknameInput,
          result: data.available ? "available" : "taken",
        });
      } catch {
        setNicknameServer(null);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [nicknameInput, nicknameEdit, nickname]);

  // 렌더 시 파생
  const nicknameCheck: CheckState = !nicknameEdit
    ? "idle"
    : !nicknameInput
    ? "idle"
    : nicknameInput === nickname
    ? "idle"
    : !NICKNAME_RE.test(nicknameInput)
    ? "invalid"
    : nicknameServer?.value === nicknameInput
    ? nicknameServer.result
    : "checking";

  const handleNicknameSave = async () => {
    setNicknameSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nicknameInput || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setNicknameEdit(false);
      setMessage({ type: "success", text: "닉네임이 변경됐어요." });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "오류가 발생했어요.",
      });
    } finally {
      setNicknameSaving(false);
    }
  };

  const handlePresetSave = async (presetId: string | null) => {
    setPresetSaving(true);
    setMessage(null);
    setPresetInput(presetId);
    try {
      const res = await fetch("/api/profile/avatar-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setMessage({ type: "success", text: "캐릭터가 변경됐어요." });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "오류가 발생했어요.",
      });
      setPresetInput(avatarPreset);
    } finally {
      setPresetSaving(false);
    }
  };

  const handlePhoneSave = async () => {
    setPhoneSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setPhoneInput(data.phone);
      setPhoneEdit(false);
      setMessage({ type: "success", text: "휴대전화 번호가 변경됐어요." });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "오류가 발생했어요.",
      });
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "파일 크기는 5MB 이하여야 해요." });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setMessage({ type: "error", text: "JPG, PNG, WebP, GIF만 지원해요." });
      return;
    }

    setUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");

      setPreviewUrl(data.url);
      setMessage({ type: "success", text: "프로필 사진이 변경됐어요!" });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류가 발생했어요.";
      setMessage({ type: "error", text: msg });
      setPreviewUrl(currentImage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm("커스텀 프로필 사진을 삭제하시겠어요?"))
      return;

    setRemoving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");

      setMessage({ type: "success", text: "기본 프로필로 변경됐어요." });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류가 발생했어요.";
      setMessage({ type: "error", text: msg });
    } finally {
      setRemoving(false);
    }
  };

  const initial = nickname?.charAt(0) ?? name?.charAt(0) ?? email?.charAt(0) ?? "U";
  const renderCheckIcon = (state: CheckState) => {
    if (state === "checking")
      return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
    if (state === "available")
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (state === "taken" || state === "invalid")
      return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="프로필 사진"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
              {initial.toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 disabled:opacity-50"
            aria-label="사진 변경"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            사진 업로드
          </button>
          {hasCustomImage && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="px-4 py-2 rounded-full text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {removing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              사진 삭제
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}
      </div>

      {/* 아바타 갤러리 */}
      <div className="border-t border-gray-100 pt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">여행 캐릭터</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              업로드한 사진이 우선 표시됩니다. 사진이 없을 때 캐릭터가 보여요.
            </p>
          </div>
          {presetSaving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handlePresetSave(a.id)}
              disabled={presetSaving}
              className={`relative p-2 rounded-2xl border-2 transition-all ${
                presetInput === a.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              } disabled:opacity-60`}
              title={a.label}
            >
              <Image
                src={a.url}
                alt={a.label}
                width={64}
                height={64}
                className="w-full h-auto"
                unoptimized
              />
              {presetInput === a.id && (
                <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-5 h-5 text-blue-500 bg-white rounded-full" />
              )}
              <p className="text-[10px] text-slate-500 mt-1 truncate">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 border-t border-gray-100 pt-6">
        {/* 닉네임 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            닉네임
          </label>
          {nicknameEdit ? (
            <div className="mt-1 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value.trim())}
                  placeholder="한글/영문/숫자 2~12자"
                  maxLength={12}
                  className="w-full px-3 py-2 pr-9 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderCheckIcon(nicknameCheck)}
                </div>
              </div>
              {nicknameCheck === "taken" && (
                <p className="text-xs text-red-500">이미 사용 중인 닉네임입니다.</p>
              )}
              {nicknameCheck === "invalid" && nicknameInput && (
                <p className="text-xs text-red-500">한글/영문/숫자 2~12자만 가능합니다.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleNicknameSave}
                  disabled={
                    nicknameSaving ||
                    (nicknameInput !== "" &&
                      nicknameInput !== nickname &&
                      nicknameCheck !== "available")
                  }
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {nicknameSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setNicknameEdit(false);
                    setNicknameInput(nickname ?? "");
                  }}
                  disabled={nicknameSaving}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <p className="text-base text-gray-900">
                {nickname ?? <span className="text-gray-400">미설정</span>}
              </p>
              <button
                onClick={() => setNicknameEdit(true)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {nickname ? "변경" : "설정"}
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            이름
          </label>
          <p className="text-base text-gray-900 mt-1">{name ?? "이름 없음"}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            이메일
          </label>
          <p className="text-base text-gray-900 mt-1">{email ?? "이메일 없음"}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            휴대전화 번호
          </label>
          {phoneEdit ? (
            <div className="flex gap-2 mt-1">
              <input
                type="tel"
                inputMode="numeric"
                value={phoneInput}
                onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                placeholder="010-1234-5678"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900"
              />
              <button
                onClick={handlePhoneSave}
                disabled={
                  phoneSaving || phoneInput.replace(/[^\d]/g, "").length < 10
                }
                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                {phoneSaving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => {
                  setPhoneEdit(false);
                  setPhoneInput(phone ?? "");
                }}
                disabled={phoneSaving}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <p className="text-base text-gray-900">
                {phone ?? <span className="text-gray-400">미입력</span>}
              </p>
              <button
                onClick={() => setPhoneEdit(true)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {phone ? "변경" : "입력"}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8 leading-relaxed">
        프로필 사진은 5MB 이하의 JPG, PNG, WebP, GIF 파일을 지원합니다.
        <br />
        업로드 사진을 삭제하면 선택한 캐릭터, 또는 소셜 로그인 기본 사진이 표시됩니다.
      </p>
    </div>
  );
}
