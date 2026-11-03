// 환율 계산기용 통화 목록 + 여행지 → 통화 추정 (서버·클라이언트 공용)

export interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  /** 표시 단위 (엔·동·루피아는 100단위로 보는 게 익숙함) */
  unit: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "JPY", name: "일본 엔", flag: "🇯🇵", unit: 100 },
  { code: "USD", name: "미국 달러", flag: "🇺🇸", unit: 1 },
  { code: "EUR", name: "유로", flag: "🇪🇺", unit: 1 },
  { code: "CNY", name: "중국 위안", flag: "🇨🇳", unit: 1 },
  { code: "TWD", name: "대만 달러", flag: "🇹🇼", unit: 1 },
  { code: "HKD", name: "홍콩 달러", flag: "🇭🇰", unit: 1 },
  { code: "THB", name: "태국 바트", flag: "🇹🇭", unit: 1 },
  { code: "VND", name: "베트남 동", flag: "🇻🇳", unit: 100 },
  { code: "PHP", name: "필리핀 페소", flag: "🇵🇭", unit: 1 },
  { code: "SGD", name: "싱가포르 달러", flag: "🇸🇬", unit: 1 },
  { code: "MYR", name: "말레이시아 링깃", flag: "🇲🇾", unit: 1 },
  { code: "IDR", name: "인도네시아 루피아", flag: "🇮🇩", unit: 100 },
  { code: "AUD", name: "호주 달러", flag: "🇦🇺", unit: 1 },
  { code: "NZD", name: "뉴질랜드 달러", flag: "🇳🇿", unit: 1 },
  { code: "GBP", name: "영국 파운드", flag: "🇬🇧", unit: 1 },
  { code: "CHF", name: "스위스 프랑", flag: "🇨🇭", unit: 1 },
  { code: "CAD", name: "캐나다 달러", flag: "🇨🇦", unit: 1 },
  { code: "CZK", name: "체코 코루나", flag: "🇨🇿", unit: 1 },
  { code: "HUF", name: "헝가리 포린트", flag: "🇭🇺", unit: 100 },
  { code: "TRY", name: "튀르키예 리라", flag: "🇹🇷", unit: 1 },
  { code: "AED", name: "UAE 디르함", flag: "🇦🇪", unit: 1 },
  { code: "NOK", name: "노르웨이 크로네", flag: "🇳🇴", unit: 1 },
  { code: "SEK", name: "스웨덴 크로나", flag: "🇸🇪", unit: 1 },
  { code: "DKK", name: "덴마크 크로네", flag: "🇩🇰", unit: 1 },
  { code: "MNT", name: "몽골 투그릭", flag: "🇲🇳", unit: 100 },
  { code: "MXN", name: "멕시코 페소", flag: "🇲🇽", unit: 1 },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

export function currencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

// 여행지 이름에 들어간 단어로 통화 추정 (못 찾으면 null — 국내 여행 등)
const DEST_CURRENCY: [RegExp, string][] = [
  [/일본|도쿄|오사카|교토|후쿠오카|삿포로|홋카이도|오키나와|나고야|요코하마|고베|나라현|규슈|가고시마|아오모리|센다이|하코네|나하/, "JPY"],
  [/대만|타이베이|타이중|가오슝|타이난|화롄|지우펀/, "TWD"],
  [/홍콩/, "HKD"],
  [/마카오/, "HKD"],
  [/중국|베이징|상하이|칭다오|하얼빈|광저우|선전|청두|장자제|시안|항저우|쑤저우|다롄|옌지/, "CNY"],
  [/태국|방콕|치앙마이|푸켓|파타야|끄라비|코사무이/, "THB"],
  [/베트남|다낭|하노이|호치민|나트랑|냐짱|푸꾸옥|호이안|달랏|하롱/, "VND"],
  [/필리핀|세부|마닐라|보라카이|보홀|팔라완/, "PHP"],
  [/싱가포르/, "SGD"],
  [/말레이시아|쿠알라룸푸르|코타키나발루|페낭|랑카위/, "MYR"],
  [/인도네시아|발리|자카르타|롬복/, "IDR"],
  [/몽골|울란바토르/, "MNT"],
  [/호주|시드니|멜버른|브리즈번|골드코스트|퍼스|케언즈/, "AUD"],
  [/뉴질랜드|오클랜드|퀸스타운|크라이스트처치/, "NZD"],
  [/영국|런던|에든버러|맨체스터|리버풀/, "GBP"],
  [/스위스|취리히|제네바|인터라켄|루체른|체르마트/, "CHF"],
  [/체코|프라하|체스키/, "CZK"],
  [/헝가리|부다페스트/, "HUF"],
  [/튀르키예|터키|이스탄불|카파도키아|안탈리아/, "TRY"],
  [/두바이|아부다비|아랍에미리트|UAE/i, "AED"],
  [/노르웨이|오슬로|트롬쇠|베르겐/, "NOK"],
  [/스웨덴|스톡홀름/, "SEK"],
  [/덴마크|코펜하겐/, "DKK"],
  [/캐나다|밴쿠버|벤쿠버|토론토|몬트리올|퀘벡|밴프/, "CAD"],
  [/멕시코|칸쿤/, "MXN"],
  [/미국|뉴욕|엘에이|로스앤젤레스|샌프란시스코|라스베이거스|하와이|호놀룰루|괌|사이판|시애틀|시카고|보스턴|마이애미|올랜도|샌디에이고/, "USD"],
  [/프랑스|파리|니스|이탈리아|로마|밀라노|베네치아|피렌체|나폴리|스페인|바르셀로나|마드리드|세비야|발렌시아|독일|뮌헨|베를린|프랑크푸르트|쾰른|오스트리아|비엔나|잘츠부르크|할슈타트|네덜란드|암스테르담|벨기에|브뤼셀|포르투갈|리스본|포르투|그리스|아테네|산토리니|크로아티아|두브로브니크|핀란드|헬싱키|아일랜드|더블린|슬로베니아|몰타|에스토니아/, "EUR"],
];

export function currencyForDestination(destination: string): string | null {
  for (const [re, code] of DEST_CURRENCY) if (re.test(destination)) return code;
  return null;
}
