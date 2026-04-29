import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { consumeQuota, QuotaExceededError } from "@/lib/ai-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tryRepairJson(text: string): string {
  let t = text.trim();
  // 코드블록 제거
  t = t.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // <think> 블록 제거
  t = t.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  // 키릴/히라가나/카타카나 제거
  t = t.replace(/[Ѐ-ӿ぀-ゟ゠-ヿ]/g, "");

  // 첫 { 와 마지막 } 사이만 추출
  const firstBrace = t.indexOf("{");
  const lastBrace = t.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    t = t.slice(firstBrace, lastBrace + 1);
  }
  return t;
}

interface MedicalContext {
  procedureSlug: string;
  procedureName?: string;
  recoveryDays?: number | null;
  clinicId?: string | null;
  clinicName?: string | null;
  clinicCity?: string | null;
  treatmentDay: number; // 1-based Day index
}

const MEDICAL_GUIDANCE: Record<string, string> = {
  "plastic-surgery":
    "성형 시술은 출국 전후 활동 제한이 큼. 시술 당일 다른 일정 금지. 회복 기간(7일 내외) 동안 햇빛·운동·과음·수영장·사우나 금지. 비행기는 시술 후 5~7일 후 권장. 회복 중에는 호텔·카페·실내 박물관·짧은 산책 위주.",
  "health-checkup":
    "건강검진은 검진 전날 자정부터 금식 필수. 검진 당일은 오전~오후 병원 머무름. 검진 후 결과 상담은 1~2일 후. 검진 다음 날부터는 일반 관광 가능, 단 첫날은 가벼운 일정 권장.",
  "hair-transplant":
    "모발이식 후 7~10일 동안 머리 보호 필수. 시술 직후 2~3일은 두피 통증·붓기. 첫 5일은 모자 착용 금지(이식부 압박 위험). 햇빛·과한 활동·수영·사우나 금지. 회복기에는 실내 위주 가벼운 일정, 한국식 마사지·헬스 금지.",
};

