// 샘플 콘텐츠 — 관리자 페이지 '샘플 콘텐츠 채우기' 버튼으로 게시판·스토리를 채움
//
// - 실제 이용자인 척하지 않도록 모두 관리자 계정으로, 제목에 [Pothos 에디터]·[공지] 표기
// - 게시판 글: 같은 제목이 있으면 건너뜀 / 에디터 스토리: 같은 제목이 있으면 최신 내용으로 갱신
// - 스토리 사진: Wikimedia Commons 의 CC0·CC BY(-SA) 사진을 public/stories 에 저장, 출처 표기
// - 유튜브 영상은 실제 존재를 확인한 영상만 사용

export interface SeedPost {
  board: "notice" | "free" | "tip" | "question" | "youtube";
  title: string;
  content: string;
  pinned?: boolean;
}

export interface SeedStory {
  title: string;
  subtitle: string;
  destination: string;
  cover_image_url: string | null;
  intro: string;
  duration_text: string;
  tags: string[];
  sections: StorySection[];
}

/** 스토리 챕터 — 사진 출처·참고 영상·참고 링크는 선택 */
export interface StorySection {
  title: string;
  image_url: string;
  content: string;
  /** 사진 출처 표기 (예: "Martin Falbisoner · CC BY-SA 4.0 · Wikimedia Commons") */
  image_credit?: string;
  image_credit_url?: string;
  /** 참고 유튜브 영상 */
  videos?: { url: string; title: string }[];
  /** 참고 링크 */
  links?: { label: string; url: string }[];
}

export const YOUTUBE_BOARD = {
  slug: "youtube",
  name: "여행 유튜브",
  description: "내 여행 영상·채널과 도움 되는 여행 정보 영상을 공유해요",
  icon: "📺",
  display_order: 4,
};

