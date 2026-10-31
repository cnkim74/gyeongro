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
  { id: "sendai-tanabata", name: "센다이 다나바타 마츠리", nameEn: "Sendai Tanabata Festival", country: "일본", flag: "🇯🇵", city: "센다이", destination: "센다이", months: [8], period: "매년 8월 6~8일", summary: "화려한 대나무 장식과 오색 종이 장식이 상점가를 가득 메우는 일본 최대 칠석 축제.", emoji: "🎋" },
  { id: "awa-odori", name: "아와오도리", nameEn: "Awa Odori", country: "일본", flag: "🇯🇵", city: "도쿠시마", destination: "도쿠시마", months: [8], period: "매년 8월 12~15일", summary: "수만 명의 무용수가 거리를 행진하며 춤추는 400년 전통의 일본 최대 봉오도리 축제.", emoji: "💃" },
  { id: "tenjin-matsuri", name: "덴진 마츠리", nameEn: "Tenjin Matsuri", country: "일본", flag: "🇯🇵", city: "오사카", destination: "오사카", months: [7], period: "매년 7월 24~25일", summary: "강 위를 수놓는 배 행렬과 불꽃놀이로 유명한 오사카의 일본 3대 마츠리.", emoji: "🎆" },
  { id: "sumida-fireworks", name: "스미다가와 불꽃놀이", nameEn: "Sumida River Fireworks", country: "일본", flag: "🇯🇵", city: "도쿄", destination: "도쿄", months: [7], period: "매년 7월 마지막 토요일", summary: "2만 발 가까운 불꽃이 도쿄 밤하늘을 수놓는 일본에서 가장 오래된 불꽃 축제.", emoji: "🎇" },
  { id: "jidai-matsuri", name: "지다이 마츠리", nameEn: "Jidai Matsuri", country: "일본", flag: "🇯🇵", city: "교토", destination: "교토", months: [10], period: "매년 10월 22일", summary: "시대별 전통 의상을 입은 행렬이 교토 시내를 걷는 '시대 축제'.", emoji: "👘" },
  { id: "aoi-matsuri", name: "아오이 마츠리", nameEn: "Aoi Matsuri", country: "일본", flag: "🇯🇵", city: "교토", destination: "교토", months: [5], period: "매년 5월 15일", summary: "헤이안 시대 귀족 복장을 한 행렬이 교토 고쇼에서 신사까지 이어지는 우아한 축제.", emoji: "🌿" },
  { id: "hakata-yamakasa", name: "하카타 기온 야마카사", nameEn: "Hakata Gion Yamakasa", country: "일본", flag: "🇯🇵", city: "후쿠오카", destination: "후쿠오카", months: [7], period: "매년 7월 1~15일", summary: "거대한 수레를 메고 새벽 거리를 질주하는 후쿠오카의 박력 넘치는 여름 축제.", emoji: "🏮" },
  { id: "takayama-matsuri", name: "다카야마 마츠리", nameEn: "Takayama Festival", country: "일본", flag: "🇯🇵", city: "다카야마", destination: "다카야마", months: [4, 10], period: "매년 4월 14~15일 · 10월 9~10일", summary: "정교한 장식의 수레(야타이)가 옛 거리를 지나는 일본의 아름다운 전통 축제.", emoji: "⛩️" },
  { id: "nagasaki-lantern", name: "나가사키 랜턴 페스티벌", nameEn: "Nagasaki Lantern Festival", country: "일본", flag: "🇯🇵", city: "나가사키", destination: "나가사키", months: [1, 2], period: "매년 음력 설 무렵 (1~2월)", summary: "1만 5천 개가 넘는 등불이 도시를 밝히는 나가사키 차이나타운의 겨울 축제.", emoji: "🏮" },
  { id: "nagasaki-kunchi", name: "나가사키 군치", nameEn: "Nagasaki Kunchi", country: "일본", flag: "🇯🇵", city: "나가사키", destination: "나가사키", months: [10], period: "매년 10월 7~9일", summary: "중국·네덜란드 문화가 섞인 독특한 춤과 용춤이 볼거리인 나가사키 대표 가을 축제.", emoji: "🐉" },
  { id: "taiwan-lantern", name: "대만 등불 축제", nameEn: "Taiwan Lantern Festival", country: "대만", flag: "🇹🇼", city: "타이베이", destination: "타이베이", months: [2, 3], period: "매년 정월대보름 무렵 (2~3월)", summary: "거대한 등불 조형물과 핑시의 천등 날리기로 유명한 대만의 대표 정월 축제.", emoji: "🏮" },
  { id: "hk-cny-parade", name: "홍콩 춘절 야간 퍼레이드", nameEn: "Hong Kong Chinese New Year Night Parade", country: "홍콩", flag: "🇭🇰", city: "홍콩", destination: "홍콩", months: [1, 2], period: "매년 음력 설 (1~2월)", summary: "화려한 꽃차와 공연단이 침사추이를 행진하고 빅토리아 하버에 불꽃이 터지는 새해 축제.", emoji: "🧧" },
  { id: "hk-wine-dine", name: "홍콩 와인 앤 다인 페스티벌", nameEn: "Hong Kong Wine & Dine Festival", country: "홍콩", flag: "🇭🇰", city: "홍콩", destination: "홍콩", months: [10, 11], period: "매년 10~11월", summary: "빅토리아 하버를 배경으로 세계 와인과 미식을 즐기는 홍콩 대표 미식 축제.", emoji: "🍷" },
  { id: "macau-gp", name: "마카오 그랑프리", nameEn: "Macau Grand Prix", country: "마카오", flag: "🇲🇴", city: "마카오", destination: "마카오", months: [11], period: "매년 11월", summary: "도심 시가지를 질주하는 세계적인 자동차·오토바이 경주 대회.", emoji: "🏎️" },
  { id: "sinulog", name: "시눌룩 축제", nameEn: "Sinulog Festival", country: "필리핀", flag: "🇵🇭", city: "세부", destination: "세부", months: [1], period: "매년 1월 셋째 일요일 전후", summary: "화려한 의상과 북소리로 거리를 채우는 필리핀 최대 규모의 종교·거리 축제.", emoji: "🥁" },
  { id: "ati-atihan", name: "아티아티한 축제", nameEn: "Ati-Atihan Festival", country: "필리핀", flag: "🇵🇭", city: "칼리보", destination: "보라카이", months: [1], period: "매년 1월 셋째 주", summary: "얼굴에 그림을 그리고 북장단에 맞춰 춤추는 필리핀 '축제의 어머니'. 보라카이 근처.", emoji: "🎭" },
  { id: "nyepi", name: "녜피 (발리 침묵의 날)", nameEn: "Nyepi", country: "인도네시아", flag: "🇮🇩", city: "발리", destination: "발리", months: [3], period: "매년 3월 무렵 (발리력 새해)", summary: "전날 밤 오고오고 인형 행진 후 섬 전체가 하루 동안 멈추는 특별한 날. 공항도 쉬니 일정 확인 필수.", emoji: "🌙" },
  { id: "singapore-gp", name: "싱가포르 F1 나이트 레이스", nameEn: "Singapore Grand Prix", country: "싱가포르", flag: "🇸🇬", city: "싱가포르", destination: "싱가포르", months: [9, 10], period: "매년 9~10월", summary: "마리나베이 야경 속 시가지를 달리는 세계 최초의 F1 야간 레이스.", emoji: "🏁" },
  { id: "thaipusam", name: "타이푸삼", nameEn: "Thaipusam", country: "말레이시아", flag: "🇲🇾", city: "쿠알라룸푸르", destination: "쿠알라룸푸르", months: [1, 2], period: "매년 1~2월 (타밀력)", summary: "바투 동굴로 수많은 순례자가 모여드는 힌두교 대표 축제.", emoji: "🛕" },
  { id: "tet", name: "뗏 (베트남 설)", nameEn: "Tết", country: "베트남", flag: "🇻🇳", city: "하노이", destination: "하노이", months: [1, 2], period: "매년 음력 설 (1~2월)", summary: "꽃시장과 등불, 불꽃놀이로 거리가 들뜨는 베트남 최대 명절. 일부 상점은 휴무.", emoji: "🌸" },
  { id: "pushkar-camel", name: "푸시카르 낙타 축제", nameEn: "Pushkar Camel Fair", country: "인도", flag: "🇮🇳", city: "푸시카르", destination: "자이푸르", months: [10, 11], period: "매년 10~11월 (카르티크 보름)", summary: "수만 마리의 낙타와 상인, 순례자가 모이는 사막 마을의 세계적인 장터 축제.", emoji: "🐪" },
  { id: "nice-carnival", name: "니스 카니발", nameEn: "Nice Carnival", country: "프랑스", flag: "🇫🇷", city: "니스", destination: "니스", months: [2, 3], period: "매년 2월 (약 2주)", summary: "거대한 인형 퍼레이드와 꽃 전쟁으로 유명한 남프랑스의 대표 겨울 카니발.", emoji: "🎉" },
  { id: "menton-lemon", name: "망통 레몬 축제", nameEn: "Menton Lemon Festival", country: "프랑스", flag: "🇫🇷", city: "망통", destination: "니스", months: [2, 3], period: "매년 2월~3월 초", summary: "레몬과 오렌지 수십만 개로 만든 거대한 조형물이 정원을 채우는 축제. 니스에서 가까워요.", emoji: "🍋" },
  { id: "fete-musique", name: "페트 드 라 뮈지크", nameEn: "Fête de la Musique", country: "프랑스", flag: "🇫🇷", city: "파리", destination: "파리", months: [6], period: "매년 6월 21일", summary: "하지에 파리 곳곳 거리에서 누구나 무료로 공연을 즐기는 음악 축제.", emoji: "🎸" },
  { id: "lyon-lights", name: "리옹 빛 축제", nameEn: "Fête des Lumières", country: "프랑스", flag: "🇫🇷", city: "리옹", destination: "리옹", months: [12], period: "매년 12월 8일 전후 (4일)", summary: "도시 전체의 건물과 광장이 빛의 예술 작품으로 변하는 유럽 대표 빛 축제.", emoji: "💡" },
  { id: "avignon", name: "아비뇽 페스티벌", nameEn: "Festival d'Avignon", country: "프랑스", flag: "🇫🇷", city: "아비뇽", destination: "아비뇽", months: [7], period: "매년 7월", summary: "교황청 앞마당부터 골목 극장까지 도시 전체가 무대가 되는 세계적 공연 예술 축제.", emoji: "🎭" },
  { id: "strasbourg-xmas", name: "스트라스부르 크리스마스 마켓", nameEn: "Strasbourg Christmas Market", country: "프랑스", flag: "🇫🇷", city: "스트라스부르", destination: "스트라스부르", months: [11, 12], period: "매년 11월 말 ~ 12월 말", summary: "'크리스마스의 수도'라 불리는 프랑스에서 가장 오래된 크리스마스 마켓.", emoji: "🎄" },
  { id: "las-fallas", name: "라스 파야스", nameEn: "Las Fallas", country: "스페인", flag: "🇪🇸", city: "발렌시아", destination: "발렌시아", months: [3], period: "매년 3월 15~19일", summary: "거대한 인형 조형물을 세웠다가 마지막 밤에 모두 불태우는 발렌시아의 불의 축제.", emoji: "🔥" },
  { id: "feria-abril", name: "세비야 4월 축제", nameEn: "Feria de Abril", country: "스페인", flag: "🇪🇸", city: "세비야", destination: "세비야", months: [4, 5], period: "매년 4~5월 (부활절 2주 뒤)", summary: "플라멩코 드레스와 마차, 밤새 이어지는 춤과 음악의 안달루시아 대표 축제.", emoji: "💃" },
  { id: "la-merce", name: "라 메르세", nameEn: "La Mercè", country: "스페인", flag: "🇪🇸", city: "바르셀로나", destination: "바르셀로나", months: [9], period: "매년 9월 24일 전후", summary: "인간 탑 쌓기와 불꽃 퍼레이드, 무료 공연이 펼쳐지는 바르셀로나 최대 축제.", emoji: "🎆" },
  { id: "cologne-carnival", name: "쾰른 카니발", nameEn: "Cologne Carnival", country: "독일", flag: "🇩🇪", city: "쾰른", destination: "쾰른", months: [2, 3], period: "매년 2~3월 (사순절 직전)", summary: "분장한 시민 수십만 명이 거리로 쏟아지는 독일 최대의 카니발.", emoji: "🤡" },
  { id: "vienna-xmas", name: "빈 크리스마스 마켓", nameEn: "Vienna Christmas Markets", country: "오스트리아", flag: "🇦🇹", city: "빈", destination: "빈", months: [11, 12], period: "매년 11월 중순 ~ 12월 말", summary: "시청 앞 광장을 비롯해 도시 곳곳에 열리는 동화 같은 크리스마스 마켓.", emoji: "🎄" },
  { id: "salzburg-festival", name: "잘츠부르크 페스티벌", nameEn: "Salzburg Festival", country: "오스트리아", flag: "🇦🇹", city: "잘츠부르크", destination: "잘츠부르크", months: [7, 8], period: "매년 7월 말 ~ 8월", summary: "모차르트의 도시에서 열리는 세계 최고 수준의 클래식·오페라 축제.", emoji: "🎻" },
  { id: "notting-hill", name: "노팅힐 카니발", nameEn: "Notting Hill Carnival", country: "영국", flag: "🇬🇧", city: "런던", destination: "런던", months: [8], period: "매년 8월 마지막 주말", summary: "카리브해 음악과 춤, 거리 음식으로 런던 서쪽이 들썩이는 유럽 최대 거리 축제.", emoji: "🎊" },
  { id: "wimbledon", name: "윔블던 테니스 대회", nameEn: "Wimbledon", country: "영국", flag: "🇬🇧", city: "런던", destination: "런던", months: [6, 7], period: "매년 6월 말 ~ 7월 초", summary: "잔디 코트와 딸기 크림으로 유명한 세계에서 가장 오래된 테니스 대회.", emoji: "🎾" },
  { id: "hogmanay", name: "에든버러 호그머네이", nameEn: "Edinburgh's Hogmanay", country: "영국", flag: "🇬🇧", city: "에든버러", destination: "에든버러", months: [12, 1], period: "매년 12월 30일 ~ 1월 1일", summary: "횃불 행진과 에든버러 성 위 불꽃놀이로 새해를 맞는 스코틀랜드식 연말 축제.", emoji: "🏰" },
  { id: "st-patricks", name: "성 패트릭 데이", nameEn: "St. Patrick's Festival", country: "아일랜드", flag: "🇮🇪", city: "더블린", destination: "더블린", months: [3], period: "매년 3월 17일 전후", summary: "도시 전체가 초록빛으로 물들고 퍼레이드가 열리는 아일랜드 최대 축제.", emoji: "☘️" },
  { id: "palio-siena", name: "시에나 팔리오", nameEn: "Palio di Siena", country: "이탈리아", flag: "🇮🇹", city: "시에나", destination: "피렌체", months: [7, 8], period: "매년 7월 2일 · 8월 16일", summary: "중세 광장을 맨몸의 말이 질주하는 수백 년 전통의 경마 축제. 피렌체에서 당일치기 가능.", emoji: "🐎" },
  { id: "prague-spring", name: "프라하의 봄 음악 축제", nameEn: "Prague Spring Festival", country: "체코", flag: "🇨🇿", city: "프라하", destination: "프라하", months: [5, 6], period: "매년 5월 12일 ~ 6월 초", summary: "스메타나의 '나의 조국'으로 막을 여는 유서 깊은 클래식 음악 축제.", emoji: "🎼" },
  { id: "midsummer-sweden", name: "스웨덴 미드솜마르", nameEn: "Midsummer", country: "스웨덴", flag: "🇸🇪", city: "스톡홀름", destination: "스톡홀름", months: [6], period: "매년 6월 하지 무렵 금요일", summary: "꽃 화관을 쓰고 메이폴 주위를 춤추며 백야를 즐기는 스웨덴 최대 명절.", emoji: "🌼" },
  { id: "sao-joao", name: "상 주앙 축제", nameEn: "São João", country: "포르투갈", flag: "🇵🇹", city: "포르투", destination: "포르투", months: [6], period: "매년 6월 23~24일", summary: "밤새 거리 파티와 불꽃놀이가 이어지는 포르투의 가장 신나는 여름밤 축제.", emoji: "🎈" },
  { id: "santo-antonio", name: "산투 안토니우 축제", nameEn: "Festas de Santo António", country: "포르투갈", flag: "🇵🇹", city: "리스본", destination: "리스본", months: [6], period: "매년 6월 12~13일", summary: "정어리 굽는 냄새와 골목 파티로 가득한 리스본의 수호성인 축제.", emoji: "🐟" },
  { id: "mardi-gras", name: "뉴올리언스 마디그라", nameEn: "Mardi Gras", country: "미국", flag: "🇺🇸", city: "뉴올리언스", destination: "뉴올리언스", months: [2, 3], period: "매년 2~3월 (사순절 직전)", summary: "구슬 목걸이가 날아다니는 화려한 퍼레이드와 재즈의 도시 대표 카니발.", emoji: "🎷" },
  { id: "coachella", name: "코첼라 페스티벌", nameEn: "Coachella", country: "미국", flag: "🇺🇸", city: "인디오", destination: "로스앤젤레스", months: [4], period: "매년 4월 (2주말)", summary: "사막 위에서 열리는 세계적인 음악·예술 페스티벌. LA에서 차로 약 2~3시간.", emoji: "🎡" },
  { id: "sxsw", name: "SXSW", nameEn: "South by Southwest", country: "미국", flag: "🇺🇸", city: "오스틴", destination: "오스틴", months: [3], period: "매년 3월", summary: "음악·영화·기술이 한데 모이는 세계적인 페스티벌 겸 컨퍼런스.", emoji: "🎤" },
  { id: "thanksgiving-parade", name: "메이시스 추수감사절 퍼레이드", nameEn: "Macy's Thanksgiving Day Parade", country: "미국", flag: "🇺🇸", city: "뉴욕", destination: "뉴욕", months: [11], period: "매년 11월 넷째 목요일", summary: "거대한 캐릭터 풍선이 맨해튼을 행진하는 미국 대표 퍼레이드.", emoji: "🎈" },
  { id: "burning-man", name: "버닝맨", nameEn: "Burning Man", country: "미국", flag: "🇺🇸", city: "블랙록 사막", destination: "리노", months: [8, 9], period: "매년 8월 말 ~ 9월 초", summary: "사막 위에 임시 도시를 세우고 거대한 예술 작품을 불태우는 독특한 공동체 축제.", emoji: "🔥" },
  { id: "dia-de-muertos", name: "망자의 날", nameEn: "Día de Muertos", country: "멕시코", flag: "🇲🇽", city: "멕시코시티", destination: "멕시코시티", months: [10, 11], period: "매년 11월 1~2일 (10월 말 퍼레이드)", summary: "해골 분장과 금잔화로 세상을 떠난 가족을 기리는 유네스코 무형유산 축제.", emoji: "💀" },
  { id: "quebec-winter", name: "퀘벡 윈터 카니발", nameEn: "Quebec Winter Carnival", country: "캐나다", flag: "🇨🇦", city: "퀘벡시티", destination: "퀘벡시티", months: [1, 2], period: "매년 1월 말 ~ 2월 중순", summary: "얼음 궁전과 눈 조각, 밤 퍼레이드가 펼쳐지는 세계 최대 겨울 카니발 중 하나.", emoji: "⛄" },
  { id: "montreal-jazz", name: "몬트리올 국제 재즈 페스티벌", nameEn: "Montreal International Jazz Festival", country: "캐나다", flag: "🇨🇦", city: "몬트리올", destination: "몬트리올", months: [6, 7], period: "매년 6월 말 ~ 7월 초", summary: "수백 개의 무료 야외 공연이 열리는 세계 최대 규모의 재즈 축제.", emoji: "🎺" },
  { id: "calgary-stampede", name: "캘거리 스탬피드", nameEn: "Calgary Stampede", country: "캐나다", flag: "🇨🇦", city: "캘거리", destination: "캘거리", months: [7], period: "매년 7월 초 (10일)", summary: "로데오와 카우보이 문화를 즐기는 '세상에서 가장 위대한 야외 쇼'.", emoji: "🤠" },
  { id: "inti-raymi", name: "인티 라이미", nameEn: "Inti Raymi", country: "페루", flag: "🇵🇪", city: "쿠스코", destination: "쿠스코", months: [6], period: "매년 6월 24일", summary: "잉카 시대 태양신에게 바치던 의식을 재현하는 남미 최대 전통 축제.", emoji: "☀️" },
  { id: "sydney-nye", name: "시드니 새해 불꽃놀이", nameEn: "Sydney New Year's Eve", country: "호주", flag: "🇦🇺", city: "시드니", destination: "시드니", months: [12], period: "매년 12월 31일", summary: "하버브리지와 오페라하우스 위로 터지는 세계적인 새해 맞이 불꽃놀이.", emoji: "🎆" },
  { id: "melbourne-cup", name: "멜버른 컵", nameEn: "Melbourne Cup", country: "호주", flag: "🇦🇺", city: "멜버른", destination: "멜버른", months: [11], period: "매년 11월 첫째 화요일", summary: "'나라를 멈추게 하는 경주'라 불리는 호주 최대 경마 대회와 패션 축제.", emoji: "🏇" },
  { id: "dubai-shopping", name: "두바이 쇼핑 페스티벌", nameEn: "Dubai Shopping Festival", country: "아랍에미리트", flag: "🇦🇪", city: "두바이", destination: "두바이", months: [12, 1], period: "매년 12월 중순 ~ 1월", summary: "도시 전체 할인 행사와 불꽃놀이, 드론쇼가 이어지는 두바이 대표 겨울 축제.", emoji: "🛍️" },
];

export function getGlobalFestival(id: string | null | undefined): GlobalFestival | null {
  if (!id) return null;
  return GLOBAL_FESTIVALS.find((f) => f.id === id) ?? null;
}
