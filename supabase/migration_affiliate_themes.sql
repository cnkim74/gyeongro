-- ============================================================
-- 쿠팡 파트너스 + 큐레이션 테마 마이그레이션
-- ============================================================

-- ============================================================
-- 1. 쿠팡 파트너스 추천 상품
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  affiliate_url text NOT NULL,
  price_text text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON public.affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_active ON public.affiliate_products(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS affiliate_products_updated_at ON public.affiliate_products;
CREATE TRIGGER affiliate_products_updated_at
  BEFORE UPDATE ON public.affiliate_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.affiliate_products TO service_role;

-- ============================================================
-- 2. 큐레이션 테마 (영화/애니/빵지순례 등 미리 만들어진 컬렉션)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.curated_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image_url text,
  destination text,
  spots jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curated_themes_category ON public.curated_themes(category);
CREATE INDEX IF NOT EXISTS idx_curated_themes_published ON public.curated_themes(is_published) WHERE is_published = true;

DROP TRIGGER IF EXISTS curated_themes_updated_at ON public.curated_themes;
CREATE TRIGGER curated_themes_updated_at
  BEFORE UPDATE ON public.curated_themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.curated_themes TO service_role;

-- ============================================================
-- 3. 시드 데이터 - 쿠팡 파트너스 (affiliate_url은 관리자가 채워넣음)
-- ============================================================
INSERT INTO public.affiliate_products (category, name, description, affiliate_url, display_order)
VALUES
  ('connectivity', '와이파이 도시락', '해외에서 4G LTE 무제한 데이터', '#', 1),
  ('connectivity', '이심(eSIM)', '아이폰·갤럭시용 즉시 발급 이심', '#', 2),
  ('power', '보조배터리 20000mAh', '여행용 대용량 멀티포트', '#', 3),
  ('power', '110V 변환플러그', '미국·일본·유럽 멀티 어댑터', '#', 4),
  ('luggage', '캐리어 24인치', '기내반입+위탁 가능한 사이즈', '#', 5),
  ('luggage', '여행용 압축팩', '짐 부피 절반으로 줄이기', '#', 6),
  ('comfort', '목베개', '비행기/기차 장거리 필수', '#', 7),
  ('comfort', '안대 + 귀마개 세트', '숙면용', '#', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. 시드 데이터 - 큐레이션 테마 (admin이 추가 작성 가능)
-- ============================================================
INSERT INTO public.curated_themes (slug, category, title, subtitle, description, destination, spots, tips, display_order)
VALUES
  (
    'tokyo-anime-pilgrimage',
    'anime',
    '도쿄 애니메이션 성지순례 5선',
    '너의 이름은, 슬램덩크, 러브라이브의 명장면 속으로',
    '애니메이션 팬이라면 반드시 들러야 할 도쿄 근교 성지를 모았습니다.',
    '도쿄',
    '[{"name":"스가신사","anime":"너의 이름은","desc":"미츠하와 타키가 만나는 그 계단","area":"요츠야"},{"name":"가마쿠라코코마에역","anime":"슬램덩크","desc":"오프닝 명장면 건널목","area":"가마쿠라"},{"name":"칸다묘진","anime":"러브라이브","desc":"뮤즈의 신사","area":"오차노미즈"},{"name":"이케부쿠로 선샤인","anime":"포켓몬","desc":"포켓몬 메가센터","area":"이케부쿠로"},{"name":"아키하바라","anime":"오타쿠 성지","desc":"애니샵 메이드카페 클러스터","area":"아키하바라"}]'::jsonb,
    '["이른 아침 방문이 인증샷에 좋아요","스이카(교통카드)는 필수","성지 굿즈는 라이프해커보다 현지샵이 저렴"]'::jsonb,
    1
  ),
  (
    'busan-bbang-tour',
    'bbang',
    '부산 빵지순례 코스',
    '거장의 베이커리부터 줄서는 핫플까지',
    '부산 시민이 사랑하는 베이커리 6곳, 시그니처 메뉴와 줄서기 팁.',
    '부산',
    '[{"name":"옵스 베이커리","signature":"학원전","area":"남천동","tip":"주말 오전 줄 깁니다"},{"name":"백구당","signature":"크림빵","area":"중앙동","tip":"50년 노포"},{"name":"몽블랑제","signature":"몽블랑","area":"광안리","tip":"조각으로도 판매"},{"name":"비비비당","signature":"고로케","area":"해운대","tip":"포장 가능"},{"name":"칠일오","signature":"식빵","area":"전포동","tip":"오후 매진 주의"},{"name":"슬뢰","signature":"앙버터","area":"서면","tip":"차가운 버터 환상"}]'::jsonb,
    '["오전 일찍부터 시작 추천","지하철 1호선이 동선 좋음","빵 식음용 음료는 별도로 사 다니세요"]'::jsonb,
    2
  ),
  (
    'jeju-drama-spots',
    'movie_drama',
    '제주 K-드라마 촬영지',
    '도깨비, 우영우, 빈센조의 명장면 속으로',
    '제주의 푸른 자연을 담은 한국 드라마 촬영지를 따라 떠나는 여행.',
    '제주',
    '[{"name":"섭지코지","drama":"올인","desc":"오프닝 등대 신"},{"name":"성산일출봉","drama":"도깨비","desc":"공유와 김고은의 만남"},{"name":"우도","drama":"이상한 변호사 우영우","desc":"우영우의 고래"},{"name":"새별오름","drama":"빈센조","desc":"억새 오프닝 신"},{"name":"카페 글렌코","drama":"우리들의 블루스","desc":"이병헌 카페 신"}]'::jsonb,
    '["렌터카 필수 (대중교통으론 어려움)","아침 일찍 가야 사람 적음","드라마 OST 플레이리스트 만들기 추천"]'::jsonb,
    3
  ),
  (
    'paris-movie-locations',
    'movie_drama',
    '파리, 영화 속을 걷다',
    '미드나잇 인 파리, 라따뚜이의 그 골목',
    '시네필의 로망. 파리에서 만나는 영화 명장면.',
    '파리',
    '[{"name":"알렉상드르 3세 다리","movie":"미드나잇 인 파리","desc":"오웬 윌슨이 차에 탑승하던 그 다리"},{"name":"몽마르트르 라르정","movie":"아멜리에","desc":"아멜리에가 일하던 카페 (Café des Deux Moulins)"},{"name":"퐁네프 다리","movie":"퐁네프의 연인들","desc":"실제 거주 신 촬영"},{"name":"개선문","movie":"숨가쁘게","desc":"누벨바그 명장면"},{"name":"레퓌블리크 광장","movie":"미드나잇 인 파리","desc":"새벽 산책 신"}]'::jsonb,
    '["이른 아침이나 일몰이 가장 영화 같아요","미니 카메라 필수","에펠탑 야경 점등쇼는 매시 정각 5분"]'::jsonb,
    4
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. 스키마 캐시 새로고침
-- ============================================================
NOTIFY pgrst, 'reload schema';
