-- ============================================================
-- 다국어 컬럼 추가 (영어) — Phase 2A
-- ============================================================
-- 사용법: Supabase SQL Editor → 전체 복붙 → Run
-- ============================================================
-- 폴백 정책: _en 값이 NULL/빈문자열이면 한국어 원문 사용
-- ============================================================

-- 1. 시술 카테고리 (이미 name_en 있음, 설명만 추가)
ALTER TABLE public.medical_procedures
  ADD COLUMN IF NOT EXISTS description_en text;

-- 2. 클리닉 (영문 설명·하이라이트·도시명)
ALTER TABLE public.medical_clinics
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS highlights_en text[],
  ADD COLUMN IF NOT EXISTS specialties_en text[],
  ADD COLUMN IF NOT EXISTS city_en text;

-- 3. 셰르파 (영문 자기소개·태그라인·도시)
ALTER TABLE public.sherpas
  ADD COLUMN IF NOT EXISTS bio_en text,
  ADD COLUMN IF NOT EXISTS tagline_en text,
  ADD COLUMN IF NOT EXISTS cities_en text[];

-- 4. 데모 영문 채우기 (이미 있는 시드 데이터)
UPDATE public.medical_procedures
   SET description_en = CASE slug
     WHEN 'plastic-surgery' THEN
       'Aesthetic and reconstructive procedures. Korea is world-class in precision and trends, with major clusters in Gangnam (Seoul) and Daegu.'
     WHEN 'health-checkup' THEN
       'Comprehensive checkups, advanced cancer screening, and cardiovascular evaluation. Korean checkup centers are popular for short waits and high-resolution imaging.'
     WHEN 'hair-transplant' THEN
       'FUE, DHI, and robotic hair transplant. Istanbul (Turkey), Budapest (Hungary), and Gangnam (Seoul) are leading hubs for price and technique.'
   END
 WHERE description_en IS NULL;

-- 셰르파 영문 데모 (이름은 그대로 사용 가능)
UPDATE public.sherpas
   SET tagline_en = CASE slug
     WHEN 'seoul-food-jiwon' THEN 'Real-deal food guide for Gangnam, Hongdae & Jongno'
     WHEN 'daegu-medical-yejin' THEN 'Daegu medical concierge — hair, dental & checkups'
     WHEN 'andong-tradition-minho' THEN 'Insider for Hahoe Village & Joseon traditional culture'
     WHEN 'busan-photo-yuna' THEN '100 lifetime shots in Haeundae, Gamcheon & Songdo'
     WHEN 'tokyo-yeji' THEN '8 years in Tokyo — Korean speaker, full local know-how'
     WHEN 'istanbul-medical-junseok' THEN 'Hair transplant escort specialist in Istanbul'
     WHEN 'bangkok-food-haram' THEN 'Bangkok night-market & alley-food navigator'
     WHEN 'paris-photo-soyeon' THEN 'Paris portrait + museum guide (8e arr.)'
   END,
   bio_en = CASE slug
     WHEN 'seoul-food-jiwon' THEN
       'Lived in Seoul for 7 years and built up know-how introducing real local spots to friends from abroad. I know the old-timer noodle shops AND the brand-new openings — fluent in Japanese, Chinese hospitality.'
     WHEN 'daegu-medical-yejin' THEN
       'Based in Daegu for 10+ years with a certified medical interpreter license. I specialize in escorting Japanese and Chinese patients through Korea''s medical tourism cluster — from interpretation through pre/post-care, schedule, and meal guidance.'
     WHEN 'andong-tradition-minho' THEN
       'Born and raised in Andong. I take you deep into Hahoe village ritual, head-family households, and Confucian academies — beyond surface-level tourism into the spirit of Korean culture.'
     WHEN 'busan-photo-yuna' THEN
       '7 years as a portrait photographer in Busan. I guide you to the best photo spots and edit your shots on the spot, sending them via KakaoTalk. SNS-ready images guaranteed.'
     WHEN 'tokyo-yeji' THEN
       'Korean working at a Tokyo IT company for 8 years. I plan efficient routes for first-timers in Tokyo, omakase, hidden food spots, exhibits, or Disneyland. No Japanese needed.'
     WHEN 'istanbul-medical-junseok' THEN
       '5 years in Istanbul, with 100+ Korean hair-transplant escorts. Full 6-day package: airport pickup, hotel check-in, clinic interpretation, pre/post-op care, and city tour. Korean patients only.'
     WHEN 'bangkok-food-haram' THEN
       'Living in Bangkok for 4 years. I navigate Khao San, Chatuchak, and Chinatown night markets like a local. Allergy/spice translation, massage shops, market bargaining — all covered.'
     WHEN 'paris-photo-soyeon' THEN
       '6 years studying photo and art history in Paris. Eiffel/Louvre lifetime shots, curated tours of Orsay & Pompidou, French interpretation + cafe/restaurant accompaniment.'
   END
 WHERE tagline_en IS NULL;

-- 클리닉 영문 데모
UPDATE public.medical_clinics
   SET description_en = CASE slug
     WHEN 'istanbul-hair-clinic-demo' THEN
       'Specialized hair transplant clinic in Istanbul, Turkey. In-house Korean interpreter; 5-night packages including procedure, hotel, and airport pickup. Average 3,000–4,500 grafts per case.'
     WHEN 'budapest-dental-demo' THEN
       'Dental clinic in Budapest, Hungary. EU-grade implants at 1/3 of Korean prices. English-speaking staff.'
     WHEN 'bangkok-aesthetic-demo' THEN
       'Bangkok aesthetic & dermatology clinic. Recovery + resort packages. JCI accredited.'
     WHEN 'gangnam-plastic-demo' THEN
       'Located in Sinsa-dong, Gangnam. In-house interpreters in English/Chinese/Japanese/Russian. Registered as a foreign-patient-attracting medical institution.'
     WHEN 'andong-checkup-demo' THEN
       'Regional flagship hospital in Gyeongbuk. Foreign checkup packages combined with Andong Hahoe village heritage tour. English/Chinese medical interpretation available.'
     WHEN 'daegu-hair-demo' THEN
       'Hair transplant clinic in downtown Daegu. Korean transplant technique at competitive price; serves many Japanese and Chinese patients.'
   END,
   city_en = CASE country
     WHEN 'TR' THEN 'Istanbul'
     WHEN 'HU' THEN 'Budapest'
     WHEN 'TH' THEN 'Bangkok'
     WHEN 'KR' THEN
       CASE slug
         WHEN 'gangnam-plastic-demo' THEN 'Seoul · Gangnam'
         WHEN 'andong-checkup-demo' THEN 'Andong, Gyeongbuk'
         WHEN 'daegu-hair-demo' THEN 'Daegu'
         ELSE 'Korea'
       END
   END
 WHERE description_en IS NULL;

NOTIFY pgrst, 'reload schema';