export async function POST(req: NextRequest) {
  // 1. 로그인 필수
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "AI 플래너는 로그인 후 사용 가능합니다.", needsLogin: true },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { destination, days, people, budget, travelStyle, themes, medical } = body;
  const medicalCtx = medical as MedicalContext | null;

  if (!destination || !days || !people || !budget) {
    return Response.json({ error: "필수 입력값이 없습니다." }, { status: 400 });
  }

  // 2. 사용 한도 체크 + 차감
  try {
    await consumeQuota(session.user.id, "planner");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return Response.json(
        {
          error: `오늘의 무료 AI 플래너 한도를 다 사용했어요. (${err.used}/${err.limit})`,
          quotaExceeded: true,
          action: err.action,
          used: err.used,
          limit: err.limit,
          hasCredits: err.hasCredits,
        },
        { status: 429 }
      );
    }
    throw err;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const themeText = themes?.length > 0 ? themes.join(", ") : "일반 관광";
  const themeHints: Record<string, string> = {
    food: "현지 미식, 노포, 로컬 맛집, 미슐랭 등",
    nature: "산, 바다, 호수, 공원, 트레킹, 풍경 명소",
    culture: "박물관, 사찰, 궁궐, 유적지, 전통 공연",
    activity: "스노클링, 서핑, 스키, 카약, 자전거 등 체험",
    healing: "스파, 온천, 요가, 명상, 한적한 휴양지",
    shopping: "쇼핑몰, 아울렛, 시장, 명품거리",
    nightlife: "야경, 야시장, 바, 클럽, 루프탑",
    photo: "포토존, 인스타그램 핫플레이스, 인생샷 명소",
    movie_drama: "영화·드라마 촬영지 (예: '미드나잇 인 파리'의 알렉상드르3세 다리, '로마의 휴일' 트레비분수, K-드라마 촬영지). 작품명과 장면을 명시하세요.",
    anime: "애니메이션 성지순례 (예: '너의 이름은' 스가신사 계단, '슬램덩크' 가마쿠라코코마에역, '귀멸의 칼날' 로케지). 작품명과 명장면을 명시하세요.",
    bbang: "빵지순례 코스. 지역 유명 베이커리/제과점 위주. 시그니처 메뉴와 줄서기 팁 포함.",
    local_food: "현지 시장, 노포, 로컬 음식점, 골목 맛집 위주. 관광객이 잘 모르는 숨은 맛집 우선.",
    camping: "오토캠핑·글램핑·차박 가능한 캠핑장 우선. 사이트 예약 난이도, 화로/전기/샤워시설 여부, 인근 마트·관광지, 계절별 주의사항 명시.",
    golf: "퍼블릭/회원제 구분, 그린피·카트피 대략 비용, 부킹 난이도, 코스 특징(산악·해안·평지). 라운딩 후 식사·숙소 동선까지 포함.",
    kpop: "K-POP 성지 — HYBE/JYP/SM 사옥, 아티스트 카페·뮤직비디오 촬영지, K-POP 뮤지엄, 굿즈샵, 팝업스토어. 구체적인 그룹/노래/영상 명시 (예: 'BTS Boy with Luv 거울 신', 'NewJeans 한남동 카페'). 인증샷 포인트와 줄서기 팁 포함.",
    pet: "반려견 동반 가능 시설만. 입장 가능한 카페·해변·캠핑장·호텔, 펫 사이즈/견종 제한, 리쉬 의무 여부, 펫 동반 항공편 정보(있으면). 체력 회복 시간 고려해 무리 없는 일정. 동물병원 위치 1~2개 포함.",
    honeymoon: "허니문 분위기 — 프라이빗 풀빌라, 인피니티풀, 오션뷰 디너, 일몰 액티비티, 커플 스파, 야경 명소. 이른 체크인·레이트 체크아웃 가능 호텔 우선. 사진 잘 나오는 포토스팟·뷰포인트 강조. 각 day 1~2개 핵심 이벤트 위주로 여유 있게.",
    hiking_trekking: "산행·트레킹 — 1일 도시 근교 하이킹부터 다일정 종주 트레킹까지. 등산로 난이도(초중상), 코스 길이·소요시간·표고차, 산장·대피소 예약(다일정), 고산병 대비(3,000m+), 필수 장비, 비상 대피로·구조 연락처. 초보 동선 우선이되 다일정이면 일별 거리 명확히.",
    onsen: "온천·스파 — 일본 료칸·온천(가이세키 포함), 한국 24시간 찜질방 BIG 5, 동남아 럭셔리 스파(발리·치앙마이), 대만 베이터우. 객실 노천탕(露天風呂) 유무, 문신 가능 여부(일본), 가격대(₩만원~). 식사·휴식 위주 여유 일정.",
    roadtrip: "렌트카 자유 여행 — 일별 운전 거리·소요시간(휴식 시간 포함), 추천 렌트 회사, 차량 카테고리(컴팩트/SUV/RV), 좌측·우측 통행 국가별 주의, 주유소/충전소 동선, 주차 가능한 숙소·관광지. 국제면허증 안내 한 줄 포함(예: '한국 운전면허시험장에서 ₩8,500, 즉시 발급, 유효 1년'). 직진 거리 200km 이상 구간은 중간 휴게 포인트 명시.",
    pilgrimage: "성지순례 — 산티아고 데 콤포스텔라(카미노), 시코쿠 88사찰, 보드가야·바라나시(인도), 예루살렘, 메카 등. 일별 도보 거리/이동 수단, 알베르게·도미토리 숙소 정보, Compostela 같은 증명서 발급 조건, 관습·복장 주의(특히 종교 성지), 영적·문화적 의미 한 줄. 성수기·금식기간 등 종교 일정도 반영.",
  };
  const themeDetail = (themes ?? [])
    .map((t: string) => themeHints[t])
    .filter(Boolean)
    .join("\n  - ");
  const styleMap: Record<string, string> = {
    relaxed: "여유롭고 느린 여행 (관광지보다 힐링 중심)",
    balanced: "관광과 휴식의 균형 잡힌 여행",
    packed: "최대한 많은 곳을 방문하는 빡빡한 일정",
  };
  const styleText = styleMap[travelStyle] || "균형 잡힌 여행";

  const nights = days;
  const totalDays = days + 1;

  // 의료관광 가이드 블록
  let medicalBlock = "";
  if (medicalCtx?.procedureSlug && medicalCtx.treatmentDay >= 1) {
    const guidance = MEDICAL_GUIDANCE[medicalCtx.procedureSlug] ?? "";
    const recoveryEndDay = Math.min(
      totalDays,
      medicalCtx.treatmentDay + (medicalCtx.recoveryDays ?? 3)
    );
    medicalBlock = `

⚕️ 의료관광 일정 통합 (매우 중요):
- 시술: ${medicalCtx.procedureName ?? medicalCtx.procedureSlug}
${medicalCtx.clinicName ? `- 클리닉: ${medicalCtx.clinicName}${medicalCtx.clinicCity ? ` (${medicalCtx.clinicCity})` : ""}` : ""}
- 시술 받는 날: Day ${medicalCtx.treatmentDay}
- 회복 기간: Day ${medicalCtx.treatmentDay} ~ Day ${recoveryEndDay}

회복 가이드: ${guidance}

다음 규칙을 반드시 지켜:
1. Day ${medicalCtx.treatmentDay} (시술일): 오전 시술 → 오후~저녁은 숙소 휴식. 스케줄 항목은 1~2개만, 모두 클리닉/병원 또는 인근 호텔.
2. Day ${medicalCtx.treatmentDay + 1} ~ Day ${recoveryEndDay} (회복일): 가벼운 실내 활동만. 카페·서점·박물관·짧은 산책. 격한 운동·물놀이·사우나·뷔페·과음 금지. 클리닉/병원 인근 동선으로 묶기.
3. Day ${medicalCtx.treatmentDay - 1} 이전 (시술 전): 일반 관광 가능. 단 시술 전날(Day ${medicalCtx.treatmentDay - 1})은 가벼운 일정 + 일찍 귀가. 건강검진의 경우 자정부터 금식.
4. Day ${recoveryEndDay + 1} 이후 (회복 후): 정상 관광 일정 가능.
5. 각 day의 title 또는 theme 안에 시술일/회복일임을 명시 (예: "시술일 — 휴식", "회복 2일차 — 가벼운 산책").
6. tips 배열에 의료 주의사항 1~2개 추가.`;
  }

  const prompt = `당신은 전문 여행 플래너입니다. 아래 조건에 맞는 상세한 여행 일정을 만들어주세요.

여행 조건:
- 목적지: ${destination}
- 기간: ${nights}박 ${totalDays}일 (총 ${totalDays}일, 일정은 Day 1부터 Day ${totalDays}까지)
- 인원: ${people}명
- 총 예산: ${budget.toLocaleString()}원 (1인 기준 ${Math.round(budget / people).toLocaleString()}원)
- 여행 스타일: ${styleText}
- 관심 테마: ${themeText}${themeDetail ? `\n  - ${themeDetail}` : ""}${medicalBlock}

다음 JSON 구조로 응답하세요:

{
  "title": "여행 제목 (반드시 '박'이 '일'보다 앞)",
  "summary": "여행 특징을 2-3문장으로",
  "highlights": ["하이라이트 1", "하이라이트 2", "하이라이트 3"],
  "totalBudget": {
    "accommodation": 숫자,
    "food": 숫자,
    "transport": 숫자,
    "activities": 숫자
  },
  "days": [
    {
      "day": 1,
      "title": "Day 1 제목",
      "theme": "이 날의 테마",
      "schedule": [
        {
          "time": "09:00",
          "place": "장소명",
          "activity": "활동 설명",
          "duration": "2시간",
          "cost": 숫자,
          "tip": "팁",
          "transport_to_next": {
            "mode": "🚇 지하철 4호선" | "🚌 버스 02번" | "🚶 도보" | "🚖 택시" | "🚇 메트로 1호선" | "🚊 트램" | "🚄 신칸센" 등,
            "duration": "12분",
            "cost_kr": "₩1,400" 또는 "무료" 또는 null
          },
          "nearby_alternatives": [
            { "name": "비슷한 장소 A", "reason": "분위기/카테고리 비슷한 이유 한 줄" },
            { "name": "비슷한 장소 B", "reason": "다른 매력 한 줄" }
          ],
          "nearby_food": [
            {
              "name": "근처 인기 카페·식당",
              "type": "카페" | "디저트" | "현지식" | "베이커리" 등,
              "why": "왜 SNS에 자주 노출되는지·시그니처 한 줄"
            }
          ]
        }
      ],
      "meal": { "breakfast": "아침", "lunch": "점심 (장소명)", "dinner": "저녁 (장소명)" },
      "accommodation": "숙소 추천",
      "dayBudget": 숫자
    }
  ],
  "tips": ["팁1", "팁2", "팁3"],
  "bestSeason": "최적 여행 시기"
}

규칙:
- schedule 항목은 최소 4개, 실제 존재하는 장소·음식점만 추천 (가공된 가게 금지).
- transport_to_next는 마지막 항목을 제외한 모든 항목에 포함.
- nearby_alternatives: 메인 장소와 카테고리·분위기 비슷한 대체지 2개 (있으면).
- nearby_food: 도보 5~15분 거리의 SNS·인스타·구글 인기 카페·디저트·식당 1개 (있으면).
  · 한국이면 백종원·블루리본·미슐랭·핫플·인기 베이커리 위주.
  · 해외면 식당 가이드(미슐랭·테이블링·태블호퍼·로컬 인기 SNS)에 자주 등장하는 곳.
- 모든 장소명은 영문이면 영문, 한글이면 한글로 일관되게.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "당신은 한국의 전문 여행 플래너입니다. 실제 존재하는 장소, 음식점, 숙소를 기반으로 현실적이고 상세한 여행 일정을 제공합니다.\n\n【언어 규칙】\n- 모든 텍스트 값은 반드시 한국어(한글)로만 작성. 러시아어/일본어 히라가나·카타카나/중국어 한자 금지.\n- 해외 고유명사는 한글 음차 + 괄호 안 영문만 허용. 예: 에펠탑(Eiffel Tower), 스시(sushi).\n\n【JSON 규칙 - 매우 중요】\n- 출력은 반드시 valid JSON object 만 반환 (단 하나의 { ... } 객체).\n- 모든 문자열 값은 \"...\" 큰따옴표로 감싸야 함. 절대 따옴표를 빼먹지 말 것.\n- 문자열 안에서 큰따옴표를 사용해야 할 때는 반드시 \\\" 로 이스케이프.\n- 숫자 값은 따옴표 없이 숫자만 (예: 50000).\n- 마크다운, 설명, 코드블록 ``` 절대 금지. JSON 만 출력.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 6000,
          response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content ?? "";
        const cleaned = tryRepairJson(raw);

        // 검증: 진짜 valid JSON인지 서버에서 미리 파싱 시도
        try {
          JSON.parse(cleaned);
        } catch {
          // 한 번 더 시도: AI에게 수정 요청
          const repair = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content:
                  "다음 JSON 문자열에 문법 오류가 있습니다. 오류를 수정해서 valid JSON 만 반환하세요. 다른 텍스트 절대 추가하지 마세요.",
              },
              { role: "user", content: cleaned },
            ],
            max_tokens: 6000,
            response_format: { type: "json_object" },
          });
          const repaired = tryRepairJson(repair.choices[0]?.message?.content ?? "");
          // 재파싱 시도 (실패하면 그대로 보내고 클라이언트 에러 처리)
          try {
            JSON.parse(repaired);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: repaired })}\n\n`)
            );
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
            controller.close();
            return;
          } catch {
            // fall through - 원본 cleaned 보냄 (클라이언트가 에러 처리)
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: cleaned })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
