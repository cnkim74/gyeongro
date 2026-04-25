"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  currentImage: string | null;
  hasCustomImage: boolean;
}

function formatPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ProfileForm({
  name,
  email,
  phone,
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
    if (!confirm("커스텀 프로필 사진을 삭제하시겠어요? (소셜 로그인 기본 사진으로 돌아갑니다)"))
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

  const initial = name?.charAt(0) ?? email?.charAt(0) ?? "U";

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="프로필 사진"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
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
            사진 변경
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

      <div className="space-y-5 border-t border-gray-100 pt-6">
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
        커스텀 사진을 삭제하면 소셜 로그인 시 제공된 기본 사진이 표시됩니다.
      </p>
    </div>
  );
}
