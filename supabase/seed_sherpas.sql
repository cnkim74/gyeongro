-- ============================================================
-- 셰르파 데모 시드 (8명)
-- ============================================================
-- migration_sherpa.sql 먼저 실행 후 → 이 파일 실행
-- ============================================================

INSERT INTO public.sherpas (
  slug, display_name, tagline, bio,
  countries, cities, languages, specialties,
  hourly_rate_krw, half_day_rate_krw, full_day_rate_krw,
  avg_response_hours,
  status, verified_id, verified_local, verified_at,
  rating_avg, rating_count, booking_count,
  display_order
) VALUES
-- 인바운드: 서울 푸드 가이드
('seoul-food-jiwon',
 '지원',
 '강남·홍대·종로 다 다녀본 진짜 동네 푸드 가이드',
 '서울에서 7년째 살면서 외국 친구들에게 맛집을 안내해온 노하우를 살려 셰르파로 활동합니다. 관광객 안 가는 진짜 노포·새로 뜨는 핫플 둘 다 잘 알아요. 일본·중국 친구 안내 경험 풍부합니다.',
 ARRAY['KR'], ARRAY['서울'],
 ARRAY['ko','en','ja'],
 ARRAY['food_tour','interpreter','city_guide'],
 35000, 120000, 220000,
 3,
 'published', true, true, now(),
 4.92, 28, 32,
 1),

-- 인바운드: 대구 의료관광 통역
('daegu-medical-yejin',
 '예진',
 '대구 의료관광 전문 — 모발이식·치과·검진 통역',
 '대구 거주 10년, 의료 통역사 자격증 보유. 한국 의료관광 클러스터인 대구에서 일본·중국 환자 통역과 동행을 전문으로 합니다. 시술 전후 일정·약 복용·식사 가이드까지 종합 케어.',
 ARRAY['KR'], ARRAY['대구','서울'],
 ARRAY['ko','en','ja','zh'],
 ARRAY['medical_concierge','interpreter','transport'],
 50000, 180000, 320000,
 2,
 'published', true, true, now(),
 5.00, 14, 16,
 2),

-- 인바운드: 안동 전통체험
('andong-tradition-minho',
 '민호',
 '하회마을·도산서원 전통문화 인사이더',
 '안동 토박이로 하회별신굿·종갓집·서원 등 안동 깊숙한 곳을 안내합니다. 외국인 친구들이 단순 관광이 아닌 한국 정신문화를 체감할 수 있도록 도와드려요.',
 ARRAY['KR'], ARRAY['안동','경주'],
 ARRAY['ko','en'],
 ARRAY['tradition','city_guide','transport'],
 30000, 110000, 200000,
 6,
 'published', true, true, now(),
 4.85, 9, 11,
 3),

-- 인바운드: 부산 사진 가이드
('busan-photo-yuna',
 '유나',
 '해운대·감천·송도 인생샷 100컷 보장',
 '부산에서 사진 작가로 활동하며 여행객 화보 촬영을 7년째 하고 있어요. 인생샷 명소 안내 + 즉석 보정해서 카톡으로 전송해드립니다. SNS용 이미지 추천도 잘해요.',
 ARRAY['KR'], ARRAY['부산'],
 ARRAY['ko','en'],
 ARRAY['photographer','city_guide','shopping'],
 45000, 160000, 290000,
 4,
 'published', true, true, now(),
 4.95, 22, 25,
 4),

-- 아웃바운드: 도쿄 셰르파 (한국인)
('tokyo-yeji',
 '예지',
 '도쿄 거주 8년, 한국말 100% 통하는 도쿄 가이드',
 '도쿄에서 일본 IT 회사 다니며 8년째 살고 있는 한국인 셰르파입니다. 처음 도쿄 오시는 분 또는 오마카세·골목 맛집·전시·디즈니랜드 효율 동선 짜드려요. 일본어 안 되셔도 괜찮아요.',
 ARRAY['JP'], ARRAY['도쿄','요코하마'],
 ARRAY['ko','ja','en'],
 ARRAY['city_guide','food_tour','interpreter','shopping'],
 40000, 140000, 250000,
 2,
 'published', true, true, now(),
 4.97, 41, 47,
 5),

-- 아웃바운드: 이스탄불 의료관광 동행
('istanbul-medical-junseok',
 '준석',
 '터키 모발이식 전문 동행 셰르파',
 '이스탄불에서 5년 거주하며 한국 모발이식 환자 100명 이상 동행한 경험. 공항 픽업·호텔 체크인·클리닉 통역·시술 전후 케어·관광 안내까지 6일 풀패키지 가능. 한국 환자만 받습니다.',
 ARRAY['TR'], ARRAY['이스탄불'],
 ARRAY['ko','tr','en'],
 ARRAY['medical_concierge','interpreter','transport','city_guide'],
 NULL, 200000, 360000,
 1,
 'published', true, true, now(),
 4.98, 53, 67,
 6),

-- 아웃바운드: 방콕 푸드 셰르파
('bangkok-food-haram',
 '하람',
 '방콕 야시장·골목식당 길라잡이',
 '방콕 거주 4년, 카오산·쩌투짝·차이나타운 야시장 주민 단위로 답니다. 음식 알레르기·맵기 조절도 통역 가능. 마사지샵·시장 흥정도 도와드려요.',
 ARRAY['TH'], ARRAY['방콕','파타야'],
 ARRAY['ko','th','en'],
 ARRAY['food_tour','shopping','transport','city_guide'],
 30000, 100000, 180000,
 5,
 'published', true, true, now(),
 4.78, 18, 22,
 7),

-- 아웃바운드: 파리 통역+사진
('paris-photo-soyeon',
 '소연',
 '파리 8구 인생샷 + 미술관 가이드',
 '파리에서 사진 + 미술사 공부 6년차. 에펠탑·루브르 인생샷, 오르세·퐁피두 큐레이션 가이드. 프랑스어 통역 + 카페·레스토랑 동행 가능합니다.',
 ARRAY['FR'], ARRAY['파리'],
 ARRAY['ko','fr','en'],
 ARRAY['photographer','interpreter','city_guide'],
 50000, 180000, 320000,
 4,
 'published', true, true, now(),
 4.90, 31, 35,
 8)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
