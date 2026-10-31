// 해외 대표 축제 (정기 개최되는 세계적 축제) — 화면·플래너 공용
//
// 해외 축제는 한곳에서 받을 수 있는 공식 무료 데이터가 없어 직접 큐레이션.
// 개최일은 해마다 달라지므로 '대표 시기'만 표기하고, 정확한 날짜는 공식 정보 확인을 안내.
// months: 주로 열리는 달 (1~12). 여러 달에 걸치면 모두 표기.

export interface GlobalFestival {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  flag: string;
  city: string;
  /** 플래너 목적지로 쓸 이름 */
  destination: string;
  months: number[];
  period: string;
  summary: string;
  emoji: string;
}

export const GLOBAL_FESTIVALS: GlobalFestival[] = [
  { id: "harbin-ice", name: "하얼빈 국제 빙설제", nameEn: "Harbin Ice and Snow Festival", country: "중국", flag: "🇨🇳", city: "하얼빈", destination: "하얼빈", months: [1, 2], period: "매년 1월 초 ~ 2월", summary: "거대한 얼음 조각과 눈 조각으로 도시 전체가 빛나는 세계 최대 규모의 겨울 축제.", emoji: "🧊" },
  { id: "sapporo-snow", name: "삿포로 눈축제", nameEn: "Sapporo Snow Festival", country: "일본", flag: "🇯🇵", city: "삿포로", destination: "삿포로", months: [2], period: "매년 2월 초 (약 1주)", summary: "오도리 공원 일대에 수백 개의 눈·얼음 조각이 들어서는 일본 대표 겨울 축제.", emoji: "⛄" },
  { id: "venice-carnival", name: "베네치아 카니발", nameEn: "Carnival of Venice", country: "이탈리아", flag: "🇮🇹", city: "베네치아", destination: "베네치아", months: [2], period: "매년 2월 (사순절 직전 약 2주)", summary: "화려한 가면과 의상을 입은 사람들이 운하 도시를 가득 채우는 중세풍 가면 축제.", emoji: "🎭" },
  { id: "rio-carnival", name: "리우 카니발", nameEn: "Rio Carnival", country: "브라질", flag: "🇧🇷", city: "리우데자네이루", destination: "리우데자네이루", months: [2, 3], period: "매년 2~3월 (사순절 직전)", summary: "삼바 스쿨 퍼레이드와 거리 파티로 유명한 세계 최대의 카니발.", emoji: "💃" },
  { id: "holi", name: "홀리 축제", nameEn: "Holi", country: "인도", flag: "🇮🇳", city: "자이푸르", destination: "자이푸르", months: [3], period: "매년 3월 (힌두력 보름)", summary: "색색의 가루를 뿌리며 봄의 시작을 축하하는 인도의 '색의 축제'.", emoji: "🌈" },
  { id: "songkran", name: "송크란 물축제", nameEn: "Songkran", country: "태국", flag: "🇹🇭", city: "방콕", destination: "방콕", months: [4], period: "매년 4월 13~15일 전후", summary: "태국 새해를 맞아 거리 곳곳에서 물을 뿌리며 축복을 나누는 물축제.", emoji: "💦" },
  { id: "kings-day", name: "킹스데이", nameEn: "King's Day", country: "네덜란드", flag: "🇳🇱", city: "암스테르담", destination: "암스테르담", months: [4], period: "매년 4월 27일 전후", summary: "도시 전체가 오렌지색으로 물드는 네덜란드 국왕 탄신 기념 거리 축제.", emoji: "🧡" },
  { id: "vivid-sydney", name: "비비드 시드니", nameEn: "Vivid Sydney", country: "호주", flag: "🇦🇺", city: "시드니", destination: "시드니", months: [5, 6], period: "매년 5월 말 ~ 6월", summary: "오페라하우스와 하버 일대를 빛과 음악으로 물들이는 빛 축제.", emoji: "✨" },
  { id: "san-fermin", name: "산 페르민 축제", nameEn: "San Fermín", country: "스페인", flag: "🇪🇸", city: "팜플로나", destination: "팜플로나", months: [7], period: "매년 7월 6~14일", summary: "흰 옷과 빨간 스카프, 소몰이 행사로 유명한 팜플로나의 전통 축제.", emoji: "🐂" },
  { id: "gion-matsuri", name: "기온 마츠리", nameEn: "Gion Matsuri", country: "일본", flag: "🇯🇵", city: "교토", destination: "교토", months: [7], period: "매년 7월 한 달 (야마보코 순행은 7월 17·24일)", summary: "천 년 넘게 이어진 교토의 여름 축제. 거대한 수레 행렬이 하이라이트.", emoji: "🏮" },
  { id: "nebuta", name: "아오모리 네부타 마츠리", nameEn: "Aomori Nebuta Matsuri", country: "일본", flag: "🇯🇵", city: "아오모리", destination: "아오모리", months: [8], period: "매년 8월 2~7일", summary: "불을 밝힌 거대한 무사 인형 수레가 밤거리를 행진하는 여름 축제.", emoji: "🏯" },
  { id: "edinburgh-fringe", name: "에든버러 프린지 페스티벌", nameEn: "Edinburgh Festival Fringe", country: "영국", flag: "🇬🇧", city: "에든버러", destination: "에든버러", months: [8], period: "매년 8월 (약 3주)", summary: "수천 편의 연극·코미디·공연이 도시 곳곳에서 열리는 세계 최대 공연 예술 축제.", emoji: "🎪" },
  { id: "la-tomatina", name: "라 토마티나", nameEn: "La Tomatina", country: "스페인", flag: "🇪🇸", city: "부뇰", destination: "발렌시아", months: [8], period: "매년 8월 마지막 수요일", summary: "참가자들이 토마토를 던지며 즐기는 발렌시아 근교 부뇰 마을의 토마토 축제.", emoji: "🍅" },
  { id: "oktoberfest", name: "옥토버페스트", nameEn: "Oktoberfest", country: "독일", flag: "🇩🇪", city: "뮌헨", destination: "뮌헨", months: [9, 10], period: "매년 9월 중순 ~ 10월 첫째 주", summary: "거대한 맥주 텐트와 바이에른 전통 음식, 퍼레이드가 열리는 세계 최대 맥주 축제.", emoji: "🍺" },
  { id: "albuquerque-balloon", name: "앨버커키 국제 열기구 축제", nameEn: "Albuquerque International Balloon Fiesta", country: "미국", flag: "🇺🇸", city: "앨버커키", destination: "앨버커키", months: [10], period: "매년 10월 첫째 주 (약 9일)", summary: "수백 개의 열기구가 새벽 하늘을 동시에 수놓는 세계 최대 열기구 축제.", emoji: "🎈" },
  { id: "diwali", name: "디왈리", nameEn: "Diwali", country: "인도", flag: "🇮🇳", city: "바라나시", destination: "바라나시", months: [10, 11], period: "매년 10~11월 (힌두력)", summary: "수많은 등불과 불꽃으로 빛의 승리를 기념하는 인도 최대 명절 축제.", emoji: "🪔" },
  { id: "yi-peng", name: "이펭·로이끄라통", nameEn: "Yi Peng & Loy Krathong", country: "태국", flag: "🇹🇭", city: "치앙마이", destination: "치앙마이", months: [11], period: "매년 11월 보름 전후", summary: "하늘로 풍등을 날리고 강에 등불을 띄우는 치앙마이의 환상적인 등불 축제.", emoji: "🏮" },
  { id: "christmas-market", name: "뉘른베르크 크리스마스 마켓", nameEn: "Nuremberg Christkindlesmarkt", country: "독일", flag: "🇩🇪", city: "뉘른베르크", destination: "뉘른베르크", months: [11, 12], period: "매년 11월 말 ~ 12월 24일", summary: "글뤼바인과 생강빵, 수공예 장식으로 가득한 독일의 대표 크리스마스 마켓.", emoji: "🎄" },
  { id: "nyc-new-year", name: "뉴욕 타임스스퀘어 새해 카운트다운", nameEn: "Times Square New Year's Eve", country: "미국", flag: "🇺🇸", city: "뉴욕", destination: "뉴욕", months: [12], period: "매년 12월 31일", summary: "볼 드롭과 함께 새해를 맞이하는 세계에서 가장 유명한 카운트다운 행사.", emoji: "🎆" },
];

export function getGlobalFestival(id: string | null | undefined): GlobalFestival | null {
  if (!id) return null;
  return GLOBAL_FESTIVALS.find((f) => f.id === id) ?? null;
}