export const SEED_POSTS: SeedPost[] = [
  // ── 공지사항 ──────────────────────────────
  {
    board: "notice",
    pinned: true,
    title: "[공지] Pothos에 오신 것을 환영해요 ✈️",
    content: `안녕하세요, Pothos 운영팀입니다.

Pothos는 가고 싶은 곳만 알려주시면 AI가 동선·맛집·숙소까지 한 번에 짜드리는 여행 플랫폼이에요.

▶ 이렇게 이용해 보세요
· AI 플래너 — 목적지·기간·예산만 넣으면 지도와 함께 일정이 완성돼요
· 축제 — 전국 축제·행사와 세계 대표 축제를 찾고, 축제 날짜에 맞춘 일정을 만들 수 있어요
· 여행 준비 — 여권·국제운전면허·해외 안전·렌터카·환전까지 공식 정보와 추천 영상을 모았어요
· 커뮤니티 — 여행 이야기, 꿀팁, 질문, 내 유튜브 영상을 자유롭게 나눠 주세요

여러분의 여행 이야기를 기다릴게요. 감사합니다!`,
  },
  {
    board: "notice",
    title: "[공지] 커뮤니티 이용 안내",
    content: `모두가 즐거운 공간이 되도록 아래 내용을 지켜 주세요.

1. 서로 존중하는 표현을 사용해 주세요.
2. 광고·홍보 목적의 글, 반복 게시는 삭제될 수 있어요.
   (여행 유튜브 게시판에서 내 여행 영상·채널 소개는 환영해요!)
3. 개인정보(연락처·여권번호 등)는 올리지 마세요.
4. 다른 사람의 사진·영상은 출처를 밝혀 주세요.

문의는 언제든 운영팀에게 남겨 주세요.`,
  },

  // ── 자유게시판 ────────────────────────────
  {
    board: "free",
    title: "[Pothos 에디터] 이번 가을, 어디로 떠나세요? 🍁",
    content: `선선한 바람이 부는 계절이에요.

에디터는 이번 가을 교토 단풍을 보러 가려고 일정을 짜는 중이에요. 아침 일찍 사찰부터 돌면 사람이 훨씬 적더라고요.

여러분은 이번 가을 어디로 떠나시나요? 국내든 해외든, 가고 싶은 곳이나 추천하고 싶은 곳을 댓글로 남겨 주세요!`,
  },
  {
    board: "free",
    title: "[Pothos 에디터] 여행 갈 때 꼭 챙기는 나만의 아이템은?",
    content: `에디터의 여행 필수템 3가지예요.

1. 멀티 어댑터 — 나라마다 콘센트가 달라서 하나면 마음이 편해요
2. 접이식 장바구니 — 시장 구경, 기념품 쇼핑할 때 의외로 정말 유용해요
3. 지퍼백 여러 장 — 젖은 옷, 액체류, 영수증 정리까지 만능!

여러분만의 필수템도 공유해 주세요 🙌`,
  },

  // ── 여행 팁 ──────────────────────────────
  {
    board: "tip",
    title: "[Pothos 에디터] 해외에서 카드 결제할 때 '현지 통화'를 고르세요",
    content: `해외 가게에서 카드로 결제할 때 "원화(KRW)로 결제할까요?"라고 묻는 경우가 있어요.

이때 원화로 결제하면 '해외 원화결제(DCC)' 수수료가 붙어서 더 비싸게 결제될 수 있어요.

✅ 팁
· 결제 단말기·영수증에서 통화 선택이 나오면 꼭 '현지 통화'를 고르세요
· 카드사 앱에서 '해외 원화결제 차단'을 미리 설정해 두면 실수를 막을 수 있어요`,
  },
  {
    board: "tip",
    title: "[Pothos 에디터] 보조배터리·액체류 기내 반입, 이것만 기억하세요",
    content: `공항 보안검색에서 가장 많이 걸리는 두 가지예요.

🔋 보조배터리
· 위탁 수하물(부치는 짐)에는 넣을 수 없어요. 반드시 기내에 들고 타세요
· 용량이 큰 배터리는 반입 제한이 있으니 항공사 규정을 확인하세요

💧 액체류 (국제선 기내)
· 용기 하나당 100ml 이하
· 1L 투명 지퍼백 1개에 담아야 해요
· 면세점에서 산 액체류는 받은 봉투 그대로, 영수증과 함께 보관하세요`,
  },
  {
    board: "tip",
    title: "[Pothos 에디터] 제주 렌터카 여행, 동선은 동·서로 나눠서 짜세요",
    content: `제주는 생각보다 넓어서 하루에 섬을 한 바퀴 돌려고 하면 운전만 하다 끝나요.

✅ 동선 팁
· 하루는 동쪽(성산·우도·섭지코지), 하루는 서쪽(협재·한림·오설록)처럼 나눠 보세요
· 숙소를 중간에 한 번 옮기면 이동 시간이 확 줄어요
· 일출 명소는 동쪽, 일몰 명소는 서쪽이에요

Pothos AI 플래너에 "제주도 2박 3일"을 넣으면 지도와 함께 동선을 짜드려요!`,
  },

  // ── 질문답변 ────────────────────────────
  {
    board: "question",
    title: "[자주 묻는 질문] 국제운전면허증은 어디서 발급받나요?",
    content: `Q. 해외에서 렌터카를 빌리려고 해요. 국제운전면허증은 어디서 받나요?

A. 전국 운전면허시험장, 일부 경찰서, 인천공항 등에서 신청할 수 있고, 온라인 신청도 가능해요.
· 발급일부터 1년간 유효해요
· 해외에서 운전할 때는 국내 운전면허증도 함께 챙기세요
· 나라마다 인정하는 면허 형식이 달라요. 방문할 나라를 미리 확인하세요

자세한 준비물과 수수료는 도로교통공단 안전운전 통합민원(safedriving.or.kr)에서 확인할 수 있어요.
Pothos '여행 준비' 메뉴에도 정리해 두었어요.`,
  },
  {
    board: "question",
    title: "[자주 묻는 질문] 여권 유효기간이 6개월도 안 남았는데 괜찮을까요?",
    content: `Q. 다음 달 해외여행인데 여권 유효기간이 5개월 남았어요.

A. 많은 나라가 입국 시 여권 유효기간이 6개월 이상 남아 있기를 요구해요. 기간이 부족하면 탑승이나 입국이 거절될 수 있어요.
· 방문할 나라의 입국 요건을 외교부 해외안전여행(0404.go.kr)에서 확인하세요
· 재발급은 정부24에서 온라인 신청도 할 수 있어요

여행 일정이 가깝다면 서둘러 재발급을 신청하는 게 안전해요!`,
  },

  // ── 여행 유튜브 ──────────────────────────
  {
    board: "youtube",
    title: "[추천 영상] 해외여행 중 위기상황 대처법 3가지 — 외교부",
    content: `https://www.youtube.com/watch?v=dTk5Ligx1pc

외교부 공식 채널 영상이에요. 해외에서 사건·사고가 생겼을 때 어떻게 해야 하는지 짧게 정리되어 있어요. 출국 전에 한 번 보고 가세요!`,
  },
  {
    board: "youtube",
    title: "[추천 영상] 해외에서 처음 렌트카 빌린다면 꼭 보세요",
    content: `https://www.youtube.com/watch?v=rmrk7H7sPUI

예약 사이트 고르는 법부터 신호 보기, 운전하는 법까지 처음 해외 렌터카를 빌리는 분께 도움이 되는 영상이에요. (채널: 오늘뭐할까 Onul)`,
  },
  {
    board: "youtube",
    title: "[추천 영상] 전직 승무원의 짐 싸는 노하우",
    content: `https://www.youtube.com/watch?v=8cbAJe9gHPM

캐리어를 1000번 싸 본 전직 승무원의 짐 싸기 노하우예요. 공간 활용 팁이 정말 유용해요. (채널: 줌블리에 Jumvelier)`,
  },
  {
    board: "youtube",
    title: "[추천 영상] 요즘 해외여행은 트래블 체크카드가 대세",
    content: `https://www.youtube.com/watch?v=kE1PS5oVhsM

환전 수수료를 아끼는 트래블카드에 대한 YTN 뉴스 영상이에요. 카드별 혜택은 수시로 바뀌니 출발 전에 비교해 보세요.`,
  },
];

