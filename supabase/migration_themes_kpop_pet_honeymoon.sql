-- ============================================================
-- 큐레이티드 테마 시드 — K-POP / 펫 동반 / 허니문 (Step: 카테고리 신설)
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복붙 → Run
-- 재실행 안전 (UPSERT)
-- ============================================================

INSERT INTO public.curated_themes (slug, category, title, subtitle, description, destination, spots, tips, display_order)
VALUES
  -- ─────────────────────────── K-POP ───────────────────────────
  (
    'seoul-kpop-pilgrimage',
    'kpop',
    '서울 K-POP 성지 순례 5선',
    'BTS·NewJeans·BLACKPINK 팬이라면 필수',
    '소속사 사옥, 뮤직비디오 촬영지, 아티스트 카페까지. 외국인 인바운드 1순위 코스.',
    '서울',
    '[
      {"name":"HYBE 사옥","area":"용산","desc":"BTS·NewJeans·LE SSERAFIM·세븐틴 등 본사. 외관 인증샷 + 1층 굿즈샵 BTS HOME","tip":"굿즈샵은 평일 오전이 한산"},
      {"name":"JYP 사옥","area":"성수동","desc":"TWICE·Stray Kids·ITZY·NMIXX 본사. 카페 ''잠JYP카페''에서 굿즈 구매 가능","tip":"성수동 카페 투어와 묶어 코스화"},
      {"name":"SM 사옥","area":"성수동","desc":"NCT·aespa·EXO·Red Velvet 본사. KWANGYA@SEOUL 플래그십 스토어 인기","tip":"디지털 굿즈 체험존 무료"},
      {"name":"BTS 한강 자전거 신 — 망원한강공원","area":"마포","desc":"''Spring Day'' 뮤직비디오 + ''Permission to Dance'' 자전거 신 촬영지","tip":"자전거 대여 1시간 ₩3,000"},
      {"name":"NewJeans 한남동 카페 거리","area":"한남","desc":"''Hype Boy'' 뮤직비디오 거리 + 멤버들 자주 방문하는 카페","tip":"카페별로 NewJeans 굿즈 구비"}
    ]'::jsonb,
    '[
      "굿즈샵은 평일 오전이 줄 가장 짧음",
      "팬미팅·콘서트 일정은 위버스(Weverse)·트위터에서 미리 확인",
      "성수동 JYP/SM은 도보 10분 — 묶어서 동선 짜기",
      "포토스팟은 기본적으로 ''외관'' OK, ''내부 직원 통제구역''은 진입 금지",
      "외국인은 KORAIL PASS + T-money 함께 쓰면 동선 효율"
    ]'::jsonb,
    20
  ),
  -- ─────────────────────────── 펫 동반 ───────────────────────────
  (
    'gangwon-pet-trip',
    'pet',
    '반려견과 함께 강원도 2박 3일',
    '펫 동반 호텔·해변·카페 코스',
    '반려견 입장 가능한 시설만 모은 강원도 일정. 펫 사이즈·견종 제한 정보까지 정리.',
    '강원도',
    '[
      {"name":"양양 죽도해변","area":"양양","desc":"비수기 평일은 반려견 동반 자유. 모래 부드러워 패드 발 무리 없음","tip":"7~8월 성수기는 견종·시간 제한 — 새벽/저녁만 가능"},
      {"name":"속초 ''개랑 카페''","area":"속초","desc":"중대형견까지 입장 OK. 마당 + 실내 모두 가능, 산책 후 휴식 좋음","tip":"수제 강아지 간식 인기"},
      {"name":"강릉 ''댕댕이 풀빌라''","area":"강릉","desc":"객실 내 반려견 전용 풀, 야외 잔디마당. 1견 무료 + 2견부터 ₩30,000","tip":"미리 예약 필수 — 주말 만실"},
      {"name":"평창 알펜시아 펫 동반 글램핑","area":"평창","desc":"펫 동반 객실 별도 운영, 산책로 + 펫 스파","tip":"중성화 증명서 요구하는 시즌 있음"},
      {"name":"동물병원 ''원주 24시간 펫메디케어''","area":"원주","desc":"여행 중 응급 대비 — 24시간 운영, 영문 진료 가능","tip":"GPS 즐겨찾기 추천"}
    ]'::jsonb,
    '[
      "반려견 좌석 비용 — KTX는 반려견 1마리 무료(케이지 필수), 차량 렌탈은 펫 옵션 별도 ₩10,000~20,000",
      "여름 차량 이동은 30분마다 휴식 — 핸디 선풍기·물그릇 필수",
      "펫 호텔·풀빌라는 광견병·심장사상충 예방접종 증명서 요구하는 곳 다수",
      "리쉬·배변봉투·휴대용 물병은 기본",
      "동물병원 위치는 1박마다 1곳 미리 확인",
      "성수기엔 반려견 동반 가능 식당이 줄을 길게 받음 — 점심은 일찍"
    ]'::jsonb,
    21
  ),
  -- ─────────────────────────── 허니문 ───────────────────────────
  (
    'sea-honeymoon-poolvilla',
    'honeymoon',
    '동남아 허니문 BEST 5 — 풀빌라·인피니티풀',
    '발리·푸켓·세부·푸꾸옥·랑카위',
    '직항 5~7시간, 풀빌라 가성비·인피니티풀·일몰 디너까지. 신혼 분위기 100점.',
    '동남아',
    '[
      {"name":"AYANA Komaneka 우붓 풀빌라","country":"🇮🇩 인도네시아 발리 우붓","level":"럭셔리","cost_kr":"성수기 1박 ₩70~120만 (식사 포함)","season":"4~10월 (드라이시즌)","tip":"우붓 정글 뷰 + 프라이빗 풀, 발리니즈 스파 가능, 11시 레이트 체크아웃 가능"},
      {"name":"The Surin Phuket","country":"🇹🇭 태국 푸켓","level":"럭셔리","cost_kr":"성수기 1박 ₩40~70만","season":"11~4월","tip":"코티지 스타일 풀빌라, 프라이빗 비치 — 일몰 디너 강추"},
      {"name":"Shangri-La Mactan Cebu","country":"🇵🇭 필리핀 세부","level":"중상급","cost_kr":"1박 ₩35~55만 (조식 포함)","season":"12~5월 (성수기)","tip":"인피니티풀 + 프라이빗 비치, 호핑투어 호텔 직접 예약"},
      {"name":"InterContinental Phu Quoc Long Beach","country":"🇻🇳 베트남 푸꾸옥","level":"럭셔리","cost_kr":"1박 ₩40~70만","season":"11~3월","tip":"푸꾸옥은 무비자 30일 — 베트남 다른 도시보다 한적"},
      {"name":"Four Seasons Langkawi","country":"🇲🇾 말레이시아 랑카위","level":"최상급","cost_kr":"1박 ₩60~120만","season":"11~3월","tip":"안다만해 인피니티풀, 짚라인·맹그로브 투어 패키지 — 랑카위는 면세지역"}
    ]'::jsonb,
    '[
      "허니문은 ''레이트 체크아웃''(보통 14시) 협의 가능 — 예약 시 신혼 메모 남기기",
      "풀빌라는 비수기/성수기 가격 차 2배 — 4월/10월이 가성비 베스트",
      "한국→동남아 직항 5~7시간, 비행기 ''허니무너 좌석''(앞쪽) 요청 가능",
      "유심·이심은 출국 전 미리 — 현지 공항은 줄이 길어 시간 손실",
      "동남아 호텔은 ''카플 매시지''(부부 동시 마사지) 예약이 인기 — 사전 예약 필수",
      "여행자보험에 의료비 한도 1억 이상 + 항공편 결항 보장 추가 추천"
    ]'::jsonb,
    22
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

NOTIFY pgrst, 'reload schema';
