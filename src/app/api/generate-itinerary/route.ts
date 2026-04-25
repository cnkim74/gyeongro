import { NextRequest } from "next/server";
import Groq from "groq-sdk";

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

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const body = await req.json();
  const { destination, days, people, budget, travelStyle, themes } = body;

  if (!destination || !days || !people || !budget) {
    return Response.json({ error: "필수 입력값이 없습니다." }, { status: 400 });
  }

  const themeText = themes?.length > 0 ? themes.join(", ") : "일반 관광";
  const styleMap: Record<string, string> = {
    relaxed: "여유롭고 느린 여행 (관광지보다 힐링 중심)",
    balanced: "관광과 휴식의 균형 잡힌 여행",
    packed: "최대한 많은 곳을 방문하는 빡빡한 일정",
  };
  const styleText = styleMap[travelStyle] || "균형 잡힌 여행";

  const nights = days;
  const totalDays = days + 1;

  const prompt = `당신은 전문 여행 플래너입니다. 아래 조건에 맞는 상세한 여행 일정을 만들어주세요.

여행 조건:
- 목적지: ${destination}
- 기간: ${nights}박 ${totalDays}일 (총 ${totalDays}일, 일정은 Day 1부터 Day ${totalDays}까지)
- 인원: ${people}명
- 총 예산: ${budget.toLocaleString()}원 (1인 기준 ${Math.round(budget / people).toLocaleString()}원)
- 여행 스타일: ${styleText}
- 관심 테마: ${themeText}

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
        { "time": "09:00", "place": "장소명", "activity": "활동 설명", "duration": "2시간", "cost": 숫자, "tip": "팁" }
      ],
      "meal": { "breakfast": "아침", "lunch": "점심 (장소명)", "dinner": "저녁 (장소명)" },
      "accommodation": "숙소 추천",
      "dayBudget": 숫자
    }
  ],
  "tips": ["팁1", "팁2", "팁3"],
  "bestSeason": "최적 여행 시기"
}

각 날의 schedule은 최소 4개 항목, 실제 존재하는 장소/음식점만 추천하세요.`;

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
