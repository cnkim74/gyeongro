// 스레드 하루 게시 수 → 게시 시간대(KST 시) — 화면·서버 공용 (서버 전용 import 없음)
export const THREADS_SLOTS: Record<number, number[]> = {
  1: [8],
  2: [8, 18],
  3: [8, 12, 18],
  4: [8, 12, 18, 21],
};
