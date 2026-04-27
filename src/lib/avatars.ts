// 여행 컨셉 아바타 갤러리 — 8종 (사람 2 + 동물 6)
// 사용처:
//   - 회원가입/프로필에서 선택
//   - 사용자에게 표시할 이미지 우선순위: custom_image > avatar_preset URL > OAuth image > fallback

export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  url: string;
  category: "human" | "animal";
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "wanderer",
    label: "탐험가",
    emoji: "🧳",
    url: "/avatars/wanderer.svg",
    category: "human",
  },
  {
    id: "explorer",
    label: "백패커",
    emoji: "🎒",
    url: "/avatars/explorer.svg",
    category: "human",
  },
  {
    id: "bear",
    label: "여행하는 곰",
    emoji: "🐻",
    url: "/avatars/bear.svg",
    category: "animal",
  },
  {
    id: "fox",
    label: "사진가 여우",
    emoji: "🦊",
    url: "/avatars/fox.svg",
    category: "animal",
  },
  {
    id: "panda",
    label: "여행자 판다",
    emoji: "🐼",
    url: "/avatars/panda.svg",
    category: "animal",
  },
  {
    id: "rabbit",
    label: "지도쟁이 토끼",
    emoji: "🐰",
    url: "/avatars/rabbit.svg",
    category: "animal",
  },
  {
    id: "cat",
    label: "휴양 고양이",
    emoji: "🐱",
    url: "/avatars/cat.svg",
    category: "animal",
  },
  {
    id: "dog",
    label: "골퍼 강아지",
    emoji: "🐶",
    url: "/avatars/dog.svg",
    category: "animal",
  },
  {
    id: "penguin",
    label: "겨울 펭귄",
    emoji: "🐧",
    url: "/avatars/penguin.svg",
    category: "animal",
  },
];

export const AVATAR_BY_ID = Object.fromEntries(
  AVATAR_PRESETS.map((a) => [a.id, a])
) as Record<string, AvatarPreset>;

export function getAvatarUrl(presetId: string | null | undefined): string | null {
  if (!presetId) return null;
  return AVATAR_BY_ID[presetId]?.url ?? null;
}

export function pickRandomAvatar(): AvatarPreset {
  return AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
}

// 사용자 표시용 최종 이미지 URL 결정
export function resolveUserImage(user: {
  custom_image?: string | null;
  avatar_preset?: string | null;
  image?: string | null;
}): string | null {
  if (user.custom_image) return user.custom_image;
  const preset = getAvatarUrl(user.avatar_preset);
  if (preset) return preset;
  return user.image ?? null;
}
