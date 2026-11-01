// 여행 준비 가이드 — 주제별 핵심 정보 + 공식 안내 링크 + 추천 유튜브 영상
//
// - 수수료·요건처럼 자주 바뀌는 숫자는 적지 않고 공식 사이트로 안내
// - 유튜브 영상은 실제 존재를 확인한 영상만 (2026-10 YouTube oEmbed 로 제목·채널 확인)
// - 커뮤니티 '여행 유튜브' 게시판 글도 가이드 페이지 하단에 함께 노출

export interface GuideVideo {
  id: string;
  title: string;
  channel: string;
}

export interface GuideTopic {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  gradient: string;
  points: string[];
  links: { label: string; url: string }[];
  videos: GuideVideo[];
  /** 더 많은 영상 검색어 */
  youtubeQuery: string;
  /** 함께 보여줄 쿠팡 파트너스 상품 카테고리 (관리자 '쿠팡 파트너스'에서 등록한 상품) */
  shopCategories?: string[];
}

/** 운영자 유튜브 채널 — 여행 준비 페이지 맨 위 + 각 주제 추천 영상 1순위 */
export const OWNER_CHANNEL = {
  name: "지금이 여행의 기회 - Chance Trip",
  url: "https://www.youtube.com/@chancetrip",
  videos: [
    { id: "Udgwk6U3vgw", title: "일본 여행 시 반드시 필요한 교통카드 | SUICA, PASMO, ICOCA", channel: "지금이 여행의 기회 - Chance Trip" },
    { id: "9hXScyGSnyU", title: "비자발급 꼭 받아야 될까? | 비자발급이 필요한 국가와 무비자가 가능한 국가", channel: "지금이 여행의 기회 - Chance Trip" },
    { id: "ANASO5uprDE", title: "해외 여행때 차가 필요하다면? | 글로벌 Top7 렌터카 회사 선정", channel: "지금이 여행의 기회 - Chance Trip" },
    { id: "_t-x1yK1KSw", title: "이제 해외여행에서도 직접 운전해보자 | 국제면허증 사용에 대한 유용한 팁", channel: "지금이 여행의 기회 - Chance Trip" },
  ] as GuideVideo[],
};
const owner = (id: string) => OWNER_CHANNEL.videos.find((v) => v.id === id)!;

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "passport",
    emoji: "🛂",
    title: "여권 발급·재발급",
    summary: "신규 발급은 구청·시청 방문, 재발급은 온라인 신청도 가능해요",
    gradient: "from-indigo-500 to-blue-500",
    points: [
      "처음 만드는 여권은 가까운 시·군·구청 여권 민원실을 방문해 신청해요.",
      "이미 여권이 있다면 정부24에서 온라인 재발급 신청 후 수령만 방문으로 할 수 있어요.",
      "많은 나라가 입국 시 여권 유효기간 6개월 이상 남아 있기를 요구해요. 출발 전 꼭 확인!",
      "여권 사진 규격·수수료·준비물은 외교부 여권안내에서 최신 기준을 확인하세요.",
    ],
    links: [
      { label: "외교부 여권안내", url: "https://www.passport.go.kr" },
      { label: "정부24 (온라인 재발급)", url: "https://www.gov.kr" },
    ],
    videos: [
      { id: "ZypYuvJivbc", title: "여권발급/만들기/준비물/ 사진부터 수수료까지, 알아두면 편리한 발급 정보", channel: "실생활정보" },
      { id: "gRXGvjt4nrc", title: "여권 재발급 방법｜온라인 신청부터 준비물·비용까지 총정리", channel: "정보공유생활백서" },
      { id: "I4cEAZc3Y0Y", title: "2분으로 끝내는 여권발급의 모든 것!｜차세대 전자여권 (재)발급", channel: "의정부시" },
    ],
    youtubeQuery: "여권 발급 방법",
  },
  {
    id: "safety",
    emoji: "🛡️",
    title: "해외 안전·여행경보",
    summary: "출발 전 여행경보 단계 확인, 위급할 땐 영사콜센터",
    gradient: "from-rose-500 to-red-500",
    points: [
      "외교부 해외안전여행 사이트에서 나라별 여행경보 단계(유의·자제·출국권고·금지)를 확인하세요.",
      "해외에서 사건·사고가 나면 영사콜센터(+82-2-3210-0404)로 24시간 도움을 받을 수 있어요.",
      "출국 전 '해외안전여행' 앱을 설치하고 동행 가족에게 일정을 공유해 두면 좋아요.",
      "여권·카드는 사본(사진)을 따로 보관하고, 귀중품은 나눠서 보관하세요.",
    ],
    links: [
      { label: "외교부 해외안전여행", url: "https://www.0404.go.kr" },
    ],
    videos: [
      { id: "dTk5Ligx1pc", title: "해외여행 중 위기상황에 처한다면? 꼭 알아야 할 대처법 3가지", channel: "외교부" },
      { id: "plJeUx00q2c", title: "해외여행 중 위급한 순간⚠️ 해외안전여행 앱으로 안전하게", channel: "외교부 해외안전여행" },
      { id: "_NUl4HX2Z7M", title: "해외여행 전 여행 경보 확인하세요! [해외안전여행정보]", channel: "YTN korean" },
    ],
    youtubeQuery: "해외여행 안전 수칙",
    shopCategories: ["health"],
  },
  {
    id: "idp",
    emoji: "🚗",
    title: "국제운전면허증",
    summary: "운전면허시험장 등에서 당일 발급, 유효기간 1년",
    gradient: "from-emerald-500 to-teal-500",
    points: [
      "전국 운전면허시험장, 일부 경찰서, 인천공항 등에서 신청할 수 있고 온라인 신청도 가능해요.",
      "국제운전면허증은 발급일부터 1년간 유효해요. 국내 운전면허증도 함께 챙기세요.",
      "나라마다 인정하는 면허 형식이 달라요. 방문국에서 국제면허·영문면허 중 무엇이 되는지 확인하세요.",
      "발급 장소·준비물·수수료는 도로교통공단 안내에서 최신 기준을 확인하세요.",
    ],
    links: [
      { label: "도로교통공단 안전운전 통합민원", url: "https://www.safedriving.or.kr" },
    ],
    videos: [
      owner("_t-x1yK1KSw"),
      { id: "FBQY1Mql29s", title: "국제운전면허증 발급받는 방법", channel: "아빠가이드TV" },
      { id: "15uJlXzq99w", title: "국제운전면허증 발급! 온라인으로도 가능하네요", channel: "채널서누" },
      { id: "WvVoUhtmLrs", title: "9월 발급되는 새 국제운전면허증, 35개국서 쓸 수 있다", channel: "SBS 뉴스" },
    ],
    youtubeQuery: "국제운전면허증 발급",
  },
  {
    id: "rentcar",
    emoji: "🚙",
    title: "해외 렌터카",
    summary: "예약·보험·픽업·반납까지 처음이라면 이것만은 꼭",
    gradient: "from-sky-500 to-cyan-500",
    points: [
      "예약 시 보험 보장 범위(자차·대인·대물)와 자기부담금을 꼭 확인하세요.",
      "픽업할 때 차량 외관을 사진·영상으로 남겨 두면 반납 분쟁을 막을 수 있어요.",
      "일본·영국·호주 등은 좌측통행이에요. 주차·톨게이트·주유 방식도 미리 알아두세요.",
      "국제운전면허증 + 국내 면허증 + 예약자 명의 신용카드를 함께 준비하세요.",
    ],
    links: [
      { label: "도로교통공단 (국제면허 인정 국가)", url: "https://www.safedriving.or.kr" },
    ],
    videos: [
      owner("ANASO5uprDE"),
      { id: "rmrk7H7sPUI", title: "해외에서 처음 렌트카 빌리는 사람이라면 꼭 봐야하는 영상!", channel: "오늘뭐할까 Onul" },
      { id: "Z6fbprzbrVU", title: "유럽 렌트카의 모든 것! 예약에서부터 출고, 주행, 주차, 주유, 반납까지", channel: "게으른 완벽주의자" },
      { id: "EofyyqvZeWE", title: "미국에서 렌트카 이용하기 전에 꼭 봐야하는 영상", channel: "카모아 CARMORE" },
    ],
    youtubeQuery: "해외 렌터카 이용 팁",
    shopCategories: ["connectivity", "power"],
  },
  {
    id: "immigration",
    emoji: "✈️",
    title: "비자·출입국심사",
    summary: "공항 출국 절차와 입국심사 때 자주 묻는 질문",
    gradient: "from-violet-500 to-purple-500",
    points: [
      "국제선은 보통 출발 2~3시간 전 공항 도착을 권장해요. 성수기엔 더 여유 있게!",
      "미국은 ESTA, 일부 국가는 전자여행허가·입국신고서 사전 등록이 필요해요. 출발 전 확인하세요.",
      "입국심사에서는 방문 목적·체류 기간·숙소를 묻는 경우가 많아요. 숙소 예약 내역을 준비하세요.",
      "면세 한도와 반입 금지 품목(육류·과일 등)은 나라마다 달라요.",
    ],
    links: [
      { label: "인천국제공항", url: "https://www.airport.kr" },
      { label: "미국 ESTA (공식)", url: "https://esta.cbp.dhs.gov" },
      { label: "관세청 (여행자 면세)", url: "https://www.customs.go.kr" },
    ],
    videos: [
      owner("9hXScyGSnyU"),
      { id: "mVV2jgS5o3s", title: "인천공항 출국절차 이 영상 하나로 끝! 출국부터 입국까지 완벽 정리", channel: "타이거투어" },
      { id: "vtdo5qixSgs", title: "\"입국심사\" 이것만 알면 무조건 통과! 여행영어 완벽정리", channel: "왕초보 영어학교" },
    ],
    youtubeQuery: "입국심사 여행영어",
    shopCategories: ["connectivity"],
  },
  {
    id: "transport",
    emoji: "🚇",
    title: "현지 교통·교통카드",
    summary: "도착하자마자 헤매지 않게, 교통카드와 대중교통 미리 알기",
    gradient: "from-teal-500 to-emerald-500",
    points: [
      "일본은 Suica·PASMO·ICOCA 같은 IC 교통카드 하나로 전철·버스는 물론 편의점 결제까지 할 수 있어요.",
      "아이폰은 Apple 지갑에 Suica 등 교통카드를 추가해 휴대폰만으로 탈 수 있어요.",
      "많은 대도시는 1일권·여행자 패스가 있어요. 하루 이동이 많다면 미리 비교해 보세요.",
      "Pothos 일정의 '길찾기' 버튼을 누르면 장소 사이 대중교통 경로를 바로 확인할 수 있어요.",
    ],
    links: [
      { label: "Pothos AI 일정 만들기", url: "/planner" },
    ],
    videos: [
      owner("Udgwk6U3vgw"),
      { id: "uYadrISOJjs", title: "일본 교통카드 뭘로 쓸까? 애플페이·삼성페이 모바일 교통카드 비교", channel: "하비루비 일본여행의 모든 것" },
      { id: "VkZKbGvTPyI", title: "해외여행 준비 구글맵 300% 활용 방법", channel: "토모 트래블 : 유럽여행 플래너" },
      { id: "p4zbhTaRxcg", title: "그랩(Grab) 택시 사용법 — 결제 등록부터 요금 꿀팁까지", channel: "그냥리리" },
      { id: "Tj80XwOYjZQ", title: "유럽 기차·티켓 종류 한 번에 정리 (유럽 기차여행 처음이세요?)", channel: "여행플러스 TRIP PLUS" },
      { id: "xNjJWtmL5Ao", title: "대만 이지카드 구매부터 충전·사용까지 총정리", channel: "대만 여행 정보 - 대여정" },
      { id: "XBD2tSJ-VbQ", title: "홍콩 옥토퍼스 카드의 모든 것 — 잔액 확인·충전 꿀팁", channel: "WaniGogo" },
    ],
    youtubeQuery: "해외여행 교통카드",
    shopCategories: ["connectivity"],
  },
  {
    id: "money",
    emoji: "💳",
    title: "환전·트래블카드",
    summary: "현금은 조금, 결제는 수수료 적은 카드로",
    gradient: "from-amber-500 to-orange-500",
    points: [
      "요즘은 환전 수수료가 적은 트래블카드(체크카드)를 많이 써요. 카드사별 혜택을 비교해 보세요.",
      "카드가 안 되는 곳(시장·택시 등)을 위해 현지 현금은 소액 준비하세요.",
      "해외 결제 시 '현지 통화'로 결제해야 이중 환전 수수료(DCC)를 피할 수 있어요.",
      "카드 분실에 대비해 카드는 2장 이상, 따로 보관하세요.",
    ],
    links: [
      { label: "관세청 (휴대 반출입 신고)", url: "https://www.customs.go.kr" },
    ],
    videos: [
      { id: "kE1PS5oVhsM", title: "\"환전이 무료야\" 요즘 해외여행은 체크카드가 대세!", channel: "YTN" },
      { id: "nJVdKSXTkIk", title: "2026 트래블 카드 비교 및 추천 ✈️ 해외여행 환전", channel: "멘토리 mentory" },
    ],
    youtubeQuery: "트래블카드 비교",
  },
  {
    id: "packing",
    emoji: "🧳",
    title: "짐싸기·준비물",
    summary: "기내 반입 규정과 놓치기 쉬운 필수품",
    gradient: "from-pink-500 to-rose-500",
    points: [
      "보조배터리는 위탁 수하물에 넣을 수 없어요. 반드시 기내에 들고 타세요.",
      "기내에 들고 타는 액체류는 용기당 100ml 이하, 1L 투명 지퍼백 1개로 제한돼요.",
      "멀티 어댑터, 상비약, 여권 사본, 여행자 보험 증서를 챙기세요.",
      "Pothos 여행 준비물 페이지에서 필수 아이템을 한 번에 확인할 수 있어요.",
    ],
    links: [
      { label: "Pothos 여행 준비물", url: "/preparations" },
      { label: "인천국제공항 (반입 금지 물품)", url: "https://www.airport.kr" },
    ],
    videos: [
      { id: "XXU60WLLMyE", title: "해외여행 짐싸기✈️ 여행 시 꼭 필요한 필수품들 알려드릴게요!", channel: "타이거투어" },
      { id: "8cbAJe9gHPM", title: "여행의 질을 올려줄 짐 싸는 노하우 / 캐리어만 1000번 싼 전직 승무원", channel: "줌블리에 Jumvelier" },
    ],
    youtubeQuery: "해외여행 짐싸기 꿀팁",
    shopCategories: ["luggage", "comfort", "power", "health"],
  },
];

