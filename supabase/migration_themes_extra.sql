-- ============================================================
-- 큐레이티드 테마 추가 — 아시아 골프 + 동남아 액티비티
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- 재실행 안전 (UPSERT)
-- ============================================================

INSERT INTO public.curated_themes (slug, category, title, subtitle, description, destination, spots, tips, display_order)
VALUES
  (
    'asia-golf-bestcourse',
    'golf',
    '아시아 골프 BEST 7 — 동남아·중국·일본',
    '한국에서 직항 가능한 명문 코스 모음',
    '겨울 한국이 추울 때 따뜻한 동남아·중국 하이난, 그리고 명문 가득한 일본까지. 코스별 그린피·시즌·티타임 팁을 한눈에.',
    '아시아',
    '[
      {"name":"바나힐스 골프클럽 (Ba Na Hills GC)","country":"🇻🇳 베트남 다낭","par":72,"green_fee_kr":"15~20만원","signature":"산악 코스 18홀, 케이블카 전망","tip":"오전 라운딩 + 오후 바나힐 관광 콤보","tee_time":"한국에서 1주 전 예약 필수"},
      {"name":"블랙마운틴 (Black Mountain GC)","country":"🇹🇭 태국 후아힌","par":72,"green_fee_kr":"12~18만원","signature":"PGA 투어 개최 코스","tip":"방콕에서 차로 2.5시간 — 1박 2일 추천","tee_time":"평일이 30% 저렴"},
      {"name":"임피리얼 레이크 (KLGCC Lakes)","country":"🇲🇾 말레이시아 KL","par":72,"green_fee_kr":"20~28만원","signature":"수도권 5분 거리, 야간 라운딩 OK","tip":"우기(4-5월) 피하기","tee_time":"호텔 콤보로 가면 셔틀 무료"},
      {"name":"미션힐스 하이커우 (Mission Hills Haikou)","country":"🇨🇳 중국 하이난","par":72,"green_fee_kr":"18~25만원","signature":"세계 최대 골프 리조트(10개 코스), 화산암 위 코스","tip":"베이징·상하이에서 직항 2시간, 한국에선 광저우 경유","tee_time":"비자 면제(하이난) — 28일 무비자 체류 가능"},
      {"name":"세산 인터내셔널 (Sheshan International GC)","country":"🇨🇳 중국 상하이","par":72,"green_fee_kr":"30~45만원","signature":"WGC HSBC 챔피언십 개최, 골프 전설들의 무대","tip":"비회원 게스트 라운딩은 호텔 패키지로만 가능","tee_time":"상하이 시내 30분 거리 — 1박 출장 골프"},
      {"name":"카와나 호텔 후지 코스","country":"🇯🇵 일본 시즈오카","par":71,"green_fee_kr":"35~50만원","signature":"창업 1928년, 후지산 + 태평양 절경, 일본 100선 1위","tip":"호텔 투숙객만 라운딩 가능 (카와나 호텔)","tee_time":"3개월 전 예약 권장 — 매우 인기"},
      {"name":"PGM 로얄 오키나와 골프클럽","country":"🇯🇵 일본 오키나와","par":72,"green_fee_kr":"15~25만원","signature":"바다 옆 18홀, 1~2월에도 반팔 라운딩","tip":"오키나와 인천 직항 3시간, 겨울에도 따뜻","tee_time":"평일·아침 일찍이 가장 저렴"}
    ]'::jsonb,
    '[
      "캐디피·카트피·캐디팁은 그린피와 별도 — 1라운딩 ₩5~10만 추가",
      "🇨🇳 하이난은 28일 무비자(한국인) — 골프+휴양 패키지로 인기",
      "🇯🇵 일본 명문은 호텔 투숙 게스트만 라운딩 가능한 곳 다수",
      "11~3월이 동남아·하이난·오키나와 골프 베스트 시즌",
      "일본·중국 명문 코스는 드레스코드 엄격 (반바지/민소매 금지)",
      "골프백 위탁수하물 ₩4~8만 별도, LCC는 사이즈 제한 주의",
      "동남아·중국은 카트 의무, 일본은 걷기 가능 코스 다수"
    ]'::jsonb,
    10
  ),
  (
    'sea-activity-paradise',
    'activity',
    '동남아 액티비티 천국 — 발리·다낭·세부',
    '서핑·다이빙·호핑·랩핑까지 한 번에',
    '예산 대비 가성비 최고. 한국에서 직항 4~6시간이면 만나는 액티비티 인생샷 명소.',
    '동남아',
    '[
      {"name":"우다와 서핑 (Uluwatu Surf)","country":"🇮🇩 인도네시아 발리","activity":"서핑","level":"초중급","cost_kr":"보드 렌탈 일 ₩3만, 강습 1시간 ₩5만","season":"4~10월 (드라이시즌)","tip":"오전 6시 라운딩이 파도 가장 좋음, 일몰 서핑도 인생샷"},
      {"name":"논느억 비치 패러글라이딩","country":"🇻🇳 베트남 다낭","activity":"패러글라이딩","level":"전 레벨","cost_kr":"₩7~10만 (사진/영상 포함)","season":"3~9월","tip":"바나힐 또는 오행산과 묶어 1박 코스 추천"},
      {"name":"오슬롭 고래상어 스노클링","country":"🇵🇭 필리핀 세부","activity":"스노클링","level":"초급","cost_kr":"투어 ₩6~9만 (호텔픽업 포함)","season":"연중 가능 (12~5월 비추 — 우기)","tip":"새벽 출발 — 6시까지 도착해야 줄 짧음"},
      {"name":"피피섬 호핑 투어","country":"🇹🇭 태국 푸켓","activity":"호핑+스노클링","level":"전 레벨","cost_kr":"풀데이 투어 ₩5~8만","season":"11~4월 (몬순 피하기)","tip":"스피드보트 vs 빅보트 — 멀미 잘 나면 빅보트"},
      {"name":"랑카위 짚라인 + 케이블카","country":"🇲🇾 말레이시아 랑카위","activity":"짚라인","level":"초급","cost_kr":"케이블카 ₩2.5만 + 짚라인 ₩4만","season":"연중 (4~5월 우기 주의)","tip":"오전 케이블카 → 스카이브리지 → 오후 짚라인 동선"},
      {"name":"꽝빈 동굴 트레킹 (Phong Nha)","country":"🇻🇳 베트남 꽝빈","activity":"동굴 트레킹","level":"중급","cost_kr":"투어 ₩5~12만 (난이도별)","season":"2~8월 (홍수기 9~12월 폐쇄 가능)","tip":"세계 최대 동굴 — 사진 좋아하면 무조건 추천"}
    ]'::jsonb,
    '[
      "건기·우기 구분 필수 — 항공권 끊기 전에 확인",
      "여행자보험 — 액티비티(서핑/다이빙/짚라인) 커버되는 플랜 필수",
      "고프로·방수팩 챙기면 인생샷 확정",
      "현지 투어는 호텔 직접 예약보다 KKday/마이리얼트립이 보통 저렴",
      "다이빙 자격증(PADI/SDI)이 있으면 더 깊은 곳 가능 — 발리·세부에서 라이센스 따도 ₩40~60만",
      "동남아 일부 액티비티는 한국어 가이드 추가 비용 ₩2~5만 — 영어 OK라면 절약 가능"
    ]'::jsonb,
    11
  )
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  destination = EXCLUDED.destination,
  spots = EXCLUDED.spots,
  tips = EXCLUDED.tips,
  display_order = EXCLUDED.display_order;

-- 이전 슬러그(sea-golf-bestcourse)는 더 이상 사용 안 함 — 정리
DELETE FROM public.curated_themes WHERE slug = 'sea-golf-bestcourse';

NOTIFY pgrst, 'reload schema';
