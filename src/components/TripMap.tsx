"use client";

// 여행 지도 — 번호 핀 + 순서대로 잇는 선 (Google Maps JavaScript API)
//
// 구글 길찾기(Directions)는 한국에서 자동차·도보 경로를 지원하지 않으므로 쓰지 않고,
// 장소 좌표를 직접 찍고 선으로 연결한다. → 국내·해외 모두 동일하게 표시됨.
//
// 좌표(geo)는 일정 생성 시 서버가 붙여 줌. 예전에 저장된 일정처럼 좌표가 없거나
// 30일이 지난 경우에는 useResolvedDays() 가 /api/places/resolve 로 다시 받아온다
// (Google 약관: 좌표 캐시 30일).

import { useEffect, useMemo, useRef, useState } from "react";
import type { DayPlan, PlaceGeo } from "@/components/ItineraryView";

type DayLike = Pick<DayPlan, "day" | "title" | "schedule" | "city">;

const DAY_COLORS = [
  "#2563eb", // blue
  "#e11d48", // rose
  "#059669", // emerald
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#db2777", // pink
  "#65a30d", // lime
];
export function dayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length];
}

const GEO_TTL_MS = 29 * 24 * 60 * 60 * 1000;
export function isFresh(geo?: PlaceGeo | null): geo is PlaceGeo {
  return !!geo && Date.now() - new Date(geo.at).getTime() < GEO_TTL_MS;
}

/**
 * 좌표가 없거나 30일 지난 장소를 서버에서 한 번에 다시 받아 채운 days 를 반환.
 * 지도와 장소 정보 패널이 같은 결과를 공유하도록 화면 상위에서 1회 호출.
 */