/**
 * 인기 여행 크리에이터 추천 영상 (유튜브 공개 영상 임베드 — 채널로 바로 연결)
 * oEmbed 로 각 채널의 실제 영상인지 확인한 것만 사용
 */
export const FEATURED_CREATORS: {
  name: string;
  url: string;
  desc: string;
  videos: { id: string; title: string }[];
}[] = [
  {
    name: "빠니보틀 Pani Bottle",
    url: "https://www.youtube.com/@PaniBottle",
    desc: "가성비·날것의 배낭여행",
    videos: [
      { id: "PEEYyRpV1bM", title: "인도에서 10,000원으로 하루 보내기 【유라시아30】" },
      { id: "Buf25jpXMEc", title: "아이슬란드 공짜 온천 찾아다니기 【유라시아114】" },
      { id: "vCYO6HRSJJE", title: "밥까지 나오는 34시간 베트남 종단 기차 탑승기 【베트남5】" },
    ],
  },
  {
    name: "곽튜브",
    url: "https://www.youtube.com/@JBKWAK",
    desc: "현지인과 어울리는 세계여행·먹방",
    videos: [
      { id: "DVvYAZuYgss", title: "미식의 나라 스페인, 드디어 입성 - 세계여행(32)" },
      { id: "Vqjyh_m-5a8", title: "통통맨 듀오의 다낭 식도락 원정기 - 베트남(上)" },
      { id: "e9RvaN6PxmA", title: "한국보다 더 한국 같은 수상한 나라 - 몽골(1)" },
    ],
  },
  {
    name: "원지의하루",
    url: "https://www.youtube.com/@im1G",
    desc: "감성 가득한 도시·자연 여행",
    videos: [
      { id: "j2k_IaCp9sI", title: "예술의 도시 비엔나에서 밥먹고 돌아다니기 ⎪ 오스트리아1" },
      { id: "_HjT5IMOXHo", title: "로컬처럼 먹고 돌아본 대힐링 벤쿠버 ⎥ 캐나다3" },
      { id: "qt2IBGm6EjU", title: "미지의 얼음국 여행 가능..? ⎪ 아이슬란드1" },
    ],
  },
  {
    name: "노홍철",
    url: "https://www.youtube.com/@luckyhongchul",
    desc: "즉흥과 낭만의 유럽·아시아 여행",
    videos: [
      { id: "Tbf9ZEnb6us", title: "노홍철이 포르투갈에서 이민까지 고민한 이유" },
      { id: "p_sndBe7fAY", title: "노홍철이 찾아간 한국인 90%가 모르는 그리스 비밀의 섬" },
      { id: "w0a_r0W1dDI", title: "죽기 전에 꼭 타야 하는 스위스 특급열차 '1등석' 티켓팅 성공한 노홍철" },
    ],
  },
];
