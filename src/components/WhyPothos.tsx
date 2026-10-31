// "그냥 AI 챗봇과 무엇이 다른가요?" — 메인 히어로 바로 아래 비교 섹션
// ※ 실제로 구현된 기능만 적을 것 (과장 금지)

import Link from "next/link";
import { X, Check, ArrowRight } from "lucide-react";

const ROWS: { topic: string; chatbot: string; pothos: string }[] = [
  {
    topic: "장소",
    chatbot: "없는 가게나 문 닫은 곳을 그럴듯하게 지어내기도 해요",
    pothos: "장소마다 구글 지도에서 실제 위치를 찾아 지도에 표시해요",
  },
  {
    topic: "동선",
    chatbot: "글로만 나열해서 실제 이동이 가능한지 알기 어려워요",
    pothos: "날짜별 지도에 번호 핀과 동선, 장소 사이 길찾기를 연결해요",
  },
  {
    topic: "축제·행사",
    chatbot: "학습한 시점의 오래된 정보일 수 있어요",
    pothos: "한국관광공사 공식 데이터로 지금 열리는 축제를 반영해요",
  },
  {
    topic: "날짜",
    chatbot: "요일·휴무를 고려하지 못하는 경우가 많아요",
    pothos: "출발일을 넣으면 날짜별 요일과 축제 기간을 반영해요",
  },
  {
    topic: "안전·날씨",
    chatbot: "일반적인 조언에 그쳐요",
    pothos: "외교부 여행경보와 현지 날씨를 실시간으로 확인해요",
  },
  {
    topic: "확인",
    chatbot: "추천을 믿어도 될지 직접 검색해야 해요",
    pothos: "장소를 누르면 구글 평점·사진·영업시간을 바로 보여줘요",
  },
];

export default function WhyPothos() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-blue-600 tracking-wide mb-2">WHY POTHOS</p>
          <h2 className="text-[28px] sm:text-4xl font-bold text-gray-900 leading-snug">
            그냥 AI 챗봇과
            <br className="sm:hidden" /> 무엇이 다른가요?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mt-3">
            그럴듯한 답변이 아니라, 지도와 공식 데이터로 확인한 &lsquo;진짜 갈 수 있는 여행&rsquo;을 만듭니다
          </p>
        </div>

        {/* 휴대폰: 주제별 카드 */}
        <div className="sm:hidden space-y-3">
          {ROWS.map((r) => (
            <div key={r.topic} className="rounded-3xl border border-gray-100 bg-white shadow-[0_10px_28px_-18px_rgba(30,41,59,0.4)] overflow-hidden">
              <p className="px-5 pt-4 text-lg font-bold text-gray-900">{r.topic}</p>
              <div className="px-5 py-3 flex gap-2 text-[15px] text-gray-500 leading-relaxed">
                <span className="shrink-0 mt-0.5 px-2 py-0.5 h-fit rounded-full bg-gray-100 text-xs font-bold text-gray-500">AI 챗봇</span>
                <span>{r.chatbot}</span>
              </div>
              <div className="px-5 py-3 flex gap-2 text-[15px] text-gray-900 font-medium leading-relaxed bg-gradient-to-r from-blue-50 to-indigo-50">
                <span className="shrink-0 mt-0.5 px-2 py-0.5 h-fit rounded-full bg-blue-600 text-xs font-bold text-white">Pothos</span>
                <span>{r.pothos}</span>
              </div>
            </div>
          ))}
        </div>

        {/* PC: 비교 표 */}
        <div className="hidden sm:block rounded-3xl overflow-hidden border border-gray-100 shadow-[0_16px_40px_-20px_rgba(30,41,59,0.35)]">
          {/* 머리글 */}
          <div className="grid grid-cols-[72px_1fr_1fr] sm:grid-cols-[120px_1fr_1fr] text-[15px] font-bold">
            <div className="bg-gray-50" />
            <div className="bg-gray-100 text-gray-600 px-3 sm:px-5 py-4">일반 AI 챗봇</div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-5 py-4">Pothos</div>
          </div>
          {ROWS.map((r, i) => (
            <div
              key={r.topic}
              className={`grid grid-cols-[72px_1fr_1fr] sm:grid-cols-[120px_1fr_1fr] ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <div className="bg-gray-50 px-2 sm:px-5 py-4 text-[15px] font-bold text-gray-800 flex items-center">{r.topic}</div>
              <div className="px-3 sm:px-5 py-4 text-sm sm:text-[15px] text-gray-500 leading-relaxed flex gap-2">
                <X className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                <span>{r.chatbot}</span>
              </div>
              <div className="px-3 sm:px-5 py-4 text-sm sm:text-[15px] text-gray-900 font-medium leading-relaxed flex gap-2 bg-blue-50/50">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                <span>{r.pothos}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold shadow-lg hover:-translate-y-0.5 transition-all"
          >
            직접 비교해 보기 <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
