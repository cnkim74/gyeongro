// 유튜브 주소 해석 — 게시글 본문 등에서 영상 ID·채널 주소 추출 (서버·클라이언트 공용)

const VIDEO_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?[^\s]*?v=([A-Za-z0-9_-]{11})/g,
  /(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]{11})/g,
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/g,
];

const CHANNEL_PATTERN =
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(@[\w.%-]+|channel\/UC[\w-]{20,}|c\/[\w.%-]+)/g;

export function extractYouTube(text: string): { videoIds: string[]; channels: string[] } {
  const videoIds: string[] = [];
  for (const re of VIDEO_PATTERNS) {
    for (const m of text.matchAll(re)) if (!videoIds.includes(m[1])) videoIds.push(m[1]);
  }
  const channels: string[] = [];
  for (const m of text.matchAll(CHANNEL_PATTERN)) {
    const url = `https://www.youtube.com/${m[1]}`;
    if (!channels.includes(url)) channels.push(url);
  }
  return { videoIds, channels };
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** 채널 주소 → 표시 이름 (@핸들 등) */
export function channelLabel(url: string): string {
  const tail = url.replace(/^https:\/\/www\.youtube\.com\//, "");
  try {
    return decodeURIComponent(tail.replace(/^c\//, "").replace(/^channel\//, ""));
  } catch {
    return tail;
  }
}
