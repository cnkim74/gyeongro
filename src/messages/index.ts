// 번역 메시지 — 한국어 / 영어 / 일본어 / 중국어 (간체)
// 키 추가 시 모든 언어 파일에 채워주세요. 누락 시 한국어 폴백.

import { ko, KO_KEYS } from "./ko";
import { en } from "./en";
import { ja } from "./ja";
import { zh } from "./zh";

export const messages = { ko, en, ja, zh };

// 키 자동완성용 — 정적 분석 가능한 union
export type MessageKey = (typeof KO_KEYS)[number] | string;