export function useResolvedDays<T extends DayLike>(days: T[], destination: string): T[] {
  const [extraGeo, setExtraGeo] = useState<Record<string, PlaceGeo | null>>({});

  const missing = useMemo(() => {
    const refs: { key: string; place: string; city: string }[] = [];
    days.forEach((d, di) =>
      (d.schedule ?? []).forEach((it, ii) => {
        if (it.place && !isFresh(it.geo)) {
          refs.push({ key: `${di}:${ii}`, place: it.place, city: d.city || destination });
        }
      })
    );
    return refs;
  }, [days, destination]);
  const signature = missing.map((m) => `${m.key}:${m.place}`).join("|");

  useEffect(() => {
    if (missing.length === 0) return;
    let cancelled = false;
    fetch("/api/places/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: missing.map(({ place, city }) => ({ place, city })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { geo?: (PlaceGeo | null)[] } | null) => {
        if (cancelled || !data?.geo) return;
        const next: Record<string, PlaceGeo | null> = {};
        missing.forEach((m, i) => (next[m.key] = data.geo?.[i] ?? null));
        setExtraGeo(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // 같은 장소 목록이면 다시 요청하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return useMemo(
    () =>
      days.map((d, di) => ({
        ...d,
        schedule: (d.schedule ?? []).map((it, ii) => {
          if (isFresh(it.geo)) return it;
          const g = extraGeo[`${di}:${ii}`];
          return g ? { ...it, geo: g } : it;
        }),
      })),
    [days, extraGeo]
  );
}

/** 대한민국 좌표 범위 — 국내면 카카오맵, 해외면 구글맵으로 길찾기 연결 */
export function isInKorea(lat: number, lng: number): boolean {
  return lat > 33 && lat < 38.7 && lng > 124.5 && lng < 131;
}

export function googlePlaceUrl(name: string, geo?: PlaceGeo | null): string {
  const params = new URLSearchParams({ api: "1", query: name });
  if (geo?.placeId) params.set("query_place_id", geo.placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function kakaoPlaceUrl(name: string, geo: PlaceGeo): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${geo.lat},${geo.lng}`;
}

/** 두 장소 사이 길찾기 링크 — 국내는 카카오맵(대중교통·도보·자동차 지원), 해외는 구글맵 */
export function legDirectionsUrl(
  from: { name: string; geo?: PlaceGeo | null },
  to: { name: string; geo?: PlaceGeo | null }
): string | null {
  if (!from.geo || !to.geo) return null;
  if (isInKorea(from.geo.lat, from.geo.lng) && isInKorea(to.geo.lat, to.geo.lng)) {
    const a = `${encodeURIComponent(from.name)},${from.geo.lat},${from.geo.lng}`;
    const b = `${encodeURIComponent(to.name)},${to.geo.lat},${to.geo.lng}`;
    return `https://map.kakao.com/link/from/${a}/to/${b}`;
  }
  const params = new URLSearchParams({
    api: "1",
    origin: from.name,
    origin_place_id: from.geo.placeId,
    destination: to.name,
    destination_place_id: to.geo.placeId,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// ── Google Maps 스크립트 로더 (페이지당 1회) ─────────────────────────
interface MapsLibs {
  Map: typeof google.maps.Map;
  Polyline: typeof google.maps.Polyline;
  InfoWindow: typeof google.maps.InfoWindow;
  Marker: typeof google.maps.Marker;
  LatLngBounds: typeof google.maps.LatLngBounds;
  SymbolPath: typeof google.maps.SymbolPath;
}
let mapsPromise: Promise<MapsLibs> | null = null;

function loadGoogleMaps(apiKey: string): Promise<MapsLibs> {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    // 타입 정의상 항상 존재하지만, 실제로는 스크립트 로드 전엔 없음
    const g = (window as unknown as { google?: { maps?: { importLibrary?: unknown } } }).google;
    if (g?.maps?.importLibrary) return resolve();
    const cbName = "__pothosMapsReady";
    (window as unknown as Record<string, () => void>)[cbName] = () => resolve();
    const s = document.createElement("script");
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&language=ko&region=KR&loading=async&callback=${cbName}`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps 로드 실패"));
    document.head.appendChild(s);
  })
    .then(async () => {
      const maps = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
      const marker = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
      const core = (await google.maps.importLibrary("core")) as google.maps.CoreLibrary;
      return {
        Map: maps.Map,
        Polyline: maps.Polyline,
        InfoWindow: maps.InfoWindow,
        Marker: marker.Marker,
        LatLngBounds: core.LatLngBounds,
        SymbolPath: core.SymbolPath,
      };
    })
    .catch((e) => {
      mapsPromise = null; // 다음 시도에 재로드
      throw e;
    });
  return mapsPromise;
}

// ── 도로 경로 (/api/routes/day) ──────────────────────────────────────
interface DayRouteData {
  path: [number, number][];
  provider: "kakao" | "google";
  distanceM: number;
  durationS: number;
}
// 같은 페이지 안에서는 같은 동선을 한 번만 요청 (전체 지도·Day 지도 공유)
const routeCache = new Map<string, Promise<DayRouteData | null>>();

function routeSignature(geos: PlaceGeo[]): string {
  return geos.map((g) => `${g.lat.toFixed(5)},${g.lng.toFixed(5)}`).join(";");
}

function fetchDayRoute(geos: PlaceGeo[]): Promise<DayRouteData | null> {
  const sig = routeSignature(geos);
  let pr = routeCache.get(sig);
  if (!pr) {
    pr = fetch("/api/routes/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: geos.map((g) => ({ lat: g.lat, lng: g.lng, placeId: g.placeId })),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { route?: DayRouteData | null } | null) => j?.route ?? null)
      .catch(() => null);
    routeCache.set(sig, pr);
  }
  return pr;
}

function formatRouteSummary(r: DayRouteData): string {
  const km = r.distanceM / 1000;
  const dist = km >= 10 ? `${Math.round(km)}km` : `${km.toFixed(1)}km`;
  const min = Math.round(r.durationS / 60);
  const dur = min >= 60 ? `${Math.floor(min / 60)}시간 ${min % 60}분` : `${min}분`;
  return `자동차 기준 약 ${dist} · ${dur}`;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────

export default function TripMap({
  days,
  /** 처음 보여줄 Day 인덱스 (없으면 전체) */
  initialDayIndex,
  /** 위쪽 Day 탭 표시 여부 */
  showTabs = true,
  height = 320,
}: {
  days: DayLike[];
  initialDayIndex?: number;
  showTabs?: boolean;
  height?: number;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const libsRef = useRef<MapsLibs | null>(null);
  const overlaysRef = useRef<{ setMap: (m: google.maps.Map | null) => void }[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | "all">(initialDayIndex ?? "all");

  const points = useMemo(
    () =>
      days.map((d) =>
        (d.schedule ?? []).map((it) => ({
          name: it.place,
          time: it.time,
          geo: it.geo ?? null,
        }))
      ),
    [days]
  );

  // Day별 도로 경로 (key: 좌표 시그니처, undefined = 불러오는 중)
  const [routes, setRoutes] = useState<Record<string, DayRouteData | null>>({});
  const daySigs = useMemo(
    () =>
      points.map((dp) => {
        const geos = dp.map((p) => p.geo).filter((g): g is PlaceGeo => !!g);
        return geos.length >= 2 ? routeSignature(geos) : "";
      }),
    [points]
  );
  useEffect(() => {
    let cancelled = false;
    points.forEach((dp, di) => {
      const sig = daySigs[di];
      if (!sig) return;
      const geos = dp.map((p) => p.geo).filter((g): g is PlaceGeo => !!g);
      fetchDayRoute(geos).then((r) => {
        if (!cancelled) setRoutes((prev) => (sig in prev ? prev : { ...prev, [sig]: r }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [points, daySigs]);

  // 지도 초기화
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((libs) => {
        if (cancelled || !containerRef.current) return;
        libsRef.current = libs;
        mapRef.current = new libs.Map(containerRef.current, {
          center: { lat: 37.5665, lng: 126.978 },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        infoRef.current = new libs.InfoWindow();
        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError("지도를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // 핀·선 그리기
  useEffect(() => {
    const map = mapRef.current;
    const libs = libsRef.current;
    if (!mapReady || !map || !libs) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    infoRef.current?.close();

    const bounds = new libs.LatLngBounds();
    let count = 0;

    points.forEach((dayPoints, di) => {
      if (selected !== "all" && selected !== di) return;
      const color = dayColor(di);
      const path: google.maps.LatLngLiteral[] = [];

      dayPoints.forEach((p, order) => {
        if (!p.geo) return;
        const pos = { lat: p.geo.lat, lng: p.geo.lng };
        path.push(pos);
        bounds.extend(pos);
        count++;

        const marker = new libs.Marker({
          map,
          position: pos,
          title: p.name,
          icon: {
            path: libs.SymbolPath.CIRCLE,
            scale: 13,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          label: {
            text: selected === "all" ? `${di + 1}-${order + 1}` : String(order + 1),
            color: "#ffffff",
            fontSize: selected === "all" ? "9px" : "11px",
            fontWeight: "700",
          },
          zIndex: 100 + order,
        });
        marker.addListener("click", () => {
          const info = infoRef.current;
          if (!info || !p.geo) return;
          info.setContent(buildInfoContent(p.name, p.time, p.geo, di + 1));
          info.open({ map, anchor: marker });
        });
        overlaysRef.current.push(marker);
      });

      if (path.length >= 2) {
        const route = routes[daySigs[di]];
        const line = route
          ? // 도로 기준 경로
            new libs.Polyline({
              map,
              path: route.path.map(([lat, lng]) => ({ lat, lng })),
              strokeColor: color,
              strokeOpacity: 0.85,
              strokeWeight: 4,
            })
          : // 경로를 불러오는 중이거나 실패 → 점선 직선
            new libs.Polyline({
              map,
              path,
              strokeOpacity: 0,
              icons: [
                {
                  icon: { path: "M 0,-1 0,1", strokeOpacity: 0.6, strokeColor: color, scale: 3 },
                  offset: "0",
                  repeat: "12px",
                },
              ],
            });
        overlaysRef.current.push(line);
      }
    });

    if (count === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    } else if (count > 1) {
      map.fitBounds(bounds, 40);
    }
  }, [mapReady, points, selected, routes, daySigs]);

  // 단일 Day 화면에서 보여줄 경로 요약
  const shownDay = selected === "all" ? null : selected;
  const shownSig = shownDay != null ? daySigs[shownDay] : "";
  const shownRoute = shownSig ? routes[shownSig] : undefined;

  const located = points.flat().filter((p) => p.geo).length;
  const total = points.flat().length;

  if (!apiKey) {
    return (
      <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
        지도를 표시하려면 관리자가 <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> 를 설정해야 해요.
      </div>
    );
  }

  return (
    <div>
      {showTabs && days.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          <button
            onClick={() => setSelected("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selected === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체
          </button>
          {days.map((d, di) => (
            <button
              key={di}
              onClick={() => setSelected(di)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
                selected === di ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={selected === di ? { backgroundColor: dayColor(di) } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selected === di ? "#fff" : dayColor(di) }}
              />
              D{d.day}
            </button>
          ))}
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-slate-100">
        <div ref={containerRef} style={{ width: "100%", height }} />
        {!mapReady && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            지도를 불러오는 중…
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            {loadError}
          </div>
        )}
      </div>

      {mapReady && shownSig && (
        <p className="text-sm text-slate-500 mt-1.5">
          {shownRoute === undefined
            ? "도로 경로를 불러오는 중…"
            : shownRoute
            ? `🚗 ${formatRouteSummary(shownRoute)} (${shownRoute.provider === "kakao" ? "카카오모빌리티" : "Google"})`
            : "도로 경로를 불러오지 못해 점선(직선)으로 표시했어요."}
        </p>
      )}
      {mapReady && total > 0 && located < total && (
        <p className="text-sm text-slate-400 mt-1.5">
          {located === 0
            ? "장소 위치를 찾는 중이에요…"
            : `${total}곳 중 ${located}곳을 지도에 표시했어요. 위치를 찾지 못한 곳은 목록의 [지도] 버튼으로 확인하세요.`}
        </p>
      )}
    </div>
  );
}

/** 핀 클릭 시 정보창 — AI 텍스트를 HTML 로 넣지 않도록 DOM 으로 구성 */
function buildInfoContent(name: string, time: string | undefined, geo: PlaceGeo, dayNo: number): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText = "font-family:inherit;max-width:220px;padding:2px 2px 4px";

  const meta = document.createElement("div");
  meta.style.cssText = "font-size:13px;color:#64748b;margin-bottom:2px";
  meta.textContent = `Day ${dayNo}${time ? ` · ${time}` : ""}`;
  root.appendChild(meta);

  const title = document.createElement("div");
  title.style.cssText = "font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px;line-height:1.3";
  title.textContent = name;
  root.appendChild(title);

  const links = document.createElement("div");
  links.style.cssText = "display:flex;gap:12px;font-size:14px;font-weight:600";
  const add = (label: string, href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = label;
    a.style.cssText = "color:#2563eb;text-decoration:none";
    links.appendChild(a);
  };
  add("구글맵", googlePlaceUrl(name, geo));
  if (isInKorea(geo.lat, geo.lng)) add("카카오맵", kakaoPlaceUrl(name, geo));
  root.appendChild(links);
  return root;
}
