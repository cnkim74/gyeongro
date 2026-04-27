-- ============================================================
-- 의료관광 데모 클리닉 시드 데이터
-- ============================================================
-- 사용법: migration_medical.sql 실행 후 → 이 파일 실행
-- ============================================================
-- 주의: 데모용 가상 클리닉입니다. 실제 운영 시 검증된 데이터로 교체하세요.
--      모든 클리닉은 status='published', source='ai_curated'로 들어갑니다.
-- ============================================================

INSERT INTO public.medical_clinics (
  slug, name, name_en, direction, country, city,
  procedures, specialties, description, highlights,
  price_range_min, price_range_max,
  contact_phone, contact_email, website_url,
  cover_image_url,
  source, status, ai_notes, display_order
) VALUES
-- 아웃바운드: 터키 모발이식
('istanbul-hair-clinic-demo',
 '이스탄불 헤어 클리닉 (데모)', 'Istanbul Hair Clinic',
 'outbound', 'TR', '이스탄불',
 '["hair-transplant"]'::jsonb,
 ARRAY['FUE 모발이식', 'DHI 직접 식모', '수염·눈썹 이식'],
 '터키 이스탄불의 모발이식 전문 클리닉. 한국인 통역 상주, 5박 6일 패키지(시술+호텔+공항픽업) 운영. 평균 그래프트 3000~4500개 시술.',
 ARRAY['한국어 통역 상주', '5박 6일 풀패키지', 'FUE/DHI 동시 운영', '연 1000건 이상 시술'],
 2500000, 4500000,
 NULL, NULL, NULL,
 NULL,
 'ai_curated', 'published',
 'AI 큐레이션 데모 데이터. 실제 운영 시 클리닉 검증 필요.', 1),

-- 아웃바운드: 헝가리 치과 (데모)
('budapest-dental-demo',
 '부다페스트 덴탈 (데모)', 'Budapest Dental',
 'outbound', 'HU', '부다페스트',
 '["plastic-surgery"]'::jsonb,
 ARRAY['임플란트', '올세라믹 보철', '치아교정'],
 '헝가리 부다페스트의 치과 클리닉. EU 규격 임플란트를 한국 대비 1/3 가격으로 시술. 영어 진료 가능.',
 ARRAY['EU 규격 임플란트', '한국 대비 30~40% 가격', '영어 진료', '5년 보증'],
 1200000, 3500000,
 NULL, NULL, NULL,
 NULL,
 'ai_curated', 'published',
 'AI 큐레이션 데모 데이터.', 2),

-- 아웃바운드: 태국 성형
('bangkok-aesthetic-demo',
 '방콕 에스테틱 센터 (데모)', 'Bangkok Aesthetic Center',
 'outbound', 'TH', '방콕',
 '["plastic-surgery"]'::jsonb,
 ARRAY['지방흡입', '필러·보톡스', '리프팅'],
 '방콕 시내 성형·피부 클리닉. 회복 기간을 휴양과 결합한 패키지 운영. JCI 인증.',
 ARRAY['JCI 인증', '한국·일본인 환자 전담팀', '풀빌라 회복 패키지', '항공권 포함 견적'],
 3000000, 8000000,
 NULL, NULL, NULL,
 NULL,
 'ai_curated', 'published',
 'AI 큐레이션 데모 데이터.', 3),

-- 인바운드: 강남 성형외과
('gangnam-plastic-demo',
 '강남 미모 성형외과 (데모)', 'Gangnam Mimo Plastic Surgery',
 'inbound', 'KR', '서울 강남구',
 '["plastic-surgery"]'::jsonb,
 ARRAY['코 성형', '눈 성형', '안면윤곽', '가슴 성형'],
 '강남구 신사동 위치. 영어·중국어·일본어·러시아어 통역 상주. 외국인환자 유치 의료기관 등록.',
 ARRAY['외국인환자 유치 등록 의료기관', '4개 언어 통역', '공항 픽업 무료', '회복 모니터링 1주'],
 5000000, 25000000,
 NULL, NULL, NULL,
 NULL,
 'ai_curated', 'published',
 'AI 큐레이션 데모 데이터.', 4),

-- 인바운드: 안동병원 종합검진 (실제 사용자 언급)
('andong-checkup-demo',
 '안동병원 종합검진센터 (데모)', 'Andong Hospital Health Checkup',
 'inbound', 'KR', '경상북도 안동시',
 '["health-checkup"]'::jsonb,
 ARRAY['종합검진', '심뇌혈관 정밀검진', '암 조기검진', '한방 검진'],
 '경북권 거점 종합병원. 외국인 검진 패키지 + 안동·하회마을 관광 연계 프로그램. 영어·중국어 의료 통역 가능.',
 ARRAY['지역 거점 종합병원', '안동 하회마을 관광 연계', '한방·양방 통합검진', 'PET-CT·MRI 1.5일 완료'],
 800000, 3500000,
 NULL, NULL, NULL,
 NULL,
 'ai_curated', 'published',
 'AI 큐레이션 데모 데이터.', 5),

-- 인바운드: 대구 모발이식
('daegu-hair-demo',
 '대구 헤어라인 클리닉 (데모)', 'Daegu Hairline Clinic',
 'inbound', 'KR', '대구광역시',
 '["hair-transplant"]'::jsonb,
 ARRAY['FUE 비절개', '여성 헤어라인', '수염 이식'],
 '대구 동성로 위치. 한국 모발이식 기술을 합리적 가격에 제공. 일본·중국 환자 다수.',
 ARRAY['일본·중국 환자 전담팀', '강남 대비 30% 가격', '여성 전용 시술실', '24시간 응급 연락'],
 3500000, 7000000,
 NULL, NULL, NULL,
 NULL,
 'ai_curated', 'published',
 'AI 큐레이션 데모 데이터.', 6)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
