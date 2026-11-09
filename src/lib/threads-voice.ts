// 스레드 말투 — 화면·서버 공용 (서버 전용 import 없음)

export const THREADS_VOICES = [
  {
    key: "friend",
    label: "친구 꿀팁 (반말)",
    desc: "여행 좋아하는 친구가 꿀팁 알려 주듯",
    rule: "여행 좋아하는 크리에이터가 친구에게 꿀팁 알려 주는 친근한 반말·구어체. 예: \"이거 모르면 손해야\", \"다들 알고 있었어?\"",
  },
  {
    key: "polite",
    label: "다정한 존댓말",
    desc: "팔로워에게 소개하듯 ~해요체",
    rule: "다정하고 친근한 존댓말(~해요체). 여행 크리에이터가 팔로워에게 소개하는 느낌. 예: \"이거 알고 가면 훨씬 편해요\", \"여러분은 어디가 궁금하세요?\"",
  },
  {
    key: "punchy",
    label: "짧고 임팩트",
    desc: "후킹 한 줄 + 핵심 한두 줄",
    rule: "아주 짧고 임팩트 있게. 후킹 한 줄 + 핵심 1~2줄이 전부, 군더더기·수식어 없이. 반말. 전체 150자 안팎",
  },
  {
    key: "list",
    label: "정보 정리형",
    desc: "번호 목록으로 핵심 3개",
    rule: "정보 정리형 존댓말. 후킹 한 줄 뒤에 '1. 2. 3.' 번호로 핵심 3가지를 한 줄씩, 담백하게",
  },
  {
    key: "essay",
    label: "감성 에세이",
    desc: "풍경이 그려지는 짧은 문장",
    rule: "감성 여행 에세이 느낌의 존댓말. 풍경과 분위기가 그려지는 짧은 문장, 이모지는 0~1개. 단, 글쓴이가 직접 가 본 것처럼 쓰지 말고 '이런 곳이에요'처럼 소개하는 시점으로",
  },
] as const;

export type ThreadsVoiceKey = (typeof THREADS_VOICES)[number]["key"];

export function isThreadsVoice(v: unknown): v is ThreadsVoiceKey {
  return typeof v === "string" && THREADS_VOICES.some((x) => x.key === v);
}

/** 프롬프트에 넣을 스레드 글 규칙 ({URL} 자리에 링크가 들어감) */
export function threadsRules(voice: ThreadsVoiceKey = "friend", custom = ""): string {
  const v = THREADS_VOICES.find((x) => x.key === voice) ?? THREADS_VOICES[0];
  const extra = custom.trim() ? `\n  · 운영자 추가 요청(위 규칙과 아래 '꼭 지킬 것'보다 우선하지 않음): ${custom.trim().slice(0, 300)}` : "";
  return `스레드(Threads)용 짧은 글 (공백 포함 350자 이내)
  · 말투: ${v.rule}
  · 첫 줄은 스크롤을 멈추게 하는 한 줄 (질문, 의외의 사실, "이거 모르면 손해" 같은 후킹). 광고 문구·"Pothos가 알려드립니다" 같은 표현 금지
  · 이어서 핵심 (줄바꿈 넉넉히, 이모지는 많아야 3개)
  · 마지막에 댓글을 부르는 짧은 질문 한 줄
  · 그다음 줄에 "{URL}" (자세한 내용은 여기 같은 짧은 안내와 함께)
  · 해시태그는 맨 끝에 주제 태그 딱 1개 (예: #일본여행)${extra}
  · 꼭 지킬 것: 직접 다녀온 척하는 경험담(예: "내가 가 봤는데") 금지, 자료에 없는 숫자·날짜·가격을 지어내지 말 것`;
}
