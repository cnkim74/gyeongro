import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
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

  const prompt = `당신은 전문 여행 플래너입니다. 아래 조건에 맞는 상세한 여행 일정을 만들어주세요.

여행 조건:
- 목적지: ${destination}
- 기간: ${days}일
- 인원: ${people}명
- 총 예산: ${budget.toLocaleString()}원 (1인 기준 ${Math.round(budget / people).toLocaleString()}원)
- 여행 스타일: ${styleText}
- 관심 테마: ${themeText}

다음 JSON 형식으로 정확하게 응답해주세요. JSON 외에 다른 텍스트나 마크다운 코드블록은 포함하지 마세요:

{
  "title": "여행 제목 (ex: 제주도 3박 4일 힐링 여행)",
  "summary": "이 여행의 특징과 매력을 2-3문장으로 설명",
  "highlights": ["이 여행의 주요 하이라이트 1", "하이라이트 2", "하이라이트 3"],
  "totalBudget": {
    "accommodation": 숙박_총비용_숫자,
    "food": 식비_총비용_숫자,
    "transport": 교통_총비용_숫자,
    "activities": 액티비티_총비용_숫자
  },
  "days": [
    {
      "day": 1,
      "title": "Day 1 제목 (ex: 도착 & 첫 탐험)",
      "theme": "이 날의 테마",
      "schedule": [
        {
          "time": "09:00",
          "place": "장소명",
          "activity": "활동 설명 (1-2문장)",
          "duration": "소요시간 (ex: 2시간)",
          "cost": 비용_숫자,
          "tip": "현지 팁 또는 추천 포인트"
        }
      ],
      "meal": {
        "breakfast": "아침 식사 추천",
        "lunch": "점심 식사 추천 (장소명 포함)",
        "dinner": "저녁 식사 추천 (장소명 포함)"
      },
      "accommodation": "숙소 추천 (지역과 유형)",
      "dayBudget": 오늘_예상_총비용_숫자
    }
  ],
  "tips": ["여행 전체 팁 1", "팁 2", "팁 3"],
  "bestSeason": "최적 여행 시기 안내"
}

각 날의 일정은 최소 4개 이상의 schedule 항목을 포함하고, 실제 존재하는 장소와 음식점을 추천해주세요.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction:
            "당신은 한국의 전문 여행 플래너입니다. 실제 존재하는 장소, 음식점, 숙소를 기반으로 현실적이고 상세한 여행 일정을 JSON 형식으로 제공합니다. 항상 유효한 JSON만 반환하세요. 마크다운 코드블록(```)을 절대 사용하지 마세요.",
        });

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            const data = JSON.stringify({ chunk: text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

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
