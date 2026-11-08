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

  // ── 오사카 ──────────────────────────
  {
    title: "[Pothos 에디터] 첫 오사카 2박 3일, 먹고 걷기만 해도 꽉 찬 코스",
    subtitle: "도톤보리 네온부터 오사카성, 신세카이까지",
    destination: "오사카",
    cover_image_url: "/stories/osaka-1.jpg",
    intro:
      "오사카는 '먹다가 망한다(구이다오레)'는 말이 있을 만큼 먹거리의 도시예요. 비행시간이 짧고 공항에서 시내까지 가까워 2박 3일 첫 일본 여행지로 딱이에요. 미나미(난바)를 거점으로 동선을 짧게 묶은 코스를 정리했어요.",
    duration_text: "2박 3일",
    tags: ["오사카", "일본", "먹방여행", "첫해외여행"],
    sections: [
      {
        title: "공항에서 난바까지, 숙소는 미나미에",
        image_url: "/stories/osaka-2.jpg",
        image_credit: "blieusong · CC BY-SA 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:D%C5%8Dtonbori_canal_at_sunset,_in_Osaka;_October_2018.jpg",
        content: `간사이공항에서 난바까지는 난카이 전철 특급 '라피트'로 약 38분, 공항급행으로 약 44분 걸려요(난카이 안내 기준, 시간은 대략).

숙소는 난바·신사이바시 쪽(미나미)을 추천해요.
• 도톤보리, 구로몬 시장, 신세카이까지 걸어서 또는 지하철 몇 정거장
• 밤늦게까지 먹고 걸어서 숙소로 돌아오기 좋아요
• 교통카드(ICOCA 등)를 하나 만들면 전철·편의점 결제가 편해요`,
        links: [{ label: "난카이 전철 간사이공항역 교통 안내", url: "https://www.nankai.co.jp/en_railway/traffic/kix.html" }],
      },
      {
        title: "Day 1 · 도톤보리의 밤",
        image_url: "",
        content: `첫날 저녁은 무조건 도톤보리예요. 에비스바시 다리 위 글리코 간판 앞 사진은 오사카 여행 인증샷이에요(표지 사진).

먹어 볼 것
• 타코야키: 겉은 바삭, 속은 촉촉. 가게마다 맛이 달라 두세 군데 비교해 보는 재미
• 오코노미야키·쿠시카츠: 오사카 대표 서민 음식
• 늦은 밤엔 라멘 한 그릇

💡 소스가 뜨거우니 타코야키는 반으로 갈라서 식혀 드세요.`,
      },
      {
        title: "Day 2 · 오사카성과 신세카이",
        image_url: "/stories/osaka-3.jpg",
        image_credit: "663highland · CC BY 2.5 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Osaka_Castle_02bs3200.jpg",
        content: `오전엔 오사카성 공원을 걸어요. 넓은 해자와 돌담, 천수각이 어우러진 풍경이 멋져요. 천수각 안은 박물관이라 관람 시간·요금은 공식 사이트에서 확인하세요.

오후엔 레트로 분위기의 신세카이로 이동해요. 츠텐카쿠 타워 아래 골목에 쿠시카츠 가게가 모여 있어요.
• 쿠시카츠 소스는 '두 번 찍기 금지'가 이 동네 규칙이에요
• 저녁엔 다시 난바로 돌아와 쇼핑·야식`,
        links: [{ label: "오사카성 천수각 공식", url: "https://www.osakacastle.net/" }],
      },
      {
        title: "Day 3 · 구로몬 시장 아침, 그리고 귀국",
        image_url: "/stories/osaka-4.jpg",
        image_credit: "Dick Thomas Johnson · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Shinsekai_Tsutenkaku_at_night_2022-04-23.jpg",
        content: `마지막 날 아침은 '오사카의 부엌' 구로몬 시장에서 해산물 꼬치나 과일로 가볍게 먹어요. 난바역에서 걸어갈 수 있어서 공항 가기 전에 들르기 좋아요.

• 시장은 오전이 활기차고, 오후엔 일찍 문 닫는 가게도 있어요
• 기념품은 공항보다 시내 드럭스토어·돈키호테가 선택지가 많아요
(사진은 Day 2에 들른 신세카이 츠텐카쿠 거리)`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "출발 전에 영상으로 동선과 맛집 분위기를 미리 보면 좋아요. 운영 시간과 요금은 계절마다 바뀌니 공식 안내를 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=DK0XrbsnXUo", title: "오사카 맛집·카페·코스 총정리 (또 떠나는 남자 ddoddunam)" },
          { url: "https://www.youtube.com/watch?v=B8ywoLREVIE", title: "찐 일본 덕후의 오사카 여행 가이드 (산보노트 sanbonote)" },
        ],
        links: [
          { label: "오사카 관광국 공식 (한국어)", url: "https://osaka-info.jp/ko/" },
          {
            label: "표지 사진 출처 — そらみみ · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Glico_Man_Neon_Sign_and_Ebisubashi_Bridge_at_night.jpg",
          },
        ],
      },
    ],
  },

  // ── 타이베이 ──────────────────────────
  {
    title: "[Pothos 에디터] 타이베이 3박 4일, 야시장과 근교 소도시까지",
    subtitle: "타이베이 101 야경, 지우펀 홍등, 스펀 천등",
    destination: "타이베이",
    cover_image_url: "/stories/taipei-1.jpg",
    intro:
      "타이베이는 시내 여행과 근교 소도시 여행을 함께 할 수 있는 도시예요. 낮엔 MRT로 편하게 다니고, 밤엔 야시장에서 저렴하게 배를 채우는 3박 4일 코스를 정리했어요.",
    duration_text: "3박 4일",
    tags: ["타이베이", "대만", "야시장", "근교여행"],
    sections: [
      {
        title: "도착 · 공항철도와 이지카드",
        image_url: "",
        content: `타오위안공항에서 타이베이역까지는 공항 MRT 직통열차로 제1터미널에서 약 35분, 제2터미널에서 약 39분 걸려요.

도착하면 이지카드(悠遊卡)부터 만들어요.
• MRT·버스·기차·택시는 물론 편의점·마트 결제까지 돼요
• 잔액이 남으면 편의점 간식 사는 데 쓰면 끝`,
        links: [
          { label: "타오위안 공항 MRT 안내", url: "https://travel.tycg.gov.tw/en/traffic/airportmrt" },
          { label: "이지카드 공식 사용 범위", url: "https://www.easycard.com.tw/en/use-range" },
        ],
      },
      {
        title: "Day 1 · 타이베이 101과 야시장",
        image_url: "/stories/taipei-3.jpg",
        image_credit: "Ji Soo Song · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Raohe_Night_Market_2022.jpg",
        content: `해 질 무렵 타이베이 101 근처로 가서 도시 야경을 봐요(표지 사진). 전망대 대신 근처 샹산(코끼리산) 트레일에 오르면 101이 정면으로 보여요.

저녁은 야시장으로!
• 라오허 야시장: 한 줄로 길게 이어져 둘러보기 쉬워요 (사진)
• 스린 야시장: 가장 크고 유명해요
• 후추빵, 지파이(닭튀김), 망고빙수는 꼭`,
      },
      {
        title: "Day 2 · 근교 투어 — 예류·스펀·지우펀",
        image_url: "/stories/taipei-4.jpg",
        image_credit: "xiquinhosilva · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:TRA_DRC1029_and_Pingxi_Sky_Lanterns_at_Shifen_Old_Street_20171028.jpg",
        content: `근교 세 곳을 하루에 도는 '예스진지' 코스는 이동이 많아 단체 투어나 택시 투어를 많이 이용해요.

• 예류: 바닷바람이 깎은 기묘한 바위 공원
• 스펀: 기찻길 위에서 소원을 적은 천등을 날려요 (사진)
• 지우펀: 해 질 녘 홍등이 켜지는 계단 골목이 하이라이트 (다음 사진)
지우펀은 저녁에 가장 붐비니 사진은 계단 아래쪽보다 위쪽 찻집 테라스에서 찍는 걸 추천해요.`,
      },
      {
        title: "지우펀의 밤",
        image_url: "/stories/taipei-2.jpg",
        image_credit: "Sunkenbean · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Jiufen_at_night_lantern_glow.jpg",
        content: `홍등이 켜진 지우펀 계단은 영화 속 장면 같아요. 골목이 좁고 계단이 많으니 편한 신발은 필수예요.

• 비가 자주 오는 지역이라 작은 우산을 챙기세요
• 막차·투어 출발 시간을 미리 확인해 두면 여유롭게 즐길 수 있어요`,
      },
      {
        title: "Day 3~4 · 시내 산책과 귀국",
        image_url: "",
        content: `셋째 날은 시내를 천천히 걸어요. 중정기념당, 융캉제(망고빙수·딤섬), 시먼딩 쇼핑 거리가 MRT로 가까워요.

마지막 날은 공항철도 시간을 넉넉히 잡고, 남은 이지카드 잔액은 공항 편의점에서 써요.`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "근교 투어는 날씨 영향을 많이 받아요. 출발 전 일기예보를 확인하고, 비 오는 날엔 시내 일정과 바꾸는 것도 방법이에요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=yrlPDeprz5A", title: "대만 타이베이 여행 13분 가이드 (산보노트 sanbonote)" },
          { url: "https://www.youtube.com/watch?v=5mA9RNmbrhs", title: "타이베이 근교여행 — 예류·지우펀·스펀·단수이 (트립콤파니)" },
        ],
        links: [
          { label: "타이베이 101 공식", url: "https://www.taipei-101.com.tw/" },
          {
            label: "표지 사진 출처 — Ken Marshall · CC BY 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Taipei_Skyline_at_twilight_20251014.jpg",
          },
        ],
      },
    ],
  },

  // ── 다낭·호이안 ──────────────────────────
  {
    title: "[Pothos 에디터] 다낭·호이안 3박 5일, 바다와 등불의 도시",
    subtitle: "미케 비치에서 쉬고, 바나힐 골든브릿지, 호이안 야경까지",
    destination: "다낭",
    cover_image_url: "/stories/danang-1.jpg",
    intro:
      "다낭은 휴양과 관광을 한 번에 즐길 수 있어 가족·커플 모두에게 인기예요. 낮엔 해변과 바나힐, 저녁엔 호이안 올드타운의 등불을 보는 3박 5일 코스를 정리했어요. (밤 비행기 출발·도착 기준)",
    duration_text: "3박 5일",
    tags: ["다낭", "호이안", "베트남", "휴양"],
    sections: [
      {
        title: "Day 1~2 · 미케 비치에서 쉬기",
        image_url: "/stories/danang-2.jpg",
        image_credit: "Jpatokal · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:My_Khe_Beach_Danang_Highrises.jpg",
        content: `늦은 밤 도착이 많아서 첫날은 숙소에서 쉬고, 둘째 날은 미케 비치에서 여유롭게 시작해요. 해변을 따라 호텔과 해산물 식당이 모여 있어요.

• 시내 이동은 그랩(Grab) 같은 차량 호출 앱이 편해요
• 햇볕이 강하니 선크림·모자 필수
• 저녁엔 한강 변 용다리 주변을 산책해요`,
      },
      {
        title: "Day 3 · 바나힐 골든브릿지",
        image_url: "",
        content: `바나힐은 긴 케이블카를 타고 산 위에 올라가는 테마파크예요. 거대한 두 손이 다리를 받치는 '골든브릿지'(표지 사진)는 2018년 문을 연 뒤 다낭의 상징이 됐어요.

• 산 위는 시내보다 쌀쌀하고 날씨가 자주 바뀌어요 — 얇은 겉옷 챙기기
• 사람이 몰리기 전 오전 일찍 가면 다리 사진이 훨씬 여유로워요
• 입장권은 공식 판매처나 믿을 만한 예약 사이트에서 미리`,
        links: [
          { label: "썬월드(바나힐 운영사) 공식", url: "https://sunworld.vn/en/" },
          {
            label: "다낭시 공식 — 골든브릿지 소개",
            url: "https://danangfantasticity.com/en/news/golden-bridge-in-da-nang-tops-the-list-of-fresh-wonders-of-the-world",
          },
        ],
      },
      {
        title: "Day 4 · 호이안 올드타운의 등불",
        image_url: "/stories/danang-3.jpg",
        image_credit: "Christophe95 · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Lanterns_in_Hoi_An_3.jpg",
        content: `다낭에서 차로 갈 수 있는 호이안은 오래된 무역항 마을이에요. 해 질 무렵부터 골목마다 색색의 등불이 켜져요.

• 낮에 도착해 골목을 걷고, 노란 벽과 등불 사진을 찍어요
• 저녁엔 투본강에서 소원 등불을 띄우는 쪽배를 타 봐요 (다음 사진)
• 올드타운 입장권 제도·요금은 바뀔 수 있으니 현지 안내를 확인하세요`,
      },
      {
        title: "투본강의 밤",
        image_url: "/stories/danang-4.jpg",
        image_credit: "Nguyen QuocTrung · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Thu_B%E1%BB%93n_River_at_night_-_H%E1%BB%99i_An_2022.jpg",
        content: `강 위에 떠다니는 등불과 강변 불빛이 어우러진 풍경은 호이안 여행의 하이라이트예요. 밤 비행기라면 이 일정을 마지막 날로 잡고 바로 공항으로 가도 좋아요.

• 야시장에서 반미, 까오러우(호이안 국수) 맛보기
• 우기(대략 가을~초겨울)에는 비가 잦으니 일정에 여유를 두세요`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "바나힐·호이안은 일정에 따라 순서를 바꿔도 돼요. 출발 전 영상으로 동선을 잡아 보세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=H4iL4OC0RgI", title: "다낭 여행의 하이라이트, 호이안 완벽 가이드 (트립콤파니)" },
          { url: "https://www.youtube.com/watch?v=xev4AUFrOn0", title: "다낭 여행 꼭 해야 할 3가지 — 코스·꿀팁·호이안·바나힐 (탁사장 여행일지)" },
        ],
        links: [
          { label: "다낭시 공식 관광 (Danang Fantasticity)", url: "https://danangfantasticity.com/en" },
          {
            label: "표지 사진 출처 — DvTor8303 · CC0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Golden_Bridge_at_Ba_Na_Hills_20250718.jpg",
          },
        ],
      },
    ],
  },

  // ── 방콕 ──────────────────────────
  {
    title: "[Pothos 에디터] 방콕 3박 5일, 사원과 강, 그리고 시장",
    subtitle: "왕궁·왓포·왓아룬부터 짜뚜짝 주말시장까지",
    destination: "방콕",
    cover_image_url: "/stories/bangkok-1.jpg",
    intro:
      "방콕은 화려한 사원과 강변 풍경, 끝없는 시장과 길거리 음식이 한 도시에 모여 있어요. 더위를 피해 오전엔 사원, 오후엔 쇼핑몰·마사지, 저녁엔 강변과 야시장으로 리듬을 잡는 3박 5일 코스예요.",
    duration_text: "3박 5일",
    tags: ["방콕", "태국", "사원", "야시장"],
    sections: [
      {
        title: "Day 1 · 왕궁 — 복장 규정 꼭 확인",
        image_url: "/stories/bangkok-2.jpg",
        image_credit: "Andy Marchand · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Grand_Palace_Bangkok,_Thailand.jpg",
        content: `왕궁은 매일 오전 8시 30분~오후 4시 30분에 열고, 표는 오후 3시 30분까지 팔아요. 외국인 입장료는 500바트로 에메랄드 사원(왓 프라깨우) 관람이 포함돼요. (왕궁 공식 안내 기준)

복장 규정이 엄격해요. 아래 차림은 입장할 수 없어요.
• 민소매, 크롭티, 비치는 옷
• 반바지·핫팬츠, 찢어진 바지, 몸에 붙는 레깅스·바이크 팬츠, 미니스커트
• 잠옷
얇은 긴바지와 소매 있는 셔츠를 입고, 땀 대비 손수건을 챙기세요. 드론은 금지예요.`,
        links: [{ label: "왕궁 공식 방문 안내", url: "https://www.royalgrandpalace.th/en/visit/practical-information" }],
      },
      {
        title: "Day 1 · 왓포의 와불",
        image_url: "/stories/bangkok-3.jpg",
        image_credit: "Manoonp · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Wat_Phra_Chettuphon_Wimon_Mangkhalaram_Ratchaworamahawihan_(Wat_Pho).jpg",
        content: `왕궁 바로 옆 왓포에는 거대한 누운 부처(와불)가 있어요. 전통 타이 마사지의 본산으로도 알려져 있어서, 사원 구경 후 마사지로 다리를 쉬어 가는 코스가 인기예요.`,
      },
      {
        title: "Day 2 · 짜오프라야강과 왓 아룬",
        image_url: "",
        content: `강 건너편 왓 아룬(새벽 사원)은 수상 보트로 금방이에요. 해 질 녘 강 건너에서 바라보는 왓 아룬 실루엣이 가장 아름다워요(표지 사진).

• 강을 따라 다니는 수상 버스는 교통 체증 없는 이동 수단
• 저녁엔 강변 루프톱 레스토랑에서 야경 감상`,
      },
      {
        title: "Day 3 · 짜뚜짝 주말시장",
        image_url: "/stories/bangkok-4.jpg",
        image_credit: "Ian Gratton · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Chatuchak_Market_(8270018927).jpg",
        content: `주말에 여행한다면 짜뚜짝 시장은 꼭 가 보세요. 옷·그릇·소품·식물까지 수많은 가게가 미로처럼 이어져 있어요.

• 오전 일찍 가야 덜 더워요
• 구역이 넓으니 지도를 사진으로 찍어 두고 다니기
• 시원한 코코넛 아이스크림은 필수`,
        links: [{ label: "짜뚜짝 시장 공식", url: "https://www.chatuchakmarket.org/" }],
      },
      {
        title: "Day 4~5 · 쇼핑·마사지 후 밤 비행기",
        image_url: "",
        content: `마지막 날은 대형 쇼핑몰과 마사지로 여유롭게 보내고, 짐을 맡긴 뒤 밤 비행기를 타는 일정이 일반적이에요. 공항까지는 교통 체증을 고려해 넉넉히 출발하세요.`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "사원은 종교 시설이에요. 조용히 관람하고, 불상보다 높은 곳에 올라가거나 발끝을 불상 쪽으로 향하지 않는 등 예절을 지켜 주세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=PaNj0aiyGNk", title: "방콕 여행을 0부터 제대로 알려드림 (트립콤파니)" },
          { url: "https://www.youtube.com/watch?v=j6K9cBT9voc", title: "30분 만에 방콕을 이해하는 영상 (산보노트 sanbonote)" },
        ],
        links: [
          { label: "태국관광청 (TAT)", url: "https://www.tourismthailand.org/" },
          {
            label: "표지 사진 출처 — Tee-12838 · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Wat_Arun_Ratchawararam_and_the_Royal_Barge_Procession.jpg",
          },
        ],
      },
    ],
  },

  // ── 파리 ──────────────────────────
  {
    title: "[Pothos 에디터] 파리 4박 6일, 처음이라면 이 순서로",
    subtitle: "에펠탑과 센강, 루브르, 몽마르트르",
    destination: "파리",
    cover_image_url: "/stories/paris-1.jpg",
    intro:
      "파리는 볼거리가 너무 많아 처음엔 동선 짜기가 막막해요. 센강을 중심으로 서쪽(에펠탑)·중앙(루브르·시테섬)·북쪽(몽마르트르)을 하루씩 나누면 이동이 훨씬 편해요. 미술관 휴관일만 피하면 돼요.",
    duration_text: "4박 6일",
    tags: ["파리", "프랑스", "유럽여행", "미술관"],
    sections: [
      {
        title: "Day 1~2 · 에펠탑과 센강",
        image_url: "/stories/paris-2.jpg",
        image_credit: "Ginevrajocosa88 · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Eiffel_tower_across_river_seine.jpg",
        content: `도착 다음 날은 에펠탑과 센강 주변으로 시작해요. 트로카데로 광장에서 바라보는 에펠탑, 샹드마르스 공원 잔디밭이 대표 포인트예요.

• 해 질 무렵 센강 유람선을 타면 파리의 다리와 건물을 한 번에 볼 수 있어요
• 에펠탑 전망대는 대기 줄이 길어 공식 사이트 사전 예매를 추천해요`,
      },
      {
        title: "Day 3 · 루브르 — 화요일 휴관 주의",
        image_url: "",
        content: `루브르는 하루를 다 써도 모자라요. 보고 싶은 작품(모나리자, 밀로의 비너스, 사모트라케의 니케 등)을 미리 정해 두고 동선을 짜세요.

공식 안내 기준(2026년 11월 확인)
• 일반 관람: 월·목·토·일 9:00~18:00, 수·금 9:00~21:00
• 화요일 휴관, 1월 1일·5월 1일·12월 25일 휴관
• 입장료: 유럽경제지역(EEA) 외 방문객 32유로 (18세 미만 무료)
※ 운영 시간·요금은 바뀔 수 있어요(파업 등으로 늦게 열기도 해요). 꼭 출발 전 공식 사이트에서 확인하고 시간 지정 예매를 하세요.`,
        links: [{ label: "루브르 박물관 관람 시간·요금 (공식)", url: "https://www.louvre.fr/en/visit/hours-admission" }],
      },
      {
        title: "Day 4 · 몽마르트르 언덕",
        image_url: "/stories/paris-4.jpg",
        image_credit: "Fernando Losada Rodríguez · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Basilique_du_Sacr%C3%A9-C%C5%93ur.001_-_Montmartre.jpg",
        content: `하얀 사크레쾨르 대성당이 있는 몽마르트르 언덕은 파리 시내를 내려다보기 좋은 곳이에요. 화가들이 그림을 그리는 테르트르 광장과 골목 카페를 천천히 걸어요.

• 언덕 계단이 가파르니 편한 신발 필수
• 관광객이 많은 곳이라 소지품(특히 휴대폰·지갑) 관리에 신경 쓰세요`,
      },
      {
        title: "Day 5~6 · 마레 지구 산책과 귀국",
        image_url: "",
        content: `마지막 날은 마레 지구의 작은 상점과 카페, 빵집을 둘러보며 기념품을 사요. 공항으로 가는 시간은 교통 상황을 고려해 넉넉히 잡으세요.

• 파리 대중교통은 지하철(메트로)이 가장 편해요
• 미술관을 여러 곳 간다면 통합 패스가 이득인지 미리 계산해 보세요`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "인기 명소는 대부분 사전 예매가 기본이에요. 영상으로 동선을 잡고, 예매는 꼭 공식 사이트에서 하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=QetTbhRcEME", title: "파리 여행코스 완벽 총정리 (여니버스 Yeoniverse)" },
          { url: "https://www.youtube.com/watch?v=EuqPhwqGi_E", title: "이것만 보면 파리 완전 정복 — 걸어서 세계속으로 (KBS)" },
        ],
        links: [
          { label: "파리 관광청", url: "https://parisjetaime.com/" },
          { label: "에펠탑 공식", url: "https://www.toureiffel.paris/" },
          {
            label: "표지 사진 출처 — ThePromenader · CC BY-SA 3.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Eiffel_st-jacques_horz_jms.jpg",
          },
        ],
      },
    ],
  },

  // ── 경주 ──────────────────────────
  {
    title: "[Pothos 에디터] 경주 1박 2일, 낮의 신라와 밤의 월지",
    subtitle: "불국사·대릉원·첨성대, 그리고 동궁과 월지 야경",
    destination: "경주",
    cover_image_url: "/stories/gyeongju-1.jpg",
    intro:
      "경주는 도시 전체가 박물관 같은 곳이에요. 낮에는 천년 신라의 유적을 걷고, 밤에는 조명이 켜진 동궁과 월지를 보는 1박 2일 코스를 정리했어요. 유적이 모여 있어 걸어서 다니기 좋아요.",
    duration_text: "1박 2일",
    tags: ["경주", "국내여행", "역사여행", "야경"],
    sections: [
      {
        title: "Day 1 · 대릉원과 첨성대",
        image_url: "/stories/gyeongju-3.jpg",
        image_credit: "Bernard Gagnon · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Daereungwon_Tomb_Complex.jpg",
        content: `첫날은 시내 중심의 대릉원부터 시작해요. 커다란 신라 왕릉이 언덕처럼 모여 있는 풍경이 경주만의 모습이에요.

• 근처 황리단길에서 점심과 카페 (한옥 카페·디저트 가게가 많아요)
• 대릉원에서 첨성대까지는 걸어서 금방 (다음 사진)`,
      },
      {
        title: "첨성대",
        image_url: "/stories/gyeongju-4.jpg",
        image_credit: "Basile Morin · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Cheomseongdae_Observatory_under_blue_sky_in_Gyeongju_South_Korea.jpg",
        content: `동양에서 가장 오래된 천문대로 알려진 첨성대는 넓은 들판 한가운데 서 있어요. 주변 꽃밭이 계절마다 바뀌어 사진 찍기 좋고, 밤에는 조명이 들어와 또 다른 분위기예요.`,
      },
      {
        title: "Day 1 밤 · 동궁과 월지",
        image_url: "",
        content: `경주 야경의 하이라이트예요. 해 진 직후 하늘이 짙은 파란색일 때 연못에 비친 전각이 가장 아름다워요(표지 사진).

한국관광공사 안내 기준
• 운영 09:00~22:00 (입장·매표 마감 21:30), 연중무휴
• 입장료 어른 3,000원, 청소년 2,000원, 어린이 1,000원
※ 요금·시간은 바뀔 수 있으니 방문 전 확인하세요.`,
        links: [
          { label: "한국관광공사 — 동궁과 월지", url: "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=94404" },
          { label: "경주시 — 경주 야경 10선", url: "https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4859" },
        ],
      },
      {
        title: "Day 2 · 불국사",
        image_url: "/stories/gyeongju-2.jpg",
        image_credit: "Basile Morin · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Bulguksa_temple_entrance_gate_stairs_flower_bed_and_blue_sky_in_Gyeongju_South_Korea.jpg",
        content: `둘째 날은 시내에서 조금 떨어진 불국사로 가요. 청운교·백운교 돌계단과 다보탑·석가탑을 천천히 둘러보세요. 2023년 5월부터 국가유산 관람료 면제 정책으로 현재 무료 입장이에요.

• 사람이 몰리기 전 오전 일찍 가면 한결 조용해요
• 시간이 되면 근처 석굴암까지 함께 둘러보는 코스도 좋아요`,
        links: [{ label: "불국사 공식", url: "https://www.bulguksa.or.kr/" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "유적지 사이 이동은 버스·택시·자전거를 섞으면 편해요. 출발 전 영상으로 동선을 잡아 보세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=PCXFIRB6o9I", title: "경주여행 기본 개념부터 잡아주는 12분 가이드 (트립콤파니)" },
          { url: "https://www.youtube.com/watch?v=KsP6fr2IPu0", title: "경주 1박 2일은 이 3구간으로 (여행하는크림이)" },
        ],
        links: [
          { label: "경주시 문화관광 공식", url: "https://www.gyeongju.go.kr/tour/index.do" },
          {
            label: "표지 사진 출처 — Basile Morin · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Water_reflection_of_Donggung_Palace_in_Wolji_Pond_at_blue_hour_in_Gyeongju_South_Korea.jpg",
          },
        ],
      },
    ],
  },

  // ── 삿포로 ──────────────────────────
  {
    title: "[Pothos 에디터] 겨울 삿포로 3박 4일, 눈축제와 오타루",
    subtitle: "2027 삿포로 눈축제(2월 4~11일)에 맞춰 떠나는 겨울 여행",
    destination: "삿포로",
    cover_image_url: "/stories/sapporo-1.jpg",
    intro:
      "삿포로의 겨울은 눈 그 자체가 볼거리예요. 2027년 삿포로 눈축제는 2월 4일부터 11일까지 오도리·츠도무·스스키노 세 곳에서 열려요(공식 발표 기준). 축제 기간에 맞춰 삿포로와 오타루를 함께 도는 3박 4일 코스를 정리했어요.",
    duration_text: "3박 4일",
    tags: ["삿포로", "홋카이도", "눈축제", "겨울여행"],
    sections: [
      {
        title: "도착 · 신치토세 공항에서 삿포로역",
        image_url: "",
        content: `신치토세 공항에서 삿포로역까지 JR 쾌속 '에어포트'로 약 37분, 특별쾌속으로 약 33분 걸려요(삿포로 관광 공식 안내 기준).

• 축제 기간엔 숙소가 빨리 차요 — 최대한 일찍 예약하세요
• 오도리공원·스스키노 근처에 숙소를 잡으면 밤 축제 보기 편해요`,
        links: [{ label: "삿포로 공식 교통 안내", url: "https://www.sapporo.travel/en/info/about/transportation/" }],
      },
      {
        title: "Day 1~2 · 오도리공원 눈축제",
        image_url: "/stories/sapporo-2.jpg",
        image_credit: "Materialscientist · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:SapporoFestival8.JPG",
        content: `메인 무대인 오도리공원에는 건물만 한 대형 눈 조각과 얼음 조각이 길게 늘어서요. 낮에 한 번, 조명과 프로젝션 매핑이 켜지는 밤에 한 번 보는 걸 추천해요(표지 사진).

• 길이 매우 미끄러워요 — 미끄럼 방지 신발이나 신발용 아이젠 필수
• 핫팩, 장갑, 귀까지 덮는 모자로 단단히
• 삿포로 TV타워 전망대에서 축제장을 내려다보는 것도 좋아요`,
        links: [{ label: "삿포로 눈축제 공식", url: "https://www.snowfes.com/" }],
      },
      {
        title: "Day 2 밤 · 스스키노",
        image_url: "/stories/sapporo-4.jpg",
        image_credit: "Chatama · Public domain · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Spectaculars_of_Susukino-Sapporo.jpg",
        content: `스스키노는 삿포로 최대의 번화가예요. 축제 기간에는 얼음 조각 회장이 열리고, 주변엔 미소 라멘, 수프카레, 징기스칸(양고기 구이) 맛집이 가득해요.`,
      },
      {
        title: "Day 3 · 오타루 운하",
        image_url: "/stories/sapporo-3.jpg",
        image_credit: "t-konno · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url:
          "https://commons.wikimedia.org/wiki/File:%E5%B0%8F%E6%A8%BD%E9%9B%AA%E3%81%82%E3%81%8B%E3%82%8A%E3%81%AE%E8%B7%AF2013%EF%BC%88Otaru_Snow_Light_Path_2013%EF%BC%89_-_panoramio_(4).jpg",
        content: `삿포로에서 JR로 가까운 항구 도시 오타루는 당일치기로 다녀오기 좋아요. 눈 덮인 운하와 석조 창고, 유리 공예 거리와 오르골당이 유명해요.

• 겨울엔 운하를 따라 작은 눈 등불을 밝히는 축제가 열리기도 해요 (사진은 2013년 '눈빛거리')
• 해산물 덮밥(카이센동)으로 점심
• 해가 일찍 지니 오후 늦게 운하 야경을 보고 돌아오세요`,
        links: [{ label: "오타루 관광협회", url: "https://otaru.gr.jp/" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "눈축제 기간과 행사 내용은 해마다 바뀌어요. 출발 전 공식 사이트에서 최신 정보를 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=G-8QKLAqkaQ", title: "삿포로 여행, 근교까지 완벽 정리 (여행가는시간)" },
          { url: "https://www.youtube.com/watch?v=tdKZpgSeO8E", title: "삿포로·오타루·비에이 겨울여행 브이로그 (Oh!군석)" },
        ],
        links: [
          { label: "삿포로 관광 공식 (한국어)", url: "https://www.sapporo.travel/ko/" },
          {
            label: "표지 사진 출처 — t-konno · CC BY-SA 3.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:%E7%AC%AC67%E5%9B%9E%E3%81%95%E3%81%A3%E3%81%BD%E3%82%8D%E9%9B%AA%E3%81%BE%E3%81%A4%E3%82%8A%EF%BC%88The_67th_Sapporo_Snow_Festival%EF%BC%89_-_panoramio_(2).jpg",
          },
        ],
      },
    ],
  },

  // ── 부산 ──────────────────────────
  {
    title: "[Pothos 에디터] 부산 1박 2일, 바다 따라 걷는 코스",
    subtitle: "해운대·광안리 야경, 감천문화마을, 해동용궁사, 자갈치",
    destination: "부산",
    cover_image_url: "/stories/busan-1.jpg",
    intro:
      "부산은 KTX로 금방 닿고, 바다와 시장과 골목이 한 도시에 다 있어서 1박 2일로도 알차요. 동쪽(해운대·광안리·기장)과 서쪽(감천·남포동)으로 하루씩 나누면 이동이 훨씬 편해요.",
    duration_text: "1박 2일",
    tags: ["부산", "국내여행", "바다", "야경"],
    sections: [
      {
        title: "Day 1 · 해운대에서 시작",
        image_url: "/stories/busan-2.jpg",
        image_credit: "StephNurnberg · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Haeundae_Beach_in_Busan.jpg",
        content: `부산역이나 김해공항에서 지하철로 해운대까지 바로 갈 수 있어요. 숙소를 해운대·광안리 쪽에 잡으면 첫날 동선이 편해요.

• 해운대 해변 산책 → 동백섬 해안 산책로
• 점심은 근처 시장에서 돼지국밥이나 밀면
• 여름이 아니어도 바다 앞 카페에서 쉬기 좋아요`,
      },
      {
        title: "Day 1 오후 · 해동용궁사",
        image_url: "/stories/busan-4.jpg",
        image_credit: "Christian Bolz · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Haedong_Yonggungsa_Temple_near_Busan.jpg",
        content: `해운대에서 동쪽 기장 방향으로 가면 바닷가 바위 위에 지어진 해동용궁사가 있어요. 파도 소리를 들으며 계단을 내려가는 길이 인상적이에요.

• 주말엔 사람이 많으니 평일 오전이나 오후 늦게
• 운영 시간은 방문 전에 확인하세요`,
      },
      {
        title: "Day 1 밤 · 광안대교 야경",
        image_url: "",
        content: `저녁엔 광안리 해변으로 이동해요. 해가 지면 광안대교에 조명이 켜지고(표지 사진), 해변을 따라 횟집과 카페가 늘어서 있어요.

• 해변 모래사장에 앉아 야경 감상
• 바다가 보이는 2층 카페나 루프톱에서 보는 것도 추천
• 광안리에서는 드론 라이트쇼가 열리는 날도 있어요 — 일정은 미리 확인`,
      },
      {
        title: "Day 2 · 감천문화마을",
        image_url: "/stories/busan-3.jpg",
        image_credit: "Basile Morin · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Colorful_houses_in_Gamcheon_Culture_Village_at_sunset_in_Busan_South_Korea.jpg",
        content: `둘째 날은 서쪽으로! 산비탈을 따라 알록달록한 집들이 계단처럼 이어진 감천문화마을은 '한국의 마추픽추'라고도 불려요.

• 골목이 좁고 경사가 있어 편한 신발 필수
• 실제로 주민이 사는 마을이에요 — 조용히, 집 안을 들여다보지 않기
• 전망 포인트에서 마을 전체를 내려다보는 사진이 가장 예뻐요`,
        links: [{ label: "감천문화마을 공식", url: "https://www.gamcheon.or.kr/" }],
      },
      {
        title: "Day 2 오후 · 자갈치시장과 남포동",
        image_url: "/stories/busan-5.jpg",
        image_credit: "Bernard Gagnon · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Jagalchi_Market_01.jpg",
        content: `감천에서 내려와 자갈치시장으로 가요. 1층에서 해산물을 고르고 2층 식당에서 바로 먹을 수 있어요.

• 근처 국제시장·BIFF 광장에서 씨앗호떡, 어묵 등 길거리 간식
• 부산역이 가까워 KTX 타기 전 마지막 코스로 딱`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "부산은 지하철이 잘 되어 있어 대부분 대중교통으로 다닐 수 있어요. 출발 전 영상으로 동선을 잡아 보세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=m9bWOxd5qAo", title: "부산 여행, 음식·교통·지역 하나부터 차근차근 (트립콤파니)" },
          { url: "https://www.youtube.com/watch?v=nCVpf0cqgxU", title: "동선 낭비 없는 1박 2일 부산 여행 (티플 TIPLE)" },
        ],
        links: [
          { label: "비짓부산 — 부산 공식 관광포털", url: "https://www.visitbusan.net/kr/index.do" },
          { label: "김해국제공항 (한국공항공사)", url: "https://www.airport.co.kr/gimhae/index.do" },
          {
            label: "표지 사진 출처 — lumoplank · CC0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Gwangan_Bridge_and_Gwangalli_Beach_-_Gwangalli2721.jpg",
          },
        ],
      },
    ],
  },

  // ── 도쿄 ──────────────────────────
  {
    title: "[Pothos 에디터] 처음 가는 도쿄 3박 4일, 동네별로 나눠 걷기",
    subtitle: "아사쿠사·시부야·하라주쿠·신주쿠, 지하철로 하루씩",
    destination: "도쿄",
    cover_image_url: "/stories/tokyo-1.jpg",
    intro:
      "도쿄는 너무 넓어서 욕심내면 하루 종일 지하철만 타게 돼요. 동쪽의 전통(아사쿠사), 서쪽의 트렌드(시부야·하라주쿠), 밤의 신주쿠처럼 동네별로 하루씩 묶으면 여유롭게 즐길 수 있어요.",
    duration_text: "3박 4일",
    tags: ["도쿄", "일본", "첫해외여행", "도시여행"],
    sections: [
      {
        title: "도착 · 나리타에서 도심까지",
        image_url: "",
        content: `나리타공항에서 도심까지는 게이세이 '스카이라이너'가 빠르고 편해요. 공식 안내 기준 최단 36분, 게이세이우에노역까지 최고 속도로 41분이에요.

• 하네다공항으로 들어오면 도심이 더 가까워요
• 교통카드(Suica·PASMO 등)를 만들거나 휴대폰에 추가해 두면 지하철 환승이 편해요`,
        links: [{ label: "게이세이 스카이라이너 (한국어)", url: "https://www.keisei.co.jp/keisei/tetudou/skyliner/kr/" }],
      },
      {
        title: "Day 1 · 아사쿠사 센소지",
        image_url: "/stories/tokyo-3.jpg",
        image_credit: "Guilhem Vellut · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Senso-ji_Temple_@_Asakusa_(13824517393).jpg",
        content: `도쿄에서 가장 오래된 사찰 센소지는 628년에 세워졌고, 지금 건물은 제2차 세계대전 때 소실된 뒤 다시 지은 거예요. 아사쿠사역에서 걸어서 5분 정도이고 무료로 둘러볼 수 있어요(GO TOKYO 안내 기준).

• 큰 붉은 등이 달린 가미나리몬 → 나카미세 상점가 → 본당 순서로
• 상점가에서 닌교야키, 멜론빵 같은 간식 맛보기
• 근처 스미다강 건너 도쿄 스카이트리가 보여요`,
        links: [{ label: "GO TOKYO — 센소지 (한국어)", url: "https://www.gotokyo.org/kr/spot/15/index.html" }],
      },
      {
        title: "Day 2 · 메이지 신궁과 하라주쿠",
        image_url: "/stories/tokyo-4.jpg",
        image_credit: "Asanagi · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Meiji_Shrine_Minami-sando-torii_2023-01-26.jpg",
        content: `오전엔 울창한 숲길을 따라 걷는 메이지 신궁으로 가요. 큰 나무 도리이를 지나면 도심 한가운데라는 게 믿기지 않을 만큼 조용해요.

• 신궁을 나오면 바로 하라주쿠 — 다케시타 거리의 크레페와 개성 있는 가게들
• 오모테산도 거리를 따라 걸으며 쇼핑`,
        links: [{ label: "메이지 신궁 공식", url: "https://www.meijijingu.or.jp/" }],
      },
      {
        title: "Day 2 밤 · 시부야 스크램블 교차로",
        image_url: "/stories/tokyo-2.jpg",
        image_credit: "Bruce from Sydney, Australia · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Shibuya_Crossing_(25790725888).jpg",
        content: `하라주쿠에서 걸어서 시부야로 내려가요. 신호가 바뀌면 사방에서 수많은 사람이 한꺼번에 건너는 스크램블 교차로는 도쿄를 대표하는 풍경이에요.

• 교차로가 내려다보이는 건물 위 카페나 전망대에서 보면 더 실감 나요
• 시부야 스카이 같은 전망대는 일몰 시간대 예약이 빨리 차요`,
        links: [{ label: "SHIBUYA SKY 공식", url: "https://www.shibuya-scramble-square.com/sky/" }],
      },
      {
        title: "Day 3 · 도쿄 타워와 전망",
        image_url: "/stories/tokyo-5.jpg",
        image_credit: "Daniel L. Lu (user:dllu) · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Tokyo_Tower_as_seen_from_Mori_Tower.jpg",
        content: `셋째 날은 도쿄 타워 주변과 롯폰기를 돌아봐요. 사진은 롯폰기 힐스 전망대에서 본 도쿄 타워예요. 맑은 겨울날엔 신주쿠 고층 빌딩 너머로 후지산이 보이기도 해요(표지 사진).

• 저녁엔 신주쿠 오모이데요코초 같은 좁은 골목 이자카야 체험
• 마지막 날은 공항 가는 길에 쇼핑`,
        links: [{ label: "도쿄 타워 공식", url: "https://www.tokyotower.co.jp/" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "인기 전망대·레스토랑은 예약이 기본이에요. 출발 전 영상으로 동네별 분위기를 먼저 보고 일정을 짜 보세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=T55KlNxUQaY", title: "도쿄 여행코스 일정별 총정리 (여니버스 Yeoniverse)" },
          { url: "https://www.youtube.com/watch?v=9rpdxzOhb5E", title: "2026년, 도쿄를 즐기는 57가지 방법 (산보노트 sanbonote)" },
        ],
        links: [
          { label: "도쿄 관광 공식 GO TOKYO (한국어)", url: "https://www.gotokyo.org/kr/" },
          {
            label: "표지 사진 출처 — Morio · CC BY-SA 3.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Skyscrapers_of_Shinjuku_2009_January_(revised).jpg",
          },
        ],
      },
    ],
  },

  // ── 싱가포르 ──────────────────────────
  {
    title: "[Pothos 에디터] 싱가포르 3박 4일, 작아서 더 알찬 도시",
    subtitle: "마리나베이, 슈퍼트리 쇼, 호커센터, 센토사",
    destination: "싱가포르",
    cover_image_url: "/stories/singapore-5.jpg",
    intro:
      "싱가포르는 도시가 작고 대중교통이 잘 되어 있어 처음 가도 다니기 쉬워요. 낮엔 덥고 비가 자주 오니 실내·실외 일정을 섞고, 저녁엔 마리나베이 야경과 호커센터 음식으로 마무리하는 3박 4일 코스예요.",
    duration_text: "3박 4일",
    tags: ["싱가포르", "동남아", "도시여행", "가족여행"],
    sections: [
      {
        title: "출발 전 · SG 입국 카드",
        image_url: "",
        content: `싱가포르에 들어가려면 온라인 'SG 입국 카드(SG Arrival Card)'를 내야 해요. 싱가포르 이민국(ICA) 안내 기준으로 무료이고, 도착일을 포함해 도착 3일 전부터 제출할 수 있어요.

• 꼭 공식 사이트에서 제출하세요 — 수수료를 받는 대행 사이트가 있어요`,
        links: [{ label: "SG 입국 카드 공식 안내 (ICA)", url: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/sg-arrival-card" }],
      },
      {
        title: "Day 1 · 마리나베이",
        image_url: "",
        content: `첫날은 싱가포르의 상징 마리나베이 샌즈와 주변 산책로로 시작해요(표지 사진). 바다를 둘러싼 산책로를 따라 머라이언 공원까지 걸으면 도시의 대표 풍경을 한 번에 볼 수 있어요.

• 한낮엔 무척 더우니 오후 늦게 시작하는 게 좋아요
• 쇼핑몰이 실내로 연결되어 있어 비 올 때 피하기 좋아요`,
      },
      {
        title: "Day 1 밤 · 가든스 바이 더 베이 슈퍼트리",
        image_url: "/stories/singapore-2.jpg",
        image_credit: "Dietmar Rabich · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Singapore_(SG),_Gardens_by_the_Bay,_Supertree_Grove_--_2019_--_4752.jpg",
        content: `거대한 나무 모양 구조물이 모인 슈퍼트리 그로브는 무료로 들어갈 수 있고 매일 오전 5시~새벽 2시에 열어요. 밤에는 음악과 조명 쇼 '가든 랩소디'가 저녁 7시 45분, 8시 45분 두 번 열려요(공식 안내 기준).

• 쇼는 슈퍼트리 아래 바닥에 누워서 올려다보는 게 최고
• 실내 온실(플라워 돔·클라우드 포레스트)은 별도 유료`,
        links: [{ label: "가든스 바이 더 베이 공식", url: "https://www.gardensbythebay.com.sg/" }],
      },
      {
        title: "Day 2 · 호커센터에서 먹는 싱가포르",
        image_url: "/stories/singapore-3.jpg",
        image_credit: "kallerna · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Lau_Pa_Sat_Singapore_2.jpg",
        content: `싱가포르 음식의 진짜 맛은 호커센터(야외 푸드코트)에 있어요. 금융가 한가운데 있는 라우파삿은 아름다운 옛 시장 건물로도 유명해요.

꼭 먹어 볼 것
• 치킨라이스, 락사, 칠리크랩, 사테(꼬치구이)
• 자리를 먼저 잡고(휴지를 올려 두는 현지 문화가 있어요) 음식을 사 오세요
• 차이나타운, 리틀인디아도 함께 둘러보면 하루가 알차요`,
        links: [{ label: "라우파삿 공식", url: "https://www.laupasat.sg/" }],
      },
      {
        title: "Day 3 · 센토사 섬",
        image_url: "/stories/singapore-4.jpg",
        image_credit: "Moheen Reeyad · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Palawan_Beach,_Sentosa_(184328).jpg",
        content: `셋째 날은 리조트 섬 센토사로 가요. 테마파크와 수족관, 그리고 팔라완 비치 같은 해변에서 쉬어 가기 좋아요.

• 아이와 함께라면 테마파크 하루, 커플이라면 해변과 비치 클럽
• 마지막 날은 창이공항의 실내 폭포와 쇼핑을 즐기고 출국`,
        links: [{ label: "센토사 공식", url: "https://www.sentosa.com.sg/" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "싱가포르는 규칙이 엄격한 편이에요(공공장소 흡연·음식물 등). 출발 전 영상과 공식 안내로 미리 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=O3-p3OpprE0", title: "싱가포르 여행을 0부터 제대로 알려드림 (트립콤파니)" },
          { url: "https://www.youtube.com/watch?v=0ZuTDv6-m_M", title: "싱가포르 여행코스 총정리 — 맛집·쇼핑·숙소·교통 (여니버스 Yeoniverse)" },
        ],
        links: [
          { label: "비짓싱가포르 (싱가포르관광청)", url: "https://www.visitsingapore.com/ko_kr/" },
          { label: "창이공항 공식", url: "https://www.changiairport.com/" },
          {
            label: "표지 사진 출처 — Basile Morin · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Marina_Bays_Sands_Hotel_and_skyline_of_the_Central_Business_District_Singapore.jpg",
          },
        ],
      },
    ],
  },

  // ── 스위스 ──────────────────────────
  {
    title: "[Pothos 에디터] 스위스 인터라켄·융프라우 5박 7일",
    subtitle: "호수와 폭포의 마을, 그리고 해발 3,454m 융프라우요흐",
    destination: "인터라켄",
    cover_image_url: "/stories/switzerland-1.jpg",
    intro:
      "인터라켄은 두 호수 사이에 자리한 마을로, 융프라우 지역을 여행하는 베이스캠프예요. 한곳에 숙소를 잡고 기차와 케이블카로 매일 다른 마을과 산을 오가는 5박 7일 코스를 정리했어요. 산 위 일정은 날씨에 맞춰 바꾸는 게 핵심이에요.",
    duration_text: "5박 7일",
    tags: ["스위스", "융프라우", "유럽여행", "자연"],
    sections: [
      {
        title: "Day 1~2 · 인터라켄과 호수",
        image_url: "/stories/switzerland-2.jpg",
        image_credit: "Nicojonesgodel · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Brienzersee_with_a_coastal_town.jpg",
        content: `취리히 등 큰 도시에 도착해 기차로 인터라켄까지 이동해요. 첫날은 마을을 산책하고 쉬어요.

둘째 날은 호수! 인터라켄 양쪽의 브리엔츠 호수(사진)와 툰 호수는 물빛이 정말 맑아요.
• 유람선을 타고 호숫가 마을에 내려 산책
• 호수 위에서 보는 설산 풍경이 압도적이에요 (다음 사진)`,
        links: [{ label: "인터라켄 관광청", url: "https://www.interlaken.ch/" }],
      },
      {
        title: "툰 호수에서 본 아이거·묀히·융프라우",
        image_url: "/stories/switzerland-5.jpg",
        image_credit: "Paradise Chronicle · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Sail_boat_on_Lake_Thun_with_Eiger_M%C3%B6nch_und_Jungfrau_in_background.jpg",
        content: `호수 너머로 보이는 세 봉우리가 아이거, 묀히, 융프라우예요. 이 중 융프라우 아래 고개에 있는 기차역이 다음 일정인 융프라우요흐예요.`,
      },
      {
        title: "Day 3 · 융프라우요흐, Top of Europe",
        image_url: "/stories/switzerland-3.jpg",
        image_credit: "Leonhard Lenz · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Jungfrau_seen_from_viewpoint_Sphinx_at_Jungfraujoch_2022-10-02_01.jpg",
        content: `융프라우요흐는 해발 3,454m에 있는 '유럽에서 가장 높은 기차역'이에요. 인터라켄 동역에서 아이거 익스프레스(곤돌라)를 거쳐 약 1시간 30분, 그린델발트 터미널에서는 약 45분 걸려요. 왕복 요금은 CHF 129.60부터예요(융프라우 철도 공식 안내 기준, 요금은 바뀔 수 있어요).

• 스핑크스 전망대(해발 3,571m)는 엘리베이터로 25초 만에 108m를 올라가요
• 길이 22km의 알레치 빙하가 내려다보여요 (유네스코 세계유산)
• 고도가 높아 숨이 찰 수 있어요 — 천천히 걷고 물 많이 마시기
• 맑은 날을 골라 가는 게 중요해요. 산 위 웹캠으로 날씨를 확인하고 출발하세요`,
        links: [{ label: "융프라우 철도 — 융프라우요흐 공식", url: "https://www.jungfrau.ch/en-gb/jungfraujoch-top-of-europe/" }],
      },
      {
        title: "Day 4 · 라우터브루넨 계곡",
        image_url: "",
        content: `거대한 절벽 사이로 폭포가 떨어지는 라우터브루넨 계곡은 동화 속 마을 같아요(표지 사진). 마을에서 가장 눈에 띄는 슈타우바흐 폭포는 걸어서 가까이 갈 수 있어요.

• 계곡을 따라 평평한 길이 이어져 가벼운 산책 하이킹에 좋아요
• 케이블카로 위쪽 마을(뮈렌·벵엔 등)에 올라가면 또 다른 풍경`,
      },
      {
        title: "Day 5~7 · 그린델발트 하이킹과 귀국",
        image_url: "/stories/switzerland-4.jpg",
        image_credit: "W. Bulach · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:00_0020_Grindelwald_-_Wetterhorn.jpg",
        content: `그린델발트는 웅장한 봉우리 바로 아래 자리한 산악 마을이에요. 케이블카로 올라가 산 위 호수까지 걷는 하이킹 코스가 인기예요.

• 여름엔 하이킹, 겨울엔 스키·썰매
• 스위스는 물가가 높아요 — 마트 도시락과 피크닉으로 식비를 아끼는 여행자가 많아요
• 마지막 날은 공항까지 기차 시간을 넉넉히`,
        links: [{ label: "스위스 연방철도 SBB", url: "https://www.sbb.ch/en" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "융프라우 지역은 교통 패스 종류가 많아요. 일정과 가고 싶은 산에 맞춰 어떤 패스가 이득인지 영상과 공식 안내로 비교해 보세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=cv8LTWadVLU", title: "스위스 여행코스 일정별로 총정리 (여니버스 Yeoniverse)" },
          { url: "https://www.youtube.com/watch?v=xqGp7sVBD7U", title: "융프라우 가는 3가지 방법 + 티켓·하이킹 총정리 (차가운순대 Swissfriends)" },
        ],
        links: [
          { label: "스위스관광청 MySwitzerland", url: "https://www.myswitzerland.com/ko/" },
          {
            label: "표지 사진 출처 — chensiyuan · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:1_lauterbrunnen_valley_2012b.jpg",
          },
        ],
      },
    ],
  },

  // ── 발리 ──────────────────────────
  {
    title: "[Pothos 에디터] 발리 4박 6일, 우붓의 초록과 바다의 일몰",
    subtitle: "뜨갈랄랑 계단식 논, 몽키 포레스트, 따나롯 사원, 스미냑 해변",
    destination: "발리",
    cover_image_url: "/stories/bali-1.jpg",
    intro:
      "발리는 정글과 논이 있는 우붓, 서핑과 일몰의 해변 마을이 완전히 다른 매력을 가지고 있어요. 앞의 이틀은 우붓, 뒤의 이틀은 해변에서 보내는 4박 6일 코스를 정리했어요. 섬 안 이동은 교통 체증이 심하니 숙소를 두 곳으로 나누는 걸 추천해요.",
    duration_text: "4박 6일",
    tags: ["발리", "인도네시아", "휴양", "신혼여행"],
    sections: [
      {
        title: "출발 전 · 발리 관광세",
        image_url: "",
        content: `발리를 찾는 외국인 관광객은 1인당 IDR 150,000의 관광세를 내야 해요. 발리 주정부 공식 사이트 'Love Bali'에서 미리 낼 수 있어요.

• 공식 사이트에서만 결제하세요
• 그 외 비자 등 입국 요건은 출발 전 최신 공식 안내를 확인하세요`,
        links: [{ label: "발리 관광세 공식 (Love Bali)", url: "https://lovebali.baliprov.go.id/" }],
      },
      {
        title: "Day 1~2 · 우붓의 계단식 논",
        image_url: "",
        content: `우붓 북쪽의 뜨갈랄랑 계단식 논은 발리를 대표하는 풍경이에요(표지 사진). 야자수 사이로 초록 논이 층층이 이어져 있어요.

• 사람이 적고 빛이 부드러운 이른 아침에 가세요
• 논 사이 길은 미끄러울 수 있어요 — 운동화 추천
• 근처 카페에서 논을 내려다보며 쉬어 가기`,
      },
      {
        title: "우붓 몽키 포레스트",
        image_url: "/stories/bali-3.jpg",
        image_credit: "Jorge Franganillo · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Sacred_Monkey_Forest_Sanctuary_(49818583963).jpg",
        content: `우붓 시내의 몽키 포레스트는 원숭이 수백 마리가 사는 숲속 사원이에요. 공식 안내 기준 오전 9시~오후 6시 운영(마지막 입장 오후 5시)이에요.

• 원숭이에게 먹이를 주거나 눈을 오래 마주치지 마세요
• 선글라스·모자·물병처럼 낚아채기 쉬운 물건은 가방에 넣어 두기`,
        links: [{ label: "우붓 몽키 포레스트 공식", url: "https://monkeyforestubud.com/" }],
      },
      {
        title: "Day 3 · 따나롯 사원의 일몰",
        image_url: "/stories/bali-2.jpg",
        image_credit: "CEphoto, Uwe Aranas · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Tanah-Lot_Bali_Indonesia_Pura-Tanah-Lot-01.jpg",
        content: `해변 쪽으로 숙소를 옮기는 날, 오후 늦게 따나롯 사원에 들러요. 바다 위 바위섬에 세워진 사원 뒤로 해가 지는 풍경이 유명해요.

• 물때에 따라 바위섬 가까이 걸어갈 수 있는 때가 달라요
• 일몰 시간엔 매우 붐비니 조금 일찍 도착하기
• 사원은 종교 시설이에요 — 노출이 심한 옷은 피하고 예절을 지켜 주세요`,
      },
      {
        title: "Day 4~6 · 스미냑 해변에서 쉬기",
        image_url: "/stories/bali-4.jpg",
        image_credit: "Christophe95 · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Seminyak_Beach_at_sunset.jpg",
        content: `마지막 이틀은 스미냑 해변에서 여유롭게! 해변 앞 빈백 소파에 앉아 일몰을 보는 게 발리의 하루 마무리예요.

• 낮엔 풀빌라·스파, 저녁엔 해변 레스토랑
• 공항이 가까운 편이라 마지막 날 일정 잡기도 편해요 (교통 체증은 감안)
• 수돗물은 마시지 말고 생수를 드세요`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "발리는 지역마다 분위기가 완전히 달라요. 영상으로 지역별 특징을 보고 숙소 위치를 정하면 여행이 훨씬 편해져요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=goUvvgXHnuY", title: "발리, 0부터 체계적으로 알려드림 — 지역과 여행지 (트립콤파니)" },
          { url: "https://www.youtube.com/watch?v=UTYXtmWcxz0", title: "발리 여행코스 취향·기간별 추천 (여니버스 Yeoniverse)" },
        ],
        links: [
          { label: "인도네시아 관광청 Wonderful Indonesia", url: "https://www.indonesia.travel/" },
          {
            label: "표지 사진 출처 — Philip Nalangan · CC BY 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Tegallalang_Rice_Terraces_Bali.jpg",
          },
        ],
      },
    ],
  },

  // ── 안동 ──────────────────────────
  {
    title: "[Pothos 에디터] 안동 1박 2일, 하회마을과 서원 따라 걷는 선비의 길",
    subtitle: "하회마을·병산서원·도산서원, 월영교 야경, 찜닭과 헛제삿밥",
    destination: "안동",
    cover_image_url: "/stories/andong-1.jpg",
    intro:
      "안동은 마을과 서원, 사찰이 세계유산으로 지정된 '한국 정신문화의 수도'예요. 강이 마을을 감싸 도는 하회마을에서 하룻밤을 보내고, 서원과 월영교 야경, 찜닭골목까지 둘러보는 1박 2일 코스를 정리했어요.",
    duration_text: "1박 2일",
    tags: ["안동", "국내여행", "세계유산", "역사여행"],
    sections: [
      {
        title: "Day 1 · 하회마을",
        image_url: "",
        content: `낙동강이 마을을 'S'자로 감싸 흐르는 하회마을은 2010년 유네스코 세계유산에 등재됐어요(표지 사진). 기와집과 초가가 어우러진 골목을 천천히 걸어 보세요.

하회마을 공식 안내 기준
• 입장료: 어른(19~64세) 5,000원, 청소년 2,500원, 어린이 1,500원 (65세 이상 국내인·6세 이하 무료)
• 주차와 마을 입구 셔틀버스는 무료, 하회세계탈박물관도 무료
• 안동 시내에서 210번 버스로 약 50분

• 강 건너 부용대에 오르면 마을이 한눈에 내려다보여요
• 탈춤 공연이 열리는 날이면 꼭 챙겨 보세요`,
        links: [{ label: "안동하회마을 공식 (입장료·교통)", url: "http://www.hahoe.or.kr/" }],
      },
      {
        title: "Day 1 오후 · 병산서원",
        image_url: "/stories/andong-2.jpg",
        image_credit: "limhyungkyu · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:%EB%B3%91%EC%82%B0%EC%84%9C%EC%9B%90-1.jpg",
        content: `하회마을에서 가까운 병산서원은 강과 절벽을 마주한 자리에 앉은 서원이에요. 누각(만대루)에 앉아 앞산과 강을 바라보는 풍경이 이 서원의 백미예요.

• 2019년 도산서원 등과 함께 '한국의 서원'으로 세계유산에 등재됐어요
• 하회마을에서 가는 길은 비포장 구간이 있어요 — 운전에 주의`,
      },
      {
        title: "Day 1 밤 · 월영교",
        image_url: "/stories/andong-4.jpg",
        image_credit: "Bernard Gagnon · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Weolyeonggyo_Bridge_02.jpg",
        content: `저녁엔 시내 쪽 안동댐 아래 월영교로 가요. 호수를 가로지르는 나무다리와 가운데 정자에 조명이 들어오면 무척 낭만적이에요.

• 저녁 식사는 시내 찜닭골목에서 안동찜닭을 (닭에 채소와 양념을 넣어 졸인, 안동에서 유래한 요리)
• 다리 주변을 산책하며 야경 사진 찍기`,
      },
      {
        title: "Day 2 · 도산서원과 헛제삿밥",
        image_url: "/stories/andong-3.jpg",
        image_credit: "Steve46814 · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Korea-Andong-Dosan_Seowon_2991%262-06.jpg",
        content: `둘째 날은 퇴계 이황을 기리는 도산서원으로 가요. 1575년 한석봉이 쓴 현판을 받은 곳으로, 강가 언덕에 단정하게 앉은 건물들이 인상적이에요.

• 점심은 헛제삿밥 — 제사 음식과 같은 재료로 만든 비빔밥을 평소에 먹을 수 있게 한 안동 향토 음식
• 시간이 되면 우리나라에서 가장 오래된 목조 건물이 있는 봉정사(2018년 세계유산)도 함께 둘러보세요`,
        links: [{ label: "안동관광 — 안동시 공식 관광", url: "https://www.tourandong.com/public/" }],
      },
      {
        title: "가을이라면 · 안동국제탈춤페스티벌",
        image_url: "",
        content: `안동국제탈춤페스티벌은 보통 9월 말~10월 초에 열려요. 2026년에는 9월 24일~10월 4일 안동역(원도심)·탈춤공원·하회마을 등에서 열렸어요.

• 국내 탈춤과 해외 가면극을 한자리에서 볼 수 있어요
• 2027년 일정은 아직 발표 전이에요 — 공식 사이트에서 확인하세요`,
        links: [{ label: "안동국제탈춤페스티벌 공식", url: "https://www.maskdance.com/" }],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "서원·사찰의 관람 시간은 계절에 따라 달라요. 출발 전 영상으로 동선을 잡고, 운영 시간은 공식 안내를 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=-fZOnaFQ_hU", title: "1박 2일 안동여행 코스 총정리 (여행크리에이터 모험가 mwomga)" },
          { url: "https://www.youtube.com/watch?v=nofsZKJ7lVk", title: "꼭 가봐야 하는 안동 여행코스 Top11 ([빵이네]캠핑&여행TV)" },
        ],
        links: [
          { label: "대한민국 구석구석 (한국관광공사)", url: "https://korean.visitkorea.or.kr/" },
          {
            label: "표지 사진 출처 — Bernard Gagnon · CC0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Hahoe_Folk_Village_02.jpg",
          },
        ],
      },
    ],
  },

  // ── CES ──────────────────────────
  {
    title: "[Pothos 에디터] CES 2027 라스베이거스 참관 가이드",
    subtitle: "2027년 1월 6~9일, 등록 조건부터 전시장 이동까지",
    destination: "라스베이거스",
    cover_image_url: "/stories/ces-1.jpg",
    intro:
      "CES는 매년 1월 라스베이거스에서 열리는 세계 최대 규모의 IT·가전 전시회예요. 다만 일반 관광객이 표를 사서 들어가는 박람회가 아니라 업계 관계자 전용 행사라서, 미리 알아둘 게 많아요. 처음 가는 출장자·참관객을 위해 공식 안내 기준으로 정리했어요.",
    duration_text: "4박 6일",
    tags: ["CES", "라스베이거스", "박람회", "출장"],
    sections: [
      {
        title: "언제, 어디서",
        image_url: "",
        content: `CES 2027은 2027년 1월 6일(수)~9일(토) 라스베이거스에서 열려요(표지 사진은 CES 2025 당시 LVCC 웨스트홀).

공식 안내 기준 전시 시간
• 1월 6일(수) 오전 10시~오후 6시
• 1월 7일(목)·8일(금) 오전 9시~오후 6시
• 1월 9일(토) 오전 9시~오후 4시
• 미디어 데이: 1월 4~5일 (만달레이 베이)

전시장은 13곳이며 크게 세 구역으로 나뉘어요 — LVCC 캠퍼스, 베네시안 캠퍼스, C Space 캠퍼스(ARIA).`,
        links: [{ label: "CES 공식 — 일정·시간", url: "https://www.ces.tech/plan-your-visit/dates-and-hours/" }],
      },
      {
        title: "누가 들어갈 수 있나 — 꼭 확인하세요",
        image_url: "",
        content: `CES는 '업계 관계자 전용(trade-only)' 행사예요. 공식 안내에 따르면 만 18세 이상이면서 소비자 기술 산업에 종사하는 사람만 참관할 수 있고, 일반인에게는 공개되지 않아요.

• 등록할 때 업계 소속을 증명하는 서류를 올려야 해요 — 사업 관련 서류 1개 + 재직 증빙 1개 (예: 명함, 재직증명서, 링크드인 프로필 등)
• 사진이 있는 신분증과 생년월일도 필요해요

등록 요금 (공식 안내 기준, 2026년 11월 확인)
• 스탠다드 패스: 11월 30일까지 149달러 → 12월 1일부터 349달러
• 프리미엄 패스: 11월 30일까지 1,450달러 → 12월 1일부터 1,750달러
• 환불: 2026년 12월 9일까지 서면 취소 시 50달러 수수료를 빼고 환불, 이후엔 환불 불가

💡 11월 안에 등록하면 200달러를 아낄 수 있어요.`,
        links: [{ label: "CES 공식 — 등록 안내", url: "https://www.ces.tech/attendee-guides/registration-information/" }],
      },
      {
        title: "라스베이거스 도착과 숙소",
        image_url: "/stories/ces-2.jpg",
        image_credit: "Traveller-Reini · CC BY-SA 2.0 · Wikimedia Commons",
        image_credit_url:
          "https://commons.wikimedia.org/wiki/File:Nevada_-_Las_Vegas-_Dusk_over_Paradise_Road_with_WESTGATE_Casino,_the_Las_Vegas_Convention_Center_and_McCarran_International_Airport.jpg",
        content: `한국에서는 보통 미국 서부 도시를 거쳐 해리 리드 국제공항으로 들어가요. 사진은 해 질 녘 컨벤션센터(LVCC)와 공항 쪽을 내려다본 모습이에요.

• 공항에서 시내까지는 택시·차량 호출 앱이 일반적이에요 (1터미널 택시는 수하물 찾는 곳 밖, 차량 호출은 주차장 2층)
• CES 기간에는 호텔값이 크게 오르고 빨리 마감돼요 — 등록과 함께 숙소부터 잡으세요
• 공식 협력 호텔에 묵으면 CES 무료 셔틀을 탈 수 있어요`,
        links: [{ label: "해리 리드 공항 — 택시·차량 호출", url: "https://www.harryreidairport.com/taxi-and-ride-share" }],
      },
      {
        title: "전시장 사이 이동 — 모노레일·셔틀·루프",
        image_url: "/stories/ces-4.jpg",
        image_credit: "Han Zheng · CC BY-SA 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Las_Vegas_Monorail_heading_to_Westgate_Station_(51716442951).jpg",
        content: `CES 공식 교통 안내 기준
• 모노레일: LVCC와 스트립의 주요 호텔(MGM 그랜드, 패리스, 플라밍고, LINQ, 사하라 등)을 이어요. 단, 베네시안 엑스포는 가지 않아요. 등록할 때 모노레일 패스를 사면 CES 배지가 승차권이 돼요
• 무료 셔틀: 1월 5~9일 공식 호텔 ↔ LVCC·베네시안 엑스포
• 테크 익스프레스(9번 노선): LVCC ↔ 베네시안 엑스포
• LVCC 루프(지하 터널 차량): 전시홀 사이 무료
• LVCC와 베네시안 엑스포에는 일반 주차장이 없어요

💡 하루에 한 구역(캠퍼스)씩 보는 게 이동 시간을 가장 아끼는 방법이에요.`,
        links: [
          { label: "CES 공식 — 교통 안내", url: "https://www.ces.tech/attendee-guides/transportation/" },
          { label: "라스베이거스 모노레일", url: "https://www.lvmonorail.com/" },
        ],
      },
      {
        title: "알차게 보는 팁",
        image_url: "/stories/ces-3.jpg",
        image_credit: "293.xx.xxx.xx · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Las_Vegas_Monorail_-_Las_Vegas_Convention_Center_Station.jpg",
        content: `• 공식 앱·지도로 꼭 볼 부스를 미리 표시해 두기
• 편한 신발은 필수 — 하루 2만 보는 기본이에요
• 1월 라스베이거스는 아침저녁이 쌀쌀해요. 실내는 냉방이 세서 얇은 겉옷 챙기기
• 정부·지자체가 꾸리는 한국 공동관도 매년 열려요 — 한국 스타트업을 한곳에서 보기 좋아요
(사진은 모노레일 LVCC 역과 전시장을 잇는 다리)`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "현장 분위기는 출장 브이로그로 미리 보고, 등록·일정은 반드시 공식 사이트 기준으로 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=QKvSO8t6gWg", title: "라스베가스 CES 출장 vlog (허성범 Horang)" },
          { url: "https://www.youtube.com/watch?v=t93UxehCXiE", title: "CES 2026 KAIST 서포터즈 브이로그 (KAIST)" },
        ],
        links: [
          { label: "CES 공식 사이트", url: "https://www.ces.tech/" },
          { label: "Visit Las Vegas (라스베이거스 관광청)", url: "https://www.visitlasvegas.com/" },
          {
            label: "표지 사진 출처 — Xuthoria · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:CES_2025_-_LVCC_01.jpg",
          },
        ],
      },
    ],
  },

  // ── 앙시 + 세계 4대 애니메이션 페스티벌 ──────────────────────────
  {
    title: "[Pothos 에디터] 앙시 국제 애니메이션 페스티벌, 그리고 세계 4대 애니메이션 페스티벌",
    subtitle: "호숫가 마을의 애니메이션 축제 — 2027년 6월 13~19일",
    destination: "앙시",
    cover_image_url: "/stories/annecy-1.jpg",
    intro:
      "프랑스 알프스 자락의 호숫가 마을 앙시(안시)는 매년 6월 전 세계 애니메이션 작가와 팬이 모이는 '애니메이션의 칸'이 돼요. 일반 관객도 즐길 수 있는 방법과 가는 길, 그리고 앙시와 함께 손꼽히는 자그레브·오타와·히로시마 페스티벌까지 한 번에 정리했어요.",
    duration_text: "4박 6일",
    tags: ["앙시", "애니메이션", "프랑스", "영화제"],
    sections: [
      {
        title: "앙시 페스티벌 2027 — 언제",
        image_url: "",
        content: `2027년 앙시 국제 애니메이션 페스티벌은 6월 13일~19일, 함께 열리는 애니메이션 마켓(MIFA)은 6월 15일~18일이에요(공식 사이트 기준).

• 1960년 앙시에서 처음 열렸고, 1990년대 말부터 매년 열리고 있어요
• 장편·단편·TV·학생 작품 경쟁 부문과 마켓이 함께 열려 업계 사람들도 많이 찾아요
(표지 사진: 티우 운하 위의 팔레 드 릴, 앙시 구시가지)`,
        links: [{ label: "앙시 페스티벌 공식", url: "https://www.annecyfestival.com/" }],
      },
      {
        title: "일반 관객은 어떻게 즐기나",
        image_url: "/stories/annecy-4.jpg",
        image_credit: "Guilhem Vellut · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Le_Paquier_@_Annecy_(34660192114).jpg",
        content: `업계 관계자가 아니어도 즐길 수 있어요. 공식 안내 기준으로 정리하면,

• 무료 야외 상영: 매일 밤 호숫가 잔디밭 '르 파키에'(사진)에서 누구나 무료로 볼 수 있어요
• 개별 티켓: 시내 극장(Pathé Annecy 등)에서 온라인 또는 상영 30분 전 현장 구매
• 페스티벌 일반 관객 등록(Festival Accreditation): 해외 거주자도 신청 가능. 2026년엔 시기별 85~110유로였고 수요가 많아 일찍 마감됐어요 — 2027년 가격은 아직 발표 전
• 상영 예약은 6월 초에 열리고, 예약한 상영은 45분 전 도착 권장

💡 등록이 마감돼도 야외 상영·전시·사인회 같은 무료 프로그램만으로 충분히 축제 분위기를 즐길 수 있어요.`,
        links: [{ label: "앙시 페스티벌 — 일반 관객 참여 방법", url: "https://www.annecyfestival.com/en/take-part/accreditations/general-public" }],
      },
      {
        title: "앙시 가는 길과 즐길 거리",
        image_url: "/stories/annecy-3.jpg",
        image_credit: "Guilhem Vellut · CC BY 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Lac_d%27Annecy_@_Panorama_du_Rocher_du_Roux_@_Talloires-Montmin_(51220488217).jpg",
        content: `앙시는 스위스 제네바 공항에서 약 50km 떨어져 있어 제네바로 들어가는 게 가장 가까워요. 파리에서는 앙시까지 바로 가는 TGV가 있어요(앙시 관광청 안내). 페스티벌 기간엔 제네바 공항 ↔ 앙시 셔틀도 운영돼요.

상영 사이사이엔
• 운하가 흐르는 구시가지 산책 (다음 사진)
• 맑기로 유명한 앙시 호수에서 유람선·수영·자전거
• 호숫가 전망대에서 내려다보는 알프스 풍경 (사진)`,
        links: [{ label: "앙시 호수 관광청", url: "https://www.lac-annecy.com/" }],
      },
      {
        title: "저녁의 앙시 구시가지",
        image_url: "/stories/annecy-2.jpg",
        image_credit: "Florian Pépellin · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Canal_du_Thiou_dans_le_vieil_Annecy_en_soir%C3%A9e_(ao%C3%BBt_2019).JPG",
        content: `'알프스의 베네치아'라고 불리는 구시가지는 저녁이 특히 예뻐요. 운하 옆 테라스에서 저녁을 먹고 야외 상영장으로 걸어가는 게 앙시 페스티벌의 하루예요.

• 페스티벌 기간엔 숙소가 매우 빨리 차요 — 일정이 정해지면 바로 예약
• 6월은 해가 길어 밤 9~10시까지 밝아요`,
      },
      {
        title: "세계 4대 애니메이션 페스티벌 ① 자그레브",
        image_url: "/stories/annecy-zagreb.jpg",
        image_credit: "Nikolai Karaneschev · CC BY 3.0 · Wikimedia Commons",
        image_credit_url:
          "https://commons.wikimedia.org/wiki/File:Zagreb_2015_-_Zagreba%C4%8Dka_katedrala_-_pogled_s_Gornjeg_Grada_(Zagreb_Cathedral_-_view_from_Upper_Town)_-_panoramio.jpg",
        content: `앙시, 자그레브, 오타와, 히로시마는 흔히 '세계 4대 애니메이션 페스티벌'로 불려요. 자그레브 애니마페스트도 공식 소개에서 앙시·오타와·히로시마와 함께 '꼭 거쳐야 할 페스티벌'로 자신을 소개해요.

애니마페스트 자그레브 (크로아티아)
• 1972년 시작, 2015년부터 매년 열려요
• 2027년: 제37회, 6월 7~12일 — 앙시 바로 전 주라 두 축제를 이어서 보는 일정도 가능해요
(사진: 자그레브 윗마을에서 본 대성당)`,
        links: [{ label: "애니마페스트 자그레브 공식", url: "https://www.animafest.hr/en" }],
      },
      {
        title: "② 오타와 국제 애니메이션 페스티벌",
        image_url: "/stories/annecy-ottawa.jpg",
        image_credit: "David Samuel · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Parliament_Hill,_Ottawa.jpg",
        content: `캐나다 수도 오타와에서 1976년부터 열려 온 애니메이션 페스티벌로, 매년 9월 닷새 동안 열려요.

• 2027년: 9월 22~26일 (공식 사이트 기준)
• 가을 단풍이 시작될 무렵이라 캐나다 단풍 여행과 함께 계획하기 좋아요
(사진: 오타와 국회의사당 언덕)`,
        links: [{ label: "오타와 국제 애니메이션 페스티벌 공식", url: "https://www.animationfestival.ca/" }],
      },
      {
        title: "③ 히로시마 — 지금은 '히로시마 애니메이션 시즌'",
        image_url: "/stories/annecy-hiroshima.jpg",
        image_credit: "Syced · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:JMS_Aster_Plaza.jpg",
        content: `1985년 시작된 히로시마 국제 애니메이션 페스티벌은 2020년 제18회를 끝으로 막을 내렸어요. 대신 2022년부터 '히로시마 애니메이션 시즌'이 2년마다 8월에 열리고 있어요(공식 사이트 기준, 2026년은 8월 19~23일).

• 주 행사장은 JMS 아스테르 플라자 (사진)
• 다음 행사 일정은 아직 발표 전이에요 — 공식 사이트에서 확인하세요
• 옛 '4대 페스티벌'의 히로시마 자리는 이 행사가 잇고 있다고 보면 돼요`,
        links: [
          { label: "히로시마 애니메이션 시즌 공식", url: "https://animation.hiroshimafest.org/" },
          { label: "히로시마 국제 애니메이션 페스티벌 아카이브", url: "https://hiroanim.org/" },
        ],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "페스티벌 프로그램과 등록 일정은 해마다 바뀌어요. 출발 전 각 공식 사이트에서 최신 정보를 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=EksP5kisvQ0", title: "2026 프랑스 안시 애니메이션 페스티벌 초청 방문 후기 (문은주 애니메이션)" },
          { url: "https://www.youtube.com/watch?v=NJ0yZ_YNZgk", title: "프랑스 사람들은 파리에서 안 놀아요 — 안시 (EBS 세계테마기행)" },
        ],
        links: [
          {
            label: "표지 사진 출처 — Tournasol7 · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Palais_de_l%27Isle_in_Annecy_04.jpg",
          },
        ],
      },
    ],
  },

  // ── 우유니 ──────────────────────────
  {
    title: "[Pothos 에디터] 우유니 소금사막, 세상에서 가장 큰 거울을 만나는 법",
    subtitle: "우기의 거울과 건기의 소금 육각형 — 시기·가는 법·투어·고산병까지",
    destination: "우유니",
    cover_image_url: "/stories/uyuni-1.jpg",
    intro:
      "볼리비아 남서부의 우유니 소금사막(살라르 데 우유니)은 면적이 약 1만 582㎢에 이르는 세계에서 가장 큰 소금 평원이에요. 해발 약 3,656m 고원에 있고, 비가 내린 뒤 얇게 물이 고이면 하늘이 그대로 비치는 '세상에서 가장 큰 거울'이 돼요. 언제 가야 하는지, 어떻게 들어가는지, 어떤 투어를 고르면 좋은지 여행 전에 알아둘 것들을 정리했어요.",
    duration_text: "2박 3일",
    tags: ["우유니", "볼리비아", "소금사막", "남미여행", "버킷리스트"],
    sections: [
      {
        title: "언제 갈까 — 거울의 우기, 육각형의 건기",
        image_url: "/stories/uyuni-2.jpg",
        image_credit: "Dan Lundberg · CC BY-SA 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:20170809_Bolivia_1521_Uyuni_sRGB_(37926739616).jpg",
        content: `우유니는 계절에 따라 완전히 다른 얼굴을 보여줘요.

• 우기(대략 12~4월): 비가 내리면 소금 평원 위에 얕게 물이 고여 하늘이 비치는 '거울' 풍경을 볼 수 있어요. 다만 물이 고이는 정도와 위치는 해마다, 날마다 달라요. 비가 많이 오면 차량이 들어갈 수 있는 구역이 줄어들기도 해요
• 건기(우기를 뺀 나머지 시기): 물이 마르면 사진처럼 소금 결정이 육각형 무늬를 이루는 새하얀 평원이 끝없이 펼쳐져요. 차로 소금사막 깊숙이 달릴 수 있어 섬·호수를 잇는 장거리 투어를 하기에 좋아요

기온은 낮에는 온화한 편이지만 밤에는 1년 내내 춥고, 영하로 떨어지는 날도 많아요.

💡 거울 풍경이 목적이라면 우기에, 끝없는 하얀 평원과 장거리 투어가 목적이라면 건기에 맞춰 보세요. 그해 물 상태는 출발 직전 현지 투어사에 물어보는 게 가장 정확해요.`,
      },
      {
        title: "어떻게 갈까 — 라파스·칠레에서 들어가는 길",
        image_url: "",
        content: `우유니 마을이 소금사막 여행의 출발점이에요. 들어가는 방법은 크게 세 가지예요.

• 비행기: 라파스(엘알토 국제공항)에서 우유니 공항(조야 안디나 공항, UYU)까지 볼리비아 국영항공 BoA가 운항해요. 비행시간은 1시간 안팎이고, 운항 편수·시간은 시기에 따라 달라요
• 버스: 라파스 등에서 우유니로 가는 장거리 버스가 있어요. 밤새 달리는 야간버스도 있어 하룻밤 숙박을 대신할 수 있어요. 회사·노선마다 좌석 등급과 시간이 다르니 미리 비교하세요
• 칠레와 연결: 우유니에서 출발해 라군(호수) 지대를 지나 마지막 날 칠레 산페드로데아타카마에서 끝나는 2박 3일 투어가 있어요. 칠레 쪽에서 출발하는 상품도 있는지는 현지 투어사에 확인하세요

💡 우유니 공항과 마을은 해발 3,600m가 넘는 고지대예요. 저지대에서 바로 날아오면 고산병이 오기 쉬우니, 라파스 등에서 하루 이틀 적응한 뒤 이동하는 일정이 몸에 덜 무리가 가요.`,
        links: [{ label: "BoA 볼리비아 국영항공", url: "https://www.boa.bo/" }],
      },
      {
        title: "투어 고르기 — 일출·당일·일몰·별빛, 그리고 2박 3일",
        image_url: "/stories/uyuni-3.jpg",
        image_credit: "kallerna · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Isla_Incahuasi_Uyuni_2018.jpg",
        content: `소금사막은 넓고 길 표시가 없어서, 대부분 우유니 마을의 투어사를 통해 4륜구동 차량으로 둘러봐요. 시간대·기간별로 고르면 돼요.

• 일출·일몰 투어: 하늘색이 가장 극적으로 변하는 시간이라 거울 사진을 노리는 사람들에게 인기예요
• 별빛 투어: 밤하늘이 맑고 물이 고여 있으면 별까지 수면에 비쳐요. 한밤 기온이 매우 낮으니 방한이 필수예요
• 당일(데이) 투어: 마을 근처 '기차 무덤'(폐기된 열차들이 모인 곳으로 마을에서 약 3km), 소금 호텔, 사진 속 잉카와시 섬(거대한 선인장이 자라는 소금사막 한가운데 섬) 등을 하루에 둘러봐요
• 2박 3일 투어: 소금사막을 지나 남쪽 고원의 호수 지대로 내려가요. 붉은 호수 라구나 콜로라다 등을 거쳐 우유니로 돌아오거나 칠레 국경에서 끝나는 코스가 일반적이에요

💡 투어사마다 차량 상태·인원·식사·숙소 수준이 달라요. 후기를 꼼꼼히 비교하고, 국립공원 입장료와 장화 대여가 요금에 포함되는지 예약할 때 확인하세요.`,
      },
      {
        title: "붉은 호수와 플라밍고 — 남쪽 고원 라군 지대",
        image_url: "/stories/uyuni-4.jpg",
        image_credit: "Havardtl · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:James%27s_Flamingoes_in_Laguna_Colorada,_Bolivia.jpg",
        content: `2박 3일 투어의 하이라이트는 에두아르도 아바로아 안데스 동물 국립보호구역 안에 있는 라구나 콜로라다예요. 이름 그대로 붉은빛을 띠는 호수로, 해발 약 4,278m에 있어요.

• 이 호수에는 제임스 플라밍고가 가장 많고, 안데스 플라밍고·칠레 플라밍고도 함께 살아요
• 소금사막 자체도 여러 플라밍고 종의 주요 번식지로 알려져 있어요
• 우유니 마을보다 훨씬 높은 곳을 지나기 때문에 숙소가 춥고 시설이 소박한 경우가 많아요

💡 새들에게 너무 가까이 다가가지 말고 정해진 길을 지켜 주세요. 망원 렌즈나 스마트폰 줌이 있으면 훨씬 좋은 사진을 남길 수 있어요.`,
      },
      {
        title: "입국·건강·안전 — 출발 전 꼭 확인하세요",
        image_url: "",
        content: `볼리비아 입국 (2025년 12월 외교부 발표 보도 기준)
• 볼리비아는 2025년 12월 1일자 대통령령(Decreto Supremo 5497호)으로 대한민국을 비자 면제 그룹(Grupo I)으로 옮겼어요. 외교부 발표를 인용한 보도에 따르면 한국인은 2025년 12월 3일부터 관광 목적으로 비자 없이 입국할 수 있어요
• 허용 체류 기간, 여권 잔여 유효기간, 왕복 항공권 요구 여부 등 세부 조건은 외교부 해외안전여행이나 주한 볼리비아 대사관에서 출발 전 꼭 확인하세요
• 칠레로 넘어가는 투어라면 칠레 입국 조건도 따로 확인해야 해요

황열 예방접종 (미국 CDC 안내 기준)
• 미국 CDC 안내에 따르면 볼리비아는 입국 요건으로 만 1세 이상 모든 입국자에게 황열 예방접종을 요구한다고 되어 있어요(요건은 바뀔 수 있어요)
• 해발 2,300m 이상 지역만 여행한다면 접종 '권고' 대상은 아니지만, 입국 요건은 별개예요. 실제 적용 여부는 출발 전 외교부·대사관 안내로 확인하고, 접종했다면 예방접종 증명서(옐로카드)를 챙기세요. 접종은 출국 최소 10일 전에 국립검역소 등에서 받을 수 있어요

고산병
• 우유니 일대는 해발 3,600m 이상, 라군 지대는 4,000m가 넘어요. 두통·메스꺼움·어지러움이 생길 수 있어요
• 첫날은 무리하지 말고 천천히 움직이기, 물 자주 마시기, 술 줄이기
• 증상이 심해지면 고도를 낮추는 것이 가장 확실해요. 출국 전 병원에서 상담받는 것도 좋아요

돈과 안전
• 현지 통화는 볼리비아노(BOB)예요. 환전 여건과 카드 사용 가능 여부는 수시로 바뀌니 출발 직전 최신 정보를 확인하고, 소액 현금을 여유 있게 준비하세요
• 버스 터미널·시장 등 붐비는 곳에서는 소지품을 조심하세요

💡 외교부 해외안전여행 사이트에서 볼리비아의 최신 여행경보와 안전 공지를 함께 확인하세요.`,
        links: [
          { label: "외교부 해외안전여행", url: "https://www.0404.go.kr/" },
          { label: "미국 CDC — 볼리비아 여행 건강 정보", url: "https://wwwnc.cdc.gov/travel/destinations/traveler/none/bolivia" },
          {
            label: "Korea Times — 볼리비아 한국인 무비자 시행 보도",
            url: "https://www.koreatimes.co.kr/foreignaffairs/20251203/korea-added-to-bolivias-visa-waiver-program-starting-this-week-foreign-ministry",
          },
        ],
      },
      {
        title: "준비물과 사진 팁 — 원근법·거울 샷",
        image_url: "/stories/uyuni-5.jpg",
        image_credit: "Mario Falcetti · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Bolivia_-_Salar_de_Uyuni_-_Wiki_Commons.jpg",
        content: `챙기면 좋은 것
• 선글라스·자외선 차단제·모자: 고도가 높고 하얀 소금이 햇빛을 반사해 눈과 피부가 쉽게 상해요
• 따뜻한 겉옷·장갑·비니: 일출·별빛 투어와 고원 숙소는 매우 추워요
• 장화: 우기 거울 투어에선 물에 들어가야 해요. 투어에 대여가 포함되는지 확인하고, 없으면 따로 준비하세요
• 보조배터리·여분 메모리: 추위에 배터리가 빨리 닳아요
• 립밤·보습제, 상비약(두통약 등)

사진 팁
• 원근법 사진: 끝없이 평평한 하얀 바닥 덕분에 가까운 물건과 멀리 있는 사람이 같은 크기로 보여요. 카메라를 바닥 가까이 낮추고, 소품(장난감·병·신발 등)을 활용해 보세요
• 거울 샷: 바람이 없고 물이 잔잔할 때 반영이 가장 선명해요. 일출 직후·일몰 무렵처럼 바람이 잦아드는 시간을 노리세요
• 수평선을 화면 한가운데 두면 위아래가 대칭인 사진을 얻을 수 있어요
• 소금물은 카메라에 해로워요. 렌즈 천을 챙기고 사용 뒤엔 장비를 잘 닦아 주세요

💡 사진처럼 차량과 사람이 수면에 그대로 비치려면 물이 얕고 잔잔해야 해요. 그날의 물 상태가 사진을 좌우해요.`,
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "실제 풍경과 투어 분위기는 영상으로 미리 보고, 입국 조건과 항공 일정은 반드시 공식 안내 기준으로 확인하세요.",
        videos: [
          {
            url: "https://www.youtube.com/watch?v=E4i3b1xz8l4",
            title: "초현실적 감동, 볼리비아 여행! 우유니 소금 사막, 달의 계곡, 사하마 국립공원 — 걸어서 세계속으로 (KBS 다큐)",
          },
          {
            url: "https://www.youtube.com/watch?v=cMggeGCYIUA",
            title: "세상에서 가장 큰 거울을 아시나요? 우유니 소금 사막 — 세계테마기행 (EBS)",
          },
          { url: "https://www.youtube.com/watch?v=F3gshg2m-hY", title: "우유니 소금 사막 로드 트립 【아메리카34】 (빠니보틀 Pani Bottle)" },
        ],
        links: [
          { label: "외교부 해외안전여행 — 국가별 안전정보", url: "https://www.0404.go.kr/" },
          { label: "BoA 볼리비아 국영항공", url: "https://www.boa.bo/" },
          { label: "미국 CDC — 볼리비아 여행 건강 정보", url: "https://wwwnc.cdc.gov/travel/destinations/traveler/none/bolivia" },
          {
            label: "표지 사진 출처 — SqueakyMarmot · CC BY-SA 2.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Sunset_at_Salar_de_Uyuni_-_23421270294.jpg",
          },
        ],
      },
    ],
  },

  // ── 파리 (매력) ──────────────────────────
  {
    title: "[Pothos 에디터] 파리가 매력적인 이유, 천천히 걸어야 보이는 것들",
    subtitle: "카페 테라스, 파사주, 센강 헌책방, 운하 산책, 저녁 미술관",
    destination: "파리",
    cover_image_url: "/stories/paris-charm-1.jpg",
    intro:
      "에펠탑과 루브르를 이미 봤다면, 이제 파리는 '천천히' 볼 차례예요. 동네 빵집과 카페 테라스, 유리 지붕 아래 숨은 파사주, 센강 변의 초록 헌책방, 운하를 따라 걷는 오후, 사람이 줄어든 저녁 미술관까지 — 두 번째 파리, 혹은 현지인처럼 머물고 싶은 분들을 위해 공식 안내를 바탕으로 정리했어요.",
    duration_text: "3박 5일",
    tags: ["파리", "프랑스", "유럽여행", "미술관", "산책"],
    sections: [
      {
        title: "카페 테라스와 동네 빵집 — 파리의 하루가 시작되는 곳",
        image_url: "",
        content: `파리 사람들의 일상은 거리 쪽으로 의자를 놓은 카페 테라스와 동네 빵집(불랑주리)에서 시작돼요. 표지 사진처럼 생앙드레데자르 광장 같은 작은 광장 카페에 앉아 커피 한 잔으로 오전을 보내는 것만으로도 '파리에 왔다'는 기분이 들어요.

• 프랑스의 바게트 장인 기술과 문화는 2022년 유네스코 인류무형문화유산에 올랐어요
• 파리시는 매년 '최고의 전통 바게트 대회(Grand Prix de la baguette de tradition française)'를 열어요. 2026년 제33회 우승은 14구 디도 거리(103, rue Didot)의 빵집 '푸르닐 디도(Fournil Didot)'였어요 (2026년 11월 확인)
• 바게트를 살 땐 '트라디시옹(tradition)'을 달라고 하면 전통 방식으로 구운 바게트를 받을 수 있어요

💡 카페는 테라스·실내·바 카운터 자리에 따라 가격이 다를 수 있어요. 메뉴판을 먼저 확인하세요.`,
        links: [
          {
            label: "파리시 — 2026 최고의 바게트 발표 (프랑스어)",
            url: "https://www.paris.fr/pages/la-meilleure-baguette-de-paris-2026-se-deguste-dans-le-14e-arrondissement-34064",
          },
          {
            label: "유네스코 — 바게트 장인 기술과 문화",
            url: "https://ich.unesco.org/en/RL/artisanal-know-how-and-culture-of-baguette-bread-01883",
          },
        ],
      },
      {
        title: "유리 지붕 아래 19세기 — 파사주 산책",
        image_url: "/stories/paris-charm-2.jpg",
        image_credit: "Benh LIEU SONG · CC BY-SA 2.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Galerie_Vivienne,_12_March_2015.jpg",
        content: `파사주(passage couvert)는 건물 사이를 유리 지붕으로 덮어 만든 19세기의 실내 상점가예요. 비 오는 날에도 젖지 않고 걸을 수 있어, 파리지앵의 '비 오는 날 산책 코스'로도 꼽혀요.

갤러리 비비엔(Galerie Vivienne) — 공식 안내 기준
• 1823년 건축가 프랑수아 장 델라누아의 설계로 지어졌고, 1974년부터 역사기념물로 등록돼 있어요
• 모자이크 바닥, 유리 천장, 오래된 서점과 찻집이 어우러진 곳이에요 (사진)
• 입장 무료, 매일 아침부터 저녁(8시 무렵)까지 열어요. 다만 안의 상점은 더 일찍 닫는 곳이 많아요
• 입구: 4, rue des Petits-Champs / 5-7, rue de la Banque / 6, rue Vivienne (2구)

근처 2구 일대에는 파사주 데 파노라마(Passage des Panoramas) 등 다른 파사주도 모여 있어 이어서 걷기 좋아요.

💡 상점 구경이 목적이라면 오전 늦게~오후 이른 시간에 가세요. 사진이 목적이라면 사람이 적은 아침이 좋아요.`,
        links: [{ label: "갤러리 비비엔 공식 (프랑스어)", url: "https://www.galerie-vivienne.com/" }],
      },
      {
        title: "센강의 초록 상자 — 부키니스트와 생루이섬",
        image_url: "/stories/paris-charm-3.jpg",
        image_credit: "Benh LIEU SONG · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Paris_75005_Quai_de_Montebello_Bouquinistes_20071014.jpg",
        content: `센강 둑 위에 줄지어 선 초록색 상자들, 바로 부키니스트(bouquinistes)라 불리는 노천 헌책방이에요. 오래된 책, 옛 신문, 포스터와 엽서를 팔아요 (사진은 5구 몽테벨로 강변).

파리시 안내 기준
• 오른쪽 강변은 마리 다리(pont Marie)~예술의 다리(pont des Arts), 왼쪽 강변은 쉴리 다리(pont Sully)~루아얄 다리(pont Royal) 사이에 약 3km에 걸쳐 있어요
• 상자 색은 '바공 그린(vert wagon)'이라는 같은 초록색으로 통일돼 있어요
• 2019년 '센강 부키니스트의 전통과 기술'이 프랑스 무형문화유산 목록에 올랐어요. 흔히 유네스코 유산으로 오해하지만, 유네스코 세계유산(1991년)은 '파리의 센강 변' 전체이고 부키니스트 자체는 아직 유네스코 목록에 없어요

책방 구경을 마쳤다면 다리를 건너 생루이섬(Île Saint-Louis)으로 가 보세요. 시테섬 바로 옆의 작은 섬으로, 오래된 건물과 조용한 골목, 작은 가게들이 있어 천천히 한 바퀴 돌기 좋아요.

💡 부키니스트는 날씨와 상인 사정에 따라 문을 열지 않는 날이 많아요. 맑은 날 오후에 가는 게 가장 확실해요.`,
        links: [
          { label: "파리시 — 부키니스트 이야기 (프랑스어)", url: "https://www.paris.fr/pages/les-bouquinistes-et-paris-histoire-d-amour-en-majuscules-7886" },
        ],
      },
      {
        title: "생마르탱 운하와 공원 — 현지인처럼 쉬어 가기",
        image_url: "/stories/paris-charm-4.jpg",
        image_credit: "DimiTalen · CC0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Canal_Saint-Martin_from_Quay_de_Valmy,_Paris,_2016.jpg",
        content: `관광지 대신 파리 사람들이 쉬는 곳에 가 보고 싶다면 10구의 생마르탱 운하(Canal Saint-Martin)를 추천해요. 가로수 늘어선 물길을 따라 철제 아치 보행교와 수문이 이어지고, 날이 좋으면 운하 가장자리에 앉아 쉬는 사람들로 붐벼요 (사진은 발미 강변).

• 운하 주변에는 작은 카페·빵집·편집숍이 많아 오후 산책 코스로 좋아요
• 수문이 열리고 닫히며 배가 지나가는 모습도 볼거리예요

공원도 파리를 느끼기 좋은 곳이에요.
• 뤽상부르 정원(Jardin du Luxembourg): 초록 철제 의자에 앉아 책을 읽거나 해바라기하는 사람들이 많아요
• 튈르리 정원(Jardin des Tuileries): 루브르와 콩코르드 광장 사이에 있어, 바로 옆 오랑주리 미술관과 묶기 좋아요

💡 11월 이후 파리는 해가 일찍 지고 쌀쌀해요. 야외 산책은 낮 시간에, 저녁엔 다음 섹션의 미술관 야간 개장을 노려 보세요.`,
      },
      {
        title: "미술관은 저녁에 — 오르세 목요일, 오랑주리 금요일",
        image_url: "/stories/paris-charm-5.jpg",
        image_credit: "Ibex73 · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Grande_Horloge_int%C3%A9rieure_de_la_Gare_d%27Orsay_(Paris)_2023.jpg",
        content: `두 번째 파리라면 미술관도 '덜 붐비는 시간'에 가 보세요. 낮보다 한결 여유로워요.

오르세 미술관 — 옛 기차역 건물을 바꾼 인상주의의 보고예요 (사진은 역 시절의 대형 시계)
• 월요일 휴관, 평소 9:30~18:00
• 목요일은 21:45까지 야간 개장 (마지막 입장 21:00)
• 목요일 저녁에는 야간 요금이 따로 있어요. 운영 시간·요금은 바뀔 수 있으니 출발 전 공식 사이트에서 확인하세요

오랑주리 미술관 — 튈르리 정원 안, 모네의 대형 '수련' 연작을 볼 수 있어요
• 화요일 휴관, 9:00~18:00 (마지막 입장 17:15)
• 일반 입장권 온라인 12.5유로 / 현장 11유로
• 전시 기간 금요일은 21시까지 야간 개장(온라인 10유로)
• 특별전 '모네, 그리는 시간(Monet, Painting time)'이 2027년 1월 25일까지 열려요
• 현장에서 오르세+오랑주리 통합권(20유로)도 팔아요 (2026년 11월 확인)

퐁피두 센터는 지금 문을 닫았어요. 2025년 9월 22일부터 대규모 리노베이션으로 건물 전체가 휴관 중이고, 재개관은 2030년 목표예요. 그동안 그랑 팔레 등 파리 곳곳의 협력 기관에서 소장품 전시를 이어 가요.

💡 오르세·오랑주리 모두 매월 첫째 일요일은 누구나 무료지만, 온라인 시간 예약이 필수예요. 예약이 빨리 마감되니 서두르세요.`,
        links: [
          { label: "오르세 미술관 관람 안내 (공식)", url: "https://www.musee-orsay.fr/en/visit" },
          { label: "오랑주리 미술관 관람 안내 (공식)", url: "https://www.musee-orangerie.fr/en/visit-orangerie" },
          { label: "퐁피두 센터 리노베이션 안내 (공식)", url: "https://www.centrepompidou.fr/en/centre-pompidou-is-transforming-itself" },
        ],
      },
      {
        title: "근교 당일치기와 실전 팁",
        image_url: "",
        content: `베르사유 궁전 — 공식 안내 기준 (2026년 11월 확인)
• 월요일 휴관
• 비수기(11월 2일~3월 31일) 궁전 9:00~17:30, 마지막 입장 16:45
• 겨울철 첫째 일요일엔 영지 전체를 무료로 개방해요. 해당 월과 조건은 공식 사이트에서 꼭 확인하고, 무료일에도 궁전은 시간 예약이 필수예요

지베르니 모네의 집과 정원
• 매년 4월 1일~11월 1일에만 문을 열어요(10:00~18:00, 마지막 입장 17:30). 2026년 시즌은 끝났으니, 수련 연못을 보고 싶다면 내년 봄 이후 일정을 공식 사이트에서 확인하세요
• 겨울 여행이라면 파리 시내 오랑주리의 '수련'으로 아쉬움을 달래 보세요

교통
• 메트로·RER 1회권은 2.55유로예요 (2026년 1월 인상 기준 — 요금은 출발 전 공식 안내에서 확인하세요)
• 종이 티켓(카르네)은 판매가 끝났어요. 나비고 이지(Navigo Easy) 카드나 공식 앱에 충전해서 쓰는 방식이에요

박물관 패스
• 파리 뮤지엄 패스는 2·4·6일권이 있고, 여러 미술관·기념물을 줄 서지 않고 들어갈 수 있어요. 가격과 포함 시설은 바뀔 수 있으니 공식 사이트에서 확인하고, 시간 예약이 따로 필요한 곳이 있는지도 함께 보세요

소매치기 주의
• 메트로 안, 관광지 계단, 카페 테라스 테이블 위 휴대폰이 특히 표적이 돼요
• 가방은 지퍼 달린 크로스백을 앞으로 메고, 서명·설문을 요청하며 다가오는 사람은 피하세요

💡 미술관 휴관일이 제각각이에요(오르세 월요일, 오랑주리 화요일, 베르사유 월요일). 요일별로 동선을 짜면 헛걸음을 줄일 수 있어요.`,
        links: [
          { label: "베르사유 궁전 관람 안내 (공식)", url: "https://en.chateauversailles.fr/plan-your-visit/practical-information" },
          { label: "지베르니 클로드 모네 재단 (공식)", url: "https://claudemonetgiverny.fr/en/" },
          { label: "파리 뮤지엄 패스 (공식)", url: "https://www.parismuseumpass.fr/" },
          { label: "일드프랑스 모빌리테 — 2026 교통 요금 (프랑스어)", url: "https://www.iledefrance-mobilites.fr/tarifs-titre-de-transport-en-commun-2026" },
        ],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "미술관은 작품 배경을 알고 가면 훨씬 재밌어요. 영상으로 미리 공부하고, 운영 시간·예약은 반드시 공식 사이트에서 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=LkKaDJxGgrc", title: "오르세 미술관! 이 다섯 가지만 알고 가면 됩니다 [김찬용 | Musée d'Orsay] (토커바웃아트)" },
          {
            url: "https://www.youtube.com/watch?v=FYTUAMXs8uY",
            title: "베토벤과 모네의 평행이론? 걸작 '수련'이 나오기까지의 클로드 모네의 역사 [미술 읽어드립니다 EP.26] | 양정무 교수 (사피엔스 스튜디오)",
          },
          {
            url: "https://www.youtube.com/watch?v=aD1TacBOv50",
            title: "(sub)Vlog|🇫🇷 4월의 낭만 파리💐 컨셉은 파리지앵🥖 관광은 패스🗼 파리까지 가서 산책만 하는 브이로그[part.1] (민팅 minting)",
          },
        ],
        links: [
          { label: "파리 관광청", url: "https://parisjetaime.com/" },
          { label: "파리시 공식 사이트 (프랑스어)", url: "https://www.paris.fr/" },
          {
            label: "표지 사진 출처 — besopha · CC BY 2.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Paris,_%C3%A0_la_terrasse_du_caf%C3%A9,_place_Saint-Andr%C3%A9-des-Art,_2020.jpg",
          },
        ],
      },
    ],
  },

  // ── 상하이 ──────────────────────────
  {
    title: "[Pothos 에디터] 상하이에서 만나는 대한민국의 흔적, 임시정부의 길을 따라",
    subtitle: "마당로 임시정부 청사부터 루쉰 공원 매헌까지, 2박 3일 역사 + 도시 여행",
    destination: "상하이",
    cover_image_url: "/stories/shanghai-1.jpg",
    intro:
      "상하이는 대한민국 임시정부가 처음 문을 연 도시예요. 1919년 4월 '대한민국'이라는 국호가 처음 정해진 곳도, 1932년 4월 29일 윤봉길 의사가 의거를 일으킨 곳도 모두 상하이예요. 화려한 와이탄 야경 뒤편 옛 프랑스 조계의 골목에는 지금도 독립운동의 흔적이 남아 있어요. 임시정부 청사와 루쉰 공원 매헌을 중심으로, 예원·와이탄까지 묶은 2박 3일 동선과 출발 전 챙길 실용 정보를 정리했어요.",
    duration_text: "2박 3일",
    tags: ["상하이", "임시정부", "윤봉길", "역사여행", "중국무비자"],
    sections: [
      {
        title: "왜 상하이에 임시정부가 세워졌을까",
        image_url: "",
        content: `3·1운동 직후인 1919년 4월, 독립운동가들이 상하이에 모여 임시의정원을 열고 '대한민국'이라는 국호와 임시헌장을 정했어요. 정부가 수립된 날인 4월 11일은 지금 '대한민국 임시정부 수립 기념일'로 기리고 있어요.

당시 상하이 프랑스 조계는 일본의 영향력이 상대적으로 덜 미쳐 망명 인사들이 활동하기 좋은 곳이었어요. 임시정부는 이후 일제의 압박과 재정난 속에서 청사를 여러 번 옮겼고, 1932년 윤봉길 의거 뒤에는 상하이를 떠나 항저우·자싱·충칭 등으로 이동했어요.

• 1919년 4월 첫 임시의정원 회의가 열린 곳은 당시 '김신부로(金神父路, 현 루이진얼루 일대)'로 기록돼 있어요
• 상하이 황푸구는 진션푸로 22호(현 루이진얼루 50호) 건물을 '임시정부 탄생지 옛터'로 지정하고 안내판을 세웠어요. 다만 이 번지가 실제 회의 장소인지는 학계에서 아직 논의가 이어지고 있고, 내부 일반 공개 시설은 아니에요

💡 3·1절, 4월 11일, 4월 29일, 광복절 무렵에는 한국인 방문객과 기념 행사가 많아요. 조용히 둘러보고 싶다면 이 날짜를 살짝 피하는 것도 방법이에요.`,
        links: [
          { label: "국가보훈부", url: "https://www.mpva.go.kr/" },
          { label: "독립기념관", url: "https://www.i815.or.kr/" },
        ],
      },
      {
        title: "마당로 306롱 4호, 대한민국 임시정부 청사",
        image_url: "/stories/shanghai-2.jpg",
        image_credit: "Ericmetro · CC BY-SA 3.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Entrance_wall_of_Provisional_Government_of_ROK_in_Shanghai.JPG",
        content: `여행자들이 '상하이 임시정부 청사'라고 부르는 곳은 황푸구 마당로(马当路) 306롱 4호예요. 임시정부가 1926년부터 1932년까지 약 6년간 사용한 건물로, 1993년 일반에 공개된 뒤 2015년 광복 70주년에 맞춰 보수·재개관했어요. 2026년은 이 건물을 사용한 지 100년이 되는 해라 1월에 기념식이 열리기도 했어요. 사진은 입구 담장의 '대한민국 임시정부 유적지' 현판이에요.

좁은 석고문(石库门) 연립주택 안에 회의실과 김구 선생 집무실 등이 재현돼 있어요. 생각보다 공간이 작아서, 이 좁은 집에서 나라를 꾸려 갔다는 사실이 오히려 더 크게 다가와요.

관람 정보 (여행자 안내·현지 보도 기준이라 달라질 수 있어요)
• 입장료: 20위안 안팎으로 안내돼요
• 운영 시간: 대체로 오전 9시~오후 5시로 안내되지만, 점심 무렵 잠시 입장을 멈춘다는 안내도 있어요. 정확한 시간과 휴관일은 출발 전에 꼭 확인하세요
• 2026년 8월 1일~9월 14일에는 구조 보강 공사로 휴관했어요. 이처럼 예고 휴관이 있을 수 있으니 주상하이 총영사관 공지나 최신 뉴스를 확인하고 가세요
• 내부 대부분 구역은 사진 촬영이 제한돼요. 기념사진은 입구 현판 앞에서 찍는 게 일반적이에요
• 여권은 늘 지니고 다니세요 (중국은 관광지·숙소에서 신분 확인을 하는 경우가 많아요)

💡 지하철 10·13호선 신톈디(新天地)역에서 걸어서 몇 분 거리예요. 관람은 30분~1시간 정도면 충분해요.`,
        links: [
          { label: "주상하이 대한민국 총영사관", url: "https://overseas.mofa.go.kr/cn-shanghai-ko/index.do" },
        ],
      },
      {
        title: "1932년 4월 29일, 루쉰 공원과 매헌(梅軒)",
        image_url: "/stories/shanghai-3.jpg",
        image_credit: "钉钉 · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url:
          "https://commons.wikimedia.org/wiki/File:%E9%B2%81%E8%BF%85%E5%85%AC%E5%9B%AD%E5%86%85%E7%9A%84%E5%B0%B9%E5%A5%89%E5%90%89%E6%A2%85%E8%BD%A9%E4%BA%AD.jpg",
        content: `1932년 4월 29일, 한인애국단 단원 윤봉길 의사는 훙커우 공원(현 루쉰 공원)에서 열린 일본의 천장절 겸 상하이사변 전승 기념식장에 폭탄을 던졌어요. 이 의거로 상하이 파견군 사령관 시라카와 요시노리 등이 목숨을 잃거나 크게 다쳤고, 침체돼 있던 임시정부와 독립운동은 다시 힘을 얻게 됐어요. 윤 의사는 현장에서 붙잡혀 그해 12월 19일 일본 가나자와에서 순국했어요.

지금의 루쉰 공원 안 매화원(梅园)에는 윤 의사의 호 '매헌'을 딴 2층 기념관 매헌(梅轩)이 있어요. 1994년 '매정'이라는 이름으로 세워졌다가 이후 매헌으로 이름이 바뀌었고, 안에는 윤 의사의 생애를 보여 주는 전시가 있어요. 사진이 매화원 안의 매헌이에요.

• 입장료: 2026년 3월 현지 보도 기준, 매화원 산책로는 무료로 바뀌었고 매헌 전시관만 1인 15위안(현장 구매)이에요
• 운영 시간은 공식 안내를 찾지 못했어요. 현장에서 확인하세요
• 지하철 3·8호선 훙커우 축구장(虹口足球场)역에서 가까워요

💡 초봄에 가면 매화가 핀 매화원과 매헌을 함께 볼 수 있어요. 공원 안에는 루쉰 기념관과 루쉰 묘도 있어요.`,
      },
      {
        title: "신톈디와 옛 프랑스 조계 산책",
        image_url: "",
        content: `임시정부 청사는 상하이에서 가장 세련된 거리로 꼽히는 신톈디 바로 옆에 있어요. 신톈디는 20세기 초 상하이식 연립주택인 석고문(石库门) 골목을 카페·레스토랑·숍으로 고쳐 쓴 곳이라, 청사 건물과 같은 시대의 건축을 비교해 보는 재미가 있어요.

추천 동선
• 오전: 임시정부 청사 관람
• 점심: 신톈디에서 식사와 커피
• 오후: 옛 프랑스 조계(플라타너스 가로수 길)를 천천히 걷기 — 1919년 임시정부가 첫발을 뗀 루이진얼루 일대도 이 근처예요

💡 청사 관람 시간이 짧아서, 신톈디·프랑스 조계 산책과 묶어 반나절 코스로 잡으면 딱 좋아요.`,
      },
      {
        title: "예원·와이탄·난징루, 상하이의 오늘",
        image_url: "/stories/shanghai-4.jpg",
        image_credit: "Chainwit. · CC BY 4.0 · Wikimedia Commons",
        image_credit_url:
          "https://commons.wikimedia.org/wiki/File:2024-Apr_Shanghai_Yu_Yuan_Garden_%E8%B1%AB%E5%9B%AD_-_img_20.jpg",
        content: `역사 여행 사이사이에 상하이의 대표 명소도 함께 둘러보세요. 사진은 예원 일대 연못과 정자, 뒤로 보이는 고층 빌딩이 옛 상하이와 지금의 상하이를 한 장에 담고 있어요.

• 예원·성황묘: 명나라 때 만든 강남 정원 예원과 그 주변 전통 상점가예요. 상점가는 자유롭게 걸을 수 있고, 정원 내부는 유료예요. 월요일에 정원을 닫는다는 현지 안내가 있으니 날짜를 확인하세요
• 와이탄(外滩): 황푸강 서쪽의 근대 서양식 건물 거리예요. 해 질 무렵부터 강 건너 푸둥의 동방명주·상하이 타워 야경을 보는 게 상하이 여행의 하이라이트예요 (표지 사진)
• 난징둥루: 와이탄에서 바로 이어지는 보행자 쇼핑 거리라 야경 전후로 걷기 좋아요

2박 3일 예시
• 1일차: 도착 → 난징둥루 → 와이탄 야경
• 2일차: 임시정부 청사 → 신톈디·프랑스 조계 → 예원·성황묘
• 3일차: 루쉰 공원 매헌 → 공항
3박 4일이라면 근교 수향마을이나 임시정부가 피신했던 자싱·항저우 유적을 하루 일정으로 더해 볼 수 있어요.`,
      },
      {
        title: "출발 전 실용 정보 — 무비자·결제·공항 이동",
        image_url: "",
        content: `무비자 입국 (2026년 11월 확인)
• 한국 일반 여권 소지자는 비자 없이 최대 30일까지 머물 수 있어요 (입국 다음 날부터 계산)
• 대상 목적: 관광, 비즈니스, 친지·교류 방문, 경유. 취업·유학·취재 등은 별도 비자가 필요해요
• 현재 공지된 시행 기간은 2026년 12월 31일까지예요. 2027년 이후 연장 여부는 아직 공식 발표를 확인하지 못했으니, 연말·연초 여행이라면 출발 직전 외교부·중국 대사관 공지를 꼭 확인하세요
• 외교부 안내 유의사항: 입국 목적·일정을 설명할 수 있게 준비하고, 숙소 주숙등기(호텔은 체크인 때 자동 처리) 의무와 체류 기한을 지키세요

결제
• 현지에서는 알리페이·위챗페이 같은 모바일 결제가 일상이에요. 두 앱 모두 해외 발급 비자·마스터카드를 연결해 쓸 수 있어요
• 200위안 이하 결제는 수수료가 면제되고, 그보다 큰 금액은 보통 3% 수수료가 붙어요 (2026년 기준 안내, 카드사 해외 수수료는 별도)
• 앱 설치와 여권 인증은 한국에서 미리 해 두고, 비상용 현금도 조금 챙기세요

푸둥 공항 → 시내
• 자기부상열차(마그레브): 푸둥 공항 ↔ 룽양루역 약 8분, 편도 50위안 안팎. 룽양루역에서 지하철로 갈아타야 시내로 들어가요. 운행은 대략 아침부터 밤 9시대까지라 늦은 도착이면 다른 수단을 이용하세요
• 지하철 2호선: 공항에서 바로 타고 난징둥루 등 시내로 한 번에 가요. 시간은 더 걸리지만 저렴해요

💡 중국에서는 일부 해외 앱·웹사이트 접속이 제한될 수 있어요. 지도·번역·메신저 앱은 출발 전에 현지에서 쓸 수 있는지 확인해 두세요.`,
        links: [
          { label: "외교부(주시안 총영사관) — 중국 비자면제 연장 및 유의사항", url: "https://www.mofa.go.kr/cn-xian-ko/brd/m_738/view.do?seq=1346727" },
          { label: "외교부 해외안전여행", url: "https://www.0404.go.kr/" },
        ],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "떠나기 전에 다큐멘터리로 임시정부와 윤봉길 의사의 이야기를 먼저 만나 보세요. 관람 시간·휴관 일정과 입국 규정은 반드시 공식 안내로 다시 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=n5B1K3tupck", title: "[광복80주년-걸세]임시정부의 흔적을 찾아 떠나다 #kbs여행 (KBS 트래블-걸어서 세계속으로)" },
          { url: "https://www.youtube.com/watch?v=HmOTlu38CPw", title: "윤봉길, 임시정부를 살리다 (KBS_2012.04.26.방송) (KBS 히스토리)" },
          { url: "https://www.youtube.com/watch?v=9x06DXSgWSc", title: "[랜선 역사탐방] ①상하이 와이탄과 임시정부 청사 (YTN korean)" },
        ],
        links: [
          { label: "주상하이 대한민국 총영사관", url: "https://overseas.mofa.go.kr/cn-shanghai-ko/index.do" },
          { label: "국가보훈부", url: "https://www.mpva.go.kr/" },
          { label: "외교부 해외안전여행", url: "https://www.0404.go.kr/" },
          {
            label: "표지 사진 출처 — King of Hearts · CC BY-SA 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Pudong_Shanghai_November_2017_HDR_panorama.jpg",
          },
        ],
      },
    ],
  },

  // ── 오스틴 ──────────────────────────
  {
    title: "[Pothos 에디터] 오스틴, 로보택시가 달리는 텍사스의 라이브 음악 도시",
    subtitle: "자율주행 택시부터 박쥐 다리, F1, SXSW까지 — 2026년 11월 기준 정리",
    destination: "오스틴",
    cover_image_url: "/stories/austin-1.jpg",
    intro:
      "텍사스의 주도 오스틴은 '세계 라이브 음악의 수도'를 내세우는 음악 도시이면서, 운전석이 빈 로보택시가 실제로 도심을 달리는 자율주행의 도시이기도 해요. 카우보이 부츠와 바비큐 같은 텍사스다운 풍경에, F1 그랑프리와 대학 풋볼, 매년 3월의 SXSW까지 더해져 볼거리가 많아요. 바뀌는 속도가 빠른 정보는 공식 안내 기준으로 확인한 시점을 함께 적었어요.",
    duration_text: "4박 6일",
    tags: ["오스틴", "텍사스", "자율주행", "SXSW", "F1"],
    sections: [
      {
        title: "로보택시 타보기 — 테슬라와 웨이모",
        image_url: "/stories/austin-2.jpg",
        image_credit: "Larry D. Moore · CC BY 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Gigafactory_Texas_Building_1_June_2022.jpg",
        content: `오스틴은 테슬라와 웨이모의 무인 택시를 한 도시에서 모두 탈 수 있는 몇 안 되는 곳이에요. 다만 서비스 지역·운영 방식이 몇 달 단위로 바뀌니, 아래 내용은 출발 직전에 앱에서 다시 확인하세요. (2026년 11월 확인)

테슬라 로보택시
• 2025년 6월 22일 초청받은 사람만 타는 시범 서비스로 시작했고, 이후 일반 이용자에게 열렸어요
• 전용 'Robotaxi' 앱에서 테슬라 계정으로 로그인해 호출해요
• 2026년 1월부터 일부 차량이 차 안에 안전요원 없이 운행하기 시작했어요. 지금도 안전요원이 타는 차와 타지 않는 차가 섞여 있고, 어떤 차가 올지는 고를 수 없어요
• 2026년 가을부터는 핸들·페달이 없는 '사이버캡'도 일부 구역에서 다니고 있어요
• 운행 시간과 서비스 구역(지오펜스)은 앱에 표시되는 범위가 기준이에요 — 출발지와 목적지가 모두 구역 안이어야 호출돼요

웨이모 (우버 앱으로 이용)
• 오스틴의 웨이모는 2025년 3월부터 우버 앱으로만 탈 수 있어요
• 서비스 구역 안에서 UberX·Uber Electric·Uber Comfort·Uber Comfort Electric을 부르면 웨이모가 배정될 수 있고, 배정되면 수락해야 탑승해요. 요금은 부른 차종과 같아요
• 운전석에 아무도 없는 완전 무인 운행이에요
• 2026년 9월 말부터 일부 구간에서 고속도로(MoPac, I-35 등) 주행이 시작됐고, 공항 오가는 구간은 아직 배정 대상이 아니라는 안내가 많아요

테슬라 기가팩토리 텍사스
• 오스틴 동쪽, 공항 너머 SH 130 고속도로 근처에 있는 거대한 공장이에요(사진)
• 일반 여행자가 예약해서 들어갈 수 있는 상시 공장 투어는 확인되지 않아요. 주변 도로에서 외관만 보는 정도로 생각하세요

💡 해외에서 만든 계정·카드로 앱 가입과 결제가 되는지는 한국에서 미리 확인해 두면 현지에서 헤매지 않아요.`,
        links: [
          { label: "우버 — Waymo on Uber 안내", url: "https://www.uber.com/blog/waymo-on-uber/" },
          { label: "테슬라 로보택시", url: "https://www.tesla.com/robotaxi" },
        ],
      },
      {
        title: "낮의 오스틴 — 주 의사당과 바턴 스프링스",
        image_url: "",
        content: `텍사스 주 의사당 (Texas State Capitol)
• 분홍빛 화강암으로 지은 웅장한 의사당이에요. 가이드 투어가 무료예요
• 월~토 오전 9시, 일요일 낮 12시부터 15~30분 간격으로 출발하고 마지막 투어는 오후 4시 15분, 약 40분 걸려요
• 의사당 1층 남쪽 로비(South Foyer)에서 출발해요 (2026년 11월 확인)

바턴 스프링스 풀 (Barton Springs Pool)
• 질커 공원 안에 있는 천연 샘물 수영장이에요. 수온이 1년 내내 섭씨 20~21도(화씨 68~70도) 안팎이에요
• 지금은 입장료를 받지 않고, 2027년 3월 13일부터 다시 유료로 바뀌어요 — 성인 비거주자 9달러
• 목요일은 청소 때문에 오전 9시~오후 7시 문을 닫아요. 그 밖의 날은 오전 5시~오후 10시 (2026년 11월 확인)

그 밖에
• 질커 공원: 레이디 버드 호수 옆 넓은 공원으로, 피크닉·카약 등 오스틴 사람들의 주말 놀이터예요
• 사우스 콩그레스(SoCo): 부티크와 카우보이 부츠 가게, 벽화가 모인 거리라 텍사스 기념품 쇼핑하기 좋아요`,
        links: [
          { label: "텍사스 주 의사당 투어 (State Preservation Board)", url: "https://tspb.texas.gov/plan/tours/tours.html" },
          { label: "오스틴시 — 바턴 스프링스 이용 안내", url: "https://www.austintexas.gov/services/visit-barton-springs" },
        ],
      },
      {
        title: "해 질 녘 박쥐, 밤에는 라이브 음악과 바비큐",
        image_url: "/stories/austin-3.jpg",
        image_credit: "Capvideo · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Congress_Avenue_Bats.jpg",
        content: `콩그레스 애비뉴 다리의 박쥐
• 다리 밑에 멕시코자유꼬리박쥐 약 150만 마리가 사는, 북미 최대 규모의 도시 박쥐 서식지로 꼽혀요
• 해 질 무렵 박쥐 떼가 줄지어 하늘로 날아올라요 (사진)
• 다리 남동쪽의 박쥐 관찰 잔디밭(Bat Observation Area)에서는 무료로 볼 수 있고, 다리 위 보도에서도 보여요
• 배를 타고 보는 박쥐 크루즈는 3~10월 운영하고 예약이 필요해요
• 비가 오면 잘 나오지 않아요

6번가·레이니 스트리트
• 6번가(Sixth Street)는 라이브 바와 클럽이 줄지어 있는 오스틴 밤 문화의 중심이에요
• 레이니 스트리트(Rainey Street)는 옛 주택을 고친 바들이 모인 거리라 조금 더 여유로운 분위기예요

텍사스 바비큐와 텍스멕스
• 프랭클린 바비큐(Franklin Barbecue): 화~일 오전 11시 문 열고 다 팔리면(보통 오후 2~3시) 끝, 월요일 휴무예요. 줄이 길어서 의자를 챙기거나 가게에서 빌려주는 의자를 쓰라고 안내해요. 홈페이지에서 미리 주문도 받아요 (2026년 11월 확인)
• 그 밖에도 유명 바비큐집이 시내 곳곳에 있어요 — 브리스킷(소 양지)이 대표 메뉴예요
• 아침엔 또띠야에 달걀·베이컨 등을 넣은 '브렉퍼스트 타코'가 오스틴식 아침 식사예요

💡 박쥐를 보고 바로 6번가로 걸어가면 저녁 일정이 자연스럽게 이어져요.`,
        links: [
          { label: "텍사스 공원·야생동물국 — 콩그레스 다리 박쥐", url: "https://tpwd.texas.gov/huntwild/wild/species/bats/bat-watching-sites/congress-avenue-bridge.phtml" },
          { label: "프랭클린 바비큐", url: "https://franklinbbq.com/" },
        ],
      },
      {
        title: "스포츠 명소 — F1부터 대학 풋볼까지",
        image_url: "/stories/austin-4.jpg",
        image_credit: "Formulanone · CC BY-SA 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:CircuitOfTheAmericasAerial-July2015.jpg",
        content: `서킷 오브 디 아메리카스 (COTA)
• 시내 남동쪽에 있는 서킷으로, F1 미국 그랑프리가 열려요 (사진)
• 2026년 대회는 10월 23~25일에 이미 끝났고, 2027년 대회는 10월 22~24일로 F1 공식 일정에 올라 있어요 (2026년 11월 확인)
• 레이스 주말에는 숙소와 교통이 크게 붐비니 일찍 준비하세요

텍사스 롱혼스 풋볼
• 텍사스 대학교(UT 오스틴)의 미식축구팀이에요. 홈구장 대럴 K 로열–텍사스 메모리얼 스타디움은 10만 명 넘게 들어가는 대형 경기장이에요
• 시즌은 9월~11월이라 가을 여행이라면 미국 대학 풋볼 특유의 응원 문화를 볼 수 있어요

오스틴 FC
• 미국 프로축구 MLS 팀으로, 약 2만 석 규모의 Q2 스타디움을 홈으로 써요
• MLS 정규 시즌은 보통 봄부터 가을까지 이어져요 — 경기 일정은 구단 홈페이지에서 확인하세요`,
        links: [
          { label: "F1 공식 — 2027 시즌 일정", url: "https://www.formula1.com/en/racing/2027" },
          { label: "서킷 오브 디 아메리카스", url: "https://circuitoftheamericas.com/" },
          { label: "텍사스 롱혼스 공식", url: "https://texaslonghorns.com/" },
          { label: "오스틴 FC 공식", url: "https://www.austinfc.com/" },
        ],
      },
      {
        title: "SXSW — 3월, 도시 전체가 페스티벌",
        image_url: "/stories/austin-5.jpg",
        image_credit: "ajay_suresh · CC BY 4.0 · Wikimedia Commons",
        image_credit_url: "https://commons.wikimedia.org/wiki/File:Sixth_Street_-_Austin,_TX_(54987518240).jpg",
        content: `SXSW(사우스 바이 사우스웨스트)는 테크·영화·음악이 한데 모이는 오스틴의 대표 행사예요. 사진의 6번가 같은 시내 거리와 공연장이 통째로 행사장이 돼요.

2027년 일정 (공식 발표 기준, 2026년 11월 확인)
• SXSW EDU(교육): 2027년 3월 13~16일
• SXSW 컨퍼런스 & 페스티벌: 2027년 3월 15~21일
• 2027년엔 팟캐스트 페스티벌(3월 17~20일)이 새로 생겨요

달라진 형식
• 오스틴 컨벤션센터가 재건축에 들어가면서 2026년 행사부터 시내 곳곳의 '클럽하우스'와 호텔·공연장을 거점으로 쓰는 방식으로 바뀌었어요. 2026년엔 기간도 7일로 줄고 컨퍼런스·영화·음악이 같은 기간에 함께 열렸어요
• 2027년엔 역사적인 파라마운트 극장이 복원 공사에 들어가, 영화 프리미어는 ACL 라이브(무디 시어터)로 옮겨요

배지(입장권)
• 플래티넘(모든 프로그램), 이노베이션, 필름&TV, 뮤직 배지로 나뉘어요
• 오스틴 관광청 안내 기준 대략 625~1,495달러 선이고, 행사가 가까워질수록 가격이 올라요
• 배지 없이도 볼 수 있는 무료 전시·일부 공연이 있어요

💡 SXSW 기간엔 시내 호텔값이 크게 뛰고 빨리 마감돼요. 배지보다 숙소를 먼저 잡는 사람도 많아요.`,
        links: [
          { label: "SXSW 공식", url: "https://www.sxsw.com/" },
          { label: "SXSW EDU 2027 일정 발표", url: "https://sxswedu.com/news/2026/sxsw-edu-2027-dates-announced/" },
          { label: "Visit Austin — SXSW 안내", url: "https://www.austintexas.org/events/sxsw/" },
        ],
      },
      {
        title: "여행 준비 — ESTA, 공항, 계절",
        image_url: "",
        content: `입국
• 한국 여권으로 관광 목적이면 ESTA(전자여행허가)를 미리 받아야 해요. 수수료는 2025년 9월 30일부터 40달러로 올랐어요 (2026년 11월 확인, 신청은 반드시 공식 사이트에서)
• 한국에서 오스틴 직항은 없어서 미국 내 다른 도시를 거쳐 들어가요

공항(AUS) → 시내
• 시내버스 20번(Manor Road/Riverside): 수하물 찾는 곳 바로 밖 아래층 정류장에서 타고, 시내까지 약 35분, 1회 1.25달러예요 (2026년 11월 확인)
• 자정 이후엔 심야버스 483번이 6번가까지 가요
• 택시·우버·리프트도 많이 써요

시내 이동
• 다운타운·사우스 콩그레스·레이니 스트리트는 걸어 다닐 만해요
• 그 밖은 우버(운이 좋으면 웨이모 배정)나 테슬라 로보택시, 렌터카를 섞어 쓰는 게 편해요. COTA 같은 외곽은 차가 사실상 필수예요

언제 갈까
• 봄(3~5월)과 가을(10~11월)이 걷기 좋아요
• 여름은 기온이 매우 높아요 — 한낮엔 실내 일정이나 바턴 스프링스로 피하세요

💡 3월 SXSW, 10월 F1 주간은 항공·숙소가 가장 비싼 시기예요. 행사가 목적이 아니라면 이 기간을 피하는 것도 방법이에요.`,
        links: [
          { label: "ESTA 공식 신청 사이트 (미국 CBP)", url: "https://esta.cbp.dhs.gov/" },
          { label: "CapMetro — 공항 오가는 법", url: "https://www.capmetro.org/airport" },
        ],
      },
      {
        title: "참고 영상·자료",
        image_url: "",
        content: "로보택시와 오스틴 여행 분위기는 영상으로 미리 보고, 운행 지역·일정·요금은 반드시 공식 사이트와 앱 기준으로 확인하세요.",
        videos: [
          { url: "https://www.youtube.com/watch?v=Dq0X8zO6ga4", title: "[현장영상] “또 사이버캡이네?”…한 달 새 8배 늘린 테슬라 / KBS 2026.10.12. (KBS News)" },
          { url: "https://www.youtube.com/watch?v=6WdRc_vTNhk", title: "미국에서 사람이 없는 택시를 탔다… 오스틴 웨이모 자율주행 실제 후기 + 텍사스 주의사당 (빵상트래블)" },
          { url: "https://www.youtube.com/watch?v=3v2zinGVn2Q", title: "TX vlog. 텍사스 오스틴 2박3일 여행 브이로그 (채은 Park Avenue)" },
        ],
        links: [
          { label: "Visit Austin (오스틴 관광청)", url: "https://www.austintexas.org/" },
          { label: "SXSW 공식", url: "https://www.sxsw.com/" },
          {
            label: "표지 사진 출처 — ajay_suresh · CC BY 4.0 · Wikimedia Commons",
            url: "https://commons.wikimedia.org/wiki/File:Downtown_Austin_Skyline_-_Lady_Bird_Lake_(54987239041).jpg",
          },
        ],
      },
    ],
  },
];
