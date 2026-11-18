// 고정 목록(해외 대표 축제·박람회) 대표 사진 — 위키미디어 공용 자유 이용 사진 (public/festivals)
import type { GlobalFestival } from "./global-festivals";

export const FESTIVAL_IMAGES: Record<string, { file: string; credit: string; creditUrl: string }> = {};

/** 고정 목록 항목에 대표 사진 붙이기 (AI 큐레이션 항목은 DB 에 사진이 있음) */
export function withImage(f: GlobalFestival): GlobalFestival {
  if (f.image) return f;
  const img = FESTIVAL_IMAGES[f.id];
  return img ? { ...f, image: img.file, imageCredit: img.credit, imageCreditUrl: img.creditUrl } : f;
}