const YT = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const COMMONS = "Wikimedia Commons";

export const SEED_STORIES: SeedStory[] = [
  // ── 노르웨이 트롬쇠 ──────────────────────────
  {
    title: "[Pothos 에디터] 오로라를 만나러, 노르웨이 트롬쇠 4박 5일",
    subtitle: "밤하늘이 초록빛으로 일렁이던 북극권 여행",
    destination: "트롬쇠",
    cover_image_url: "/hero/aurora-poster.jpg",
    intro:
      "오로라는 운이 따라야 볼 수 있다지만, 준비를 잘하면 확률을 크게 높일 수 있어요. 북극권 도시 트롬쇠에서 4박 5일 동안 '밤은 오로라, 낮은 피오르'로 보내는 일정을 정리했어요. 언제 가야 하는지, 투어는 어떻게 고르는지, 사진은 어떻게 찍는지까지 처음 가는 분 눈높이로 담았어요.",
    duration_text: "4박 5일",
    tags: ["오로라", "노르웨이", "트롬쇠", "겨울여행", "북유럽"],
    sections: [
      {
        title: "언제 가야 할까?",
        image_url: "/stories/tromso-aurora.jpg",
        image_credit: `Andi Gentsch · CC BY-SA 2.0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Aurora_Borealis_Troms%C3%B8_Norway.jpg",
        content: `트롬쇠의 오로라 시즌은 보통 9월 말부터 3월 말까지예요. 밤이 충분히 어두워야 보이기 때문에 해가 길게 지지 않는 여름에는 볼 수 없어요.

• 9~10월: 아직 눈이 적고 덜 추워요. 호수·피오르에 비친 오로라를 담기 좋아요.
• 11월 말~1월 중순: 해가 거의 뜨지 않는 '극야' 기간. 어두운 시간이 길어 기회가 많지만 무척 추워요.
• 2~3월: 낮이 다시 길어져 낮 활동(개썰매·피오르)과 밤 오로라를 함께 즐기기 좋아요.

가장 중요한 건 '구름'이에요. 오로라 활동이 강해도 구름이 덮이면 볼 수 없어요. 그래서 최소 3박 이상, 여러 밤에 도전할 수 있게 일정을 잡는 게 핵심이에요.`,
      },
      {
        title: "4박 5일 일정 흐름",
        image_url: "/stories/tromso-city.jpg",
        image_credit: `JoachimKohlerBremen · CC BY-SA 4.0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Troms%C3%B8_vom_Fjellheisen_aus_gesehen.jpg",
        content: `한국에서 트롬쇠는 직항이 없어 보통 유럽 도시(오슬로·헬싱키 등)를 거쳐 들어가요. 도착일은 쉬고, 오로라는 둘째 날부터 노리는 게 좋아요.

Day 1 · 도착 — 시내 산책, 항구 주변 저녁 식사. 시차 적응 겸 일찍 쉬기.
Day 2 · 낮: 케이블카(피엘헤이센)로 전망대에 올라 시내와 피오르 내려다보기 / 밤: 첫 오로라 투어.
Day 3 · 낮: 개썰매 또는 순록 체험 / 밤: 두 번째 오로라 도전 (첫날 실패했다면 다른 투어사도 고려).
Day 4 · 낮: 북극 대성당, 폴라리아(북극 수족관) / 밤: 날씨가 맑으면 셀프 관측 또는 세 번째 투어.
Day 5 · 출국 — 오전 시내 기념품 쇼핑 후 공항으로.

위 사진이 바로 케이블카 전망대에서 본 트롬쇠 시내예요. 맑은 밤에는 이곳에서 오로라가 보이기도 해요.`,
      },
      {
        title: "오로라 투어 vs 직접 관측",
        image_url: "",
        content: `시내는 불빛이 많아 오로라가 흐리게 보여요. 그래서 대부분 '오로라 헌팅 투어'를 이용해요. 가이드가 그날의 구름·오로라 예보를 보고 맑은 곳을 찾아 수십~수백 km를 이동해요. 때로는 스웨덴·핀란드 국경 근처까지 가기도 해요.

투어 고르는 팁
• 소규모(미니버스) 투어: 이동이 빠르고 가이드가 사진을 찍어 주는 경우가 많아요.
• 대형 버스 투어: 가격이 저렴한 편이지만 이동 범위가 좁을 수 있어요.
• 방한복·장화 대여, 따뜻한 음료, 사진 촬영 포함 여부를 꼭 확인하세요.
• 못 봤을 때 할인·재참가 조건이 있는지도 보세요.

직접 관측한다면 렌터카로 시내 불빛을 벗어나야 해요. 겨울 북극권 빙판길 운전은 쉽지 않으니 경험이 없다면 투어를 추천해요.`,
        videos: [{ url: YT("Yz6e1P8AsW0"), title: "트롬쇠 오로라 여행 총정리 (찌온에어 JJIONAIRE)" }],
      },
      {
        title: "낮에는 피오르와 북극 대성당",
        image_url: "/stories/tromso-cathedral.jpg",
        image_credit: `Virtual-Pano · CC BY-SA 4.0 · ${COMMONS}`,
        image_credit_url:
          "https://commons.wikimedia.org/wiki/File:0510_Nordlys_passing_Tromsdalen_church_-_Tromso,_Norway_-_V-P.jpg",
        content: `오로라 여행이라고 낮을 버리면 아까워요. 트롬쇠의 낮은 짧지만 풍경이 정말 아름다워요.

• 북극 대성당: 다리 건너편에 있는 삼각형 모양의 하얀 교회. 사진처럼 바다 건너에서 바라보는 모습이 특히 멋져요.
• 개썰매·순록 썰매: 북극권에서만 할 수 있는 체험이라 만족도가 높아요. 인기 시간대는 빨리 마감돼요.
• 피오르 크루즈·고래 투어: 시기에 따라 고래를 볼 수 있는 투어도 있어요.
• 폴라리아: 북극 바다를 소개하는 수족관. 날씨가 나쁜 날 실내 일정으로 좋아요.`,
      },
      {
        title: "사진은 이렇게",
        image_url: "",
        content: `오로라 사진의 핵심은 '흔들리지 않게, 오래 노출'이에요.

• 카메라: 삼각대 + 수동 모드. 시작값은 조리개 최대 개방(f/2.8 전후), ISO 1600~3200, 셔터 5~15초. 오로라가 빠르게 움직이면 셔터를 짧게 줄여요.
• 초점: 수동 초점으로 무한대(먼 불빛이나 밝은 별에 맞추기).
• 스마트폰: 야간 모드 + 작은 삼각대(또는 바위에 기대기). 요즘 폰으로도 꽤 멋지게 나와요.
• 배터리: 추위에 금방 닳아요. 여분 배터리를 안주머니에 넣어 따뜻하게 보관하세요.
• 손: 터치 되는 얇은 장갑 위에 두꺼운 벙어리장갑을 겹쳐 끼면 편해요.`,
        videos: [{ url: YT("c6zH5-k92TU"), title: "트롬쇠 오로라 4K 타임랩스 (여행 사진 작가 유승훈)" }],
      },
      {
        title: "방한 준비물 체크리스트",
        image_url: "",
        content: `밤 투어는 영하의 날씨에 몇 시간씩 밖에 서 있어야 해요. '겹쳐 입기'가 기본이에요.

• 상의: 발열 내의 → 플리스(또는 경량 패딩) → 방풍·방수 겉옷
• 하의: 발열 내의 + 방수 바지 (투어사 방한복 대여도 많아요)
• 발: 두꺼운 울 양말 + 미끄럼 방지 방한 부츠, 신발용 아이젠
• 그 외: 비니, 넥워머, 핫팩, 보온병, 헤드랜턴(빨간 불 모드가 있으면 좋아요)`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content:
          "출발 전에 영상으로 분위기를 먼저 보고, 출발 당일에는 날씨·오로라 예보를 꼭 확인하세요. 해외 안전 정보는 외교부 해외안전여행 사이트에서 확인할 수 있어요.",
        videos: [{ url: YT("c7ol9s3NX88"), title: "북극의 수도 '트롬쇠' [걸어서 세계속으로] (KBS)" }],
        links: [
          { label: "Visit Tromsø — 트롬쇠 공식 관광 안내", url: "https://www.visittromso.no/" },
          { label: "Visit Norway — 노르웨이 공식 관광 안내", url: "https://www.visitnorway.com/" },
          { label: "yr.no — 노르웨이 기상청 날씨·구름 예보", url: "https://www.yr.no/en" },
          { label: "NOAA — 오로라 30분 예보 (영문)", url: "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast" },
          { label: "Fjellheisen — 트롬쇠 케이블카", url: "https://fjellheisen.no/" },
          { label: "외교부 해외안전여행", url: "https://www.0404.go.kr/" },
        ],
      },
    ],
  },

  // ── 제주 동쪽 ──────────────────────────
  {
    title: "[Pothos 에디터] 가을 제주 동쪽 2박 3일 힐링 코스",
    subtitle: "성산 일출부터 우도의 바다까지, 천천히 걷는 제주",
    destination: "제주도",
    cover_image_url: "/stories/jeju-seongsan-view.jpg",
    intro:
      "제주 동쪽은 일출 명소와 에메랄드빛 바다, 억새 오름이 모여 있어 2박 3일 힐링 여행에 딱이에요. 운전 시간을 줄이려 숙소를 성산·구좌 쪽에 잡고 동쪽만 집중해서 다니는 코스로 정리했어요. (표지 사진: 성산일출봉에서 내려다본 성산 마을)",
    duration_text: "2박 3일",
    tags: ["제주", "국내여행", "힐링", "가을여행", "우도"],
    sections: [
      {
        title: "코스 한눈에 보기",
        image_url: "",
        content: `Day 1 · 제주공항 → 함덕해수욕장 → 서우봉 산책 → 김녕·월정리 해안도로 → 숙소(성산·구좌)
Day 2 · 성산일출봉 → 성산항에서 배 타고 우도 → 전기자전거로 우도 한 바퀴 → 저녁 성산
Day 3 · 섭지코지 → 광치기해변 → (가을이면) 다랑쉬오름 억새 → 공항

동선 팁
• 제주공항에서 성산까지는 차로 1시간 남짓 걸려요. 숙소는 동쪽에 잡아야 이동이 편해요.
• 동쪽은 버스 배차가 길어 렌터카가 편해요. 운전이 부담되면 택시 투어도 방법이에요.
• 가을 제주는 바람이 강하고 일교차가 커요. 얇은 겉옷과 바람막이를 꼭 챙기세요.`,
      },
      {
        title: "Day 1 · 함덕 바다와 서우봉",
        image_url: "/stories/jeju-hamdeok.jpg",
        image_credit: `Hong Da Hyeon · CC0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Hamdeok_Beach.jpg",
        content: `공항에서 30분 정도면 닿는 함덕해수욕장은 첫날 일정으로 딱이에요. 얕고 맑은 바다색이 정말 예뻐요.

• 해변 옆 서우봉은 20~30분이면 오를 수 있는 낮은 오름이에요. 위에서 보는 함덕 바다가 이 코스의 하이라이트예요.
• 오후엔 김녕·월정리 해안도로를 따라 달리며 바다 앞 카페에서 쉬어 가세요.
• 저녁은 숙소 근처에서 고기국수나 흑돼지로 가볍게!`,
      },
      {
        title: "Day 2 · 성산일출봉에서 하루 시작",
        image_url: "/stories/jeju-seongsan.jpg",
        image_credit: `Bernard Gagnon · CC0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Seongsan_Ilchulbong_01.jpg",
        content: `성산일출봉은 유네스코 세계자연유산으로 등재된 제주의 대표 명소예요. 정상까지 계단으로 20~30분 정도 걸려요.

• 일출을 보고 싶다면 계절별 운영 시간과 일출 시각을 전날 꼭 확인하세요.
• 사람이 몰리기 전인 이른 아침에 오르면 훨씬 여유로워요.
• 계단이 많으니 편한 운동화는 필수예요.`,
      },
      {
        title: "Day 2 · 배 타고 우도 한 바퀴",
        image_url: "",
        content: `성산항에서 배를 타면 약 15분 만에 우도에 도착해요. 배 시간은 날씨와 계절에 따라 바뀌니 현장·공식 안내를 확인하세요.

• 우도는 렌터카 반입이 제한돼요. 섬 안에서 전기자전거·스쿠터·전동카를 빌려 한 바퀴 도는 게 일반적이에요.
• 들러 볼 곳: 하얀 모래의 해변, 검멀레 해변, 우도봉.
• 땅콩 아이스크림은 우도에서 꼭 먹어 봐야 할 간식이에요!
• 바람이 강하거나 파도가 높으면 배가 결항될 수 있어요. 마지막 배 시간을 꼭 체크하세요.`,
        videos: [{ url: YT("FH-98g596DU"), title: "전기자전거로 우도 한 바퀴 (때로는)" }],
      },
      {
        title: "Day 3 · 섭지코지와 가을 억새",
        image_url: "/stories/jeju-seopjikoji.jpg",
        image_credit: `Engin Cukuroglu · CC BY-SA 4.0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Jeju_Island_Seopjikoji.jpg",
        content: `마지막 날은 섭지코지 해안 산책로를 천천히 걸으며 여행을 마무리했어요. 언덕 위 등대까지 걸으면 바다 건너 성산일출봉이 한눈에 보여요.

• 가까운 광치기해변은 썰물 때 드러나는 이끼 낀 바위가 독특한 풍경을 만들어요.
• 10~11월이라면 다랑쉬오름 같은 동쪽 오름의 억새도 놓치지 마세요. 오후 햇살에 억새가 반짝일 때가 가장 예뻐요.
• 공항까지 1시간 이상 걸리니 비행기 시간을 넉넉히 계산하세요.`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content:
          "다른 여행자의 동쪽 코스 영상도 함께 보면 일정 짜는 데 도움이 돼요. 출발 전 날씨(특히 바람)와 배편 운항 여부를 꼭 확인하세요.",
        videos: [
          { url: YT("it_klRhpz4g"), title: "제주도 가을 동쪽 코스 (윤 제주삶 Yoon Jeju Life)" },
          { url: YT("TKTohgRzfZY"), title: "제주 동쪽 1박 2일·2박 3일 코스 (살란다)" },
        ],
        links: [
          { label: "비짓제주 — 제주 공식 관광 정보", url: "https://www.visitjeju.net/kr" },
          { label: "기상청 날씨누리 — 제주 날씨·바람", url: "https://www.weather.go.kr/w/index.do" },
          { label: "표지 사진 출처 — Bernard Gagnon · CC0 · Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Seongsan,_Jeju_Island.jpg" },
        ],
      },
    ],
  },

  // ── 교토 단풍 ──────────────────────────
  {
    title: "[Pothos 에디터] 교토 단풍 3박 4일, 이른 아침이 답이었다",
    subtitle: "붉게 물든 사찰을 조용히 즐기는 방법",
    destination: "교토",
    cover_image_url: "/stories/kyoto-kiyomizu.jpg",
    intro:
      "가을 교토는 아름다운 만큼 사람도 많아요. 유명 사찰은 문 여는 시간에 맞춰 가는 것만으로도 여행의 질이 완전히 달라졌어요. 동쪽(히가시야마)·서쪽(아라시야마)·남쪽(도후쿠지·후시미)으로 하루씩 나눠 이동을 줄인 3박 4일 코스예요. (표지 사진: 단풍에 둘러싸인 기요미즈데라)",
    duration_text: "3박 4일",
    tags: ["교토", "일본", "단풍", "가을여행", "간사이"],
    sections: [
      {
        title: "언제 가면 좋을까?",
        image_url: "",
        content: `교토 단풍은 보통 11월 중순부터 12월 초 사이에 절정이에요. 해마다 기온에 따라 1~2주씩 달라지니 출발 2~3주 전에 단풍 예보를 확인하세요.

• 절정 주말은 숙소 값이 오르고 빨리 마감돼요. 가능하면 평일을 끼워 잡으세요.
• 사찰 입장료는 대략 500~1,000엔대예요. 야간 라이트업은 별도 요금인 곳이 많아요.
• 관광지 운영 시간·요금은 시즌마다 바뀌니 공식 사이트를 꼭 확인하세요.`,
        links: [{ label: "tenki.jp 단풍 예보 (일본어)", url: "https://tenki.jp/kouyou/" }],
      },
      {
        title: "Day 1 · 도착, 그리고 기요미즈데라 야간 라이트업",
        image_url: "/stories/kyoto-night.jpg",
        image_credit: `lumoplank · CC0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Kiyomizu-dera_autumn_night.jpg",
        content: `간사이공항에 도착하면 특급열차(하루카)로 교토역까지 한 번에 갈 수 있어요. 첫날은 숙소에 짐을 풀고 기온 거리를 가볍게 걸어요.

저녁에는 단풍철에만 열리는 기요미즈데라 야간 특별 관람을 추천해요. 조명을 받은 단풍과 본당, 멀리 보이는 교토 시내 야경이 정말 압도적이에요.
• 니넨자카·산넨자카 골목은 밤에 걸어도 분위기가 좋아요.
• 라이트업은 매우 붐벼요. 입장 시작 시간에 맞춰 가면 한결 나아요.`,
        videos: [{ url: YT("l1lKf_tW0J0"), title: "기요미즈데라 야간 라이트업·가는 법 정리 (책쓰는 미식가)" }],
        links: [{ label: "기요미즈데라 공식 사이트", url: "https://www.kiyomizudera.or.jp/" }],
      },
      {
        title: "Day 2 · 에이칸도와 철학의 길 — 아침 일찍!",
        image_url: "/stories/kyoto-eikando.jpg",
        image_credit: `lumoplank · CC0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Eikando,_Kyoto_-_Eikando7353.jpg",
        content: `'단풍의 에이칸도'라고 불릴 만큼 단풍이 유명한 곳이에요. 인기 사찰은 개문 직후가 가장 한산해요. 오전 9시 전후 도착을 목표로 움직였어요.

추천 흐름
에이칸도 → 철학의 길(물길 따라 걷는 산책로) → 난젠지(수로각) → 점심 → 오후는 카페·골목 산책

• 오후에는 유명 사찰마다 줄이 길어져요. 붐비는 시간엔 쉬어 가는 게 오히려 이득이에요.
• 철학의 길은 끝에서 끝까지 걸어도 30~40분 정도라 부담 없어요.`,
        links: [{ label: "에이칸도(영관당) 공식 사이트", url: "https://www.eikando.or.jp/" }],
      },
      {
        title: "Day 3 · 아라시야마, 대나무숲은 8시 전에",
        image_url: "/stories/kyoto-arashiyama.jpg",
        image_credit: `lumoplank · CC0 · ${COMMONS}`,
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Arashiyama,_Part_I_-_Arashiyama7551.jpg",
        content: `교토 서쪽 아라시야마는 하루를 통째로 쓸 만해요. 대나무숲(치쿠린)은 낮에는 걷기 힘들 만큼 붐비니 아침 일찍 가는 게 핵심이에요.

추천 흐름
대나무숲(이른 아침) → 덴류지 정원 → 도게츠교 주변 산책 → 사가노 쪽 작은 사찰들 → 오후에 시내로 복귀

• 교토역에서 JR 사가노선을 타면 버스보다 빠르고 편해요.
• 강변 카페에 앉아 단풍 든 산을 바라보는 시간도 꼭 넣어 보세요.`,
      },
      {
        title: "Day 4 · 도후쿠지와 후시미 이나리, 그리고 귀국",
        image_url: "",
        content: `마지막 날은 교토역 남쪽으로 가서 공항 이동까지 편하게 마무리해요.

• 도후쿠지: 계곡을 가득 메운 단풍을 다리(쓰텐쿄) 위에서 내려다보는 풍경이 유명해요. 단풍철엔 매우 붐비니 개문 시간에 맞춰 가세요. 시기에 따라 다리 위 촬영이 제한되기도 해요.
• 후시미 이나리 신사: 끝없이 이어지는 붉은 도리이 길. 산 위까지 다 오르지 않고 중간 전망 지점까지만 다녀와도 충분해요.
• 두 곳 모두 교토역에서 가까워 짐은 역 코인로커에 맡기고 다니면 편해요.`,
      },
      {
        title: "교통·예산 팁",
        image_url: "",
        content: `단풍철 교토 버스는 정말 붐벼요. 가까운 곳은 걷고, 먼 곳은 지하철·전철 위주로 다니면 시간을 많이 아낄 수 있어요.

• 교통카드(ICOCA 등)를 쓰면 매번 표를 살 필요가 없어 편해요. 일본 교통카드 종류와 사용법은 아래 영상에 정리되어 있어요.
• 하루 일정을 '동쪽·서쪽·남쪽'처럼 지역별로 묶으면 이동 시간이 확 줄어요.
• 저녁엔 가모가와 강변을 따라 걸으며 하루를 정리해 보세요. 낮과는 또 다른 교토를 느낄 수 있어요.`,
        videos: [{ url: YT("Udgwk6U3vgw"), title: "일본 여행 교통카드 SUICA·PASMO·ICOCA (지금이 여행의 기회 - Chance Trip)" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "교토의 다른 단풍 명소와 코스는 아래 영상과 공식 관광 안내에서 더 볼 수 있어요.",
        videos: [{ url: YT("dqDrSuKI5RA"), title: "교토 10대 단풍 명소와 여행 코스 (여니버스 Yeoniverse)" }],
        links: [
          { label: "교토시 공식 관광 안내 (한국어)", url: "https://kyoto.travel/ko/" },
          { label: "tenki.jp 단풍 예보 (일본어)", url: "https://tenki.jp/kouyou/" },
          { label: "외교부 해외안전여행", url: "https://www.0404.go.kr/" },
          {
            label: "표지 사진 출처 — Martin Falbisoner · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Kiyomizu-dera,_Kyoto,_November_2016_-01.jpg",
          },
        ],
      },
    ],
  },
];
