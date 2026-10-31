// 외교부 국가·지역별 여행경보 (공공데이터포털 TravelAlarmService2) — 서버 전용
//
// 공공데이터포털에서 '외교부_국가∙지역별 여행경보' 활용신청 필요 (키는 TOURAPI_SERVICE_KEY 와 같은 계정 키)
// 정상 응답만 6시간 캐시 — 미승인·오류는 캐시하지 않음

import { unstable_cache } from "next/cache";
import { serviceKey } from "./tourapi";

const BASE = "https://apis.data.go.kr/1262000/TravelAlarmService2/getTravelAlarmList2";

export interface TravelAlarm {
  country: string;
  countryEn: string;
  continent: string;
  /** 1 여행유의 · 2 여행자제 · 3 출국권고 · 4 여행금지 (0 = 경보 없음 / 정보 없음) */
  level: number;
  regionType: string;
  writtenAt: string;
  mapUrl: string | null;
}

type Row = Record<string, unknown>;

async function fetchAlarm(country: string): Promise<string> {
  const key = serviceKey();
  if (!key) throw new Error("no key");
  const keyParam = /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
  const field = /^[A-Za-z]{2}$/.test(country) ? "cond[country_iso_alp2::EQ]" : "cond[country_nm::EQ]";
  const url =
    `${BASE}?ServiceKey=${keyParam}&returnType=JSON&numOfRows=20&pageNo=1&` +
    `${encodeURIComponent(field)}=${encodeURIComponent(country)}`;
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  // 응답 형식: { response: { header: { resultCode }, body: { items: { item: [...] } } } }
  // 결과 코드 표기가 API마다 달라("0"·"00"·"0000") 숫자로 비교하고, body 가 있으면 정상으로 봄
  let ok = false;
  try {
    const j = JSON.parse(text) as {
      resultCode?: number | string;
      data?: unknown;
      response?: { header?: { resultCode?: string | number }; body?: unknown };
    };
    const code = j.response?.header?.resultCode ?? j.resultCode;
    ok = res.ok && (code !== undefined ? Number(code) === 0 : !!(j.response?.body || j.data));
  } catch {
    ok = false;
  }
  if (!ok) throw new Error(`status=${res.status} raw=${text.slice(0, 300)}`);
  return text;
}

const cachedAlarm = unstable_cache(fetchAlarm, ["travel-alarm-v2"], { revalidate: 6 * 3600 });

/** 나라 이름(한글) 또는 ISO 2자리 코드로 여행경보 조회. 실패하면 null */
export async function getTravelAlarm(country: string): Promise<TravelAlarm[] | null> {
  const q = country.trim().slice(0, 30);
  if (!q) return null;
  try {
    const j = JSON.parse(await cachedAlarm(q)) as {
      data?: Row[];
      response?: { body?: { items?: { item?: Row | Row[] } } };
    };
    const rows: Row[] = Array.isArray(j.data)
      ? j.data
      : (() => {
          const it = j.response?.body?.items?.item;
          return it ? (Array.isArray(it) ? it : [it]) : [];
        })();
    return rows.map((r) => ({
      country: String(r.country_nm ?? ""),
      countryEn: String(r.country_eng_nm ?? ""),
      continent: String(r.continent_nm ?? ""),
      level: Number(r.alarm_lvl ?? 0) || 0,
      regionType: String(r.region_ty ?? ""),
      writtenAt: String(r.written_dt ?? ""),
      mapUrl: typeof r.dang_map_download_url === "string" && r.dang_map_download_url ? String(r.dang_map_download_url) : null,
    }));
  } catch (e) {
    console.log(`[travel-alarm] ${q} failed: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}
