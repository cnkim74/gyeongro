// 여행 일정 PDF 만들기 (브라우저에서 생성 — 서버 비용 없음)
// 버튼을 누를 때만 불러오도록 ItineraryPdfButton 에서 dynamic import 로 사용

import { Document, Page, Text, View, Link, StyleSheet, Font, pdf } from "@react-pdf/renderer";
import type { Itinerary, DayPlan, ScheduleItem } from "@/components/ItineraryView";

const DAY_COLORS = ["#2563eb", "#e11d48", "#059669", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  Font.register({
    family: "Pretendard",
    fonts: [
      { src: `${origin}/fonts/Pretendard-Regular.subset.woff`, fontWeight: 400 },
      { src: `${origin}/fonts/Pretendard-Bold.subset.woff`, fontWeight: 700 },
    ],
  });
  // 한글은 글자 단위 줄바꿈 허용 (단어 하이픈 처리 끔)
  Font.registerHyphenationCallback((word) => (/[가-힣]/.test(word) ? word.split("") : [word]));
  fontsReady = true;
}

/** 폰트에 없는 이모지·특수기호 제거 (PDF에서 깨짐 방지) */
function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{E0020}-\u{E007F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function won(n: unknown): string {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? `${v.toLocaleString("ko-KR")}원` : "";
}

function mapsUrl(item: ScheduleItem, city: string): string {
  if (item.geo?.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}&query_place_id=${item.geo.placeId}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.place} ${city}`.trim())}`;
}

const s = StyleSheet.create({
  page: { fontFamily: "Pretendard", fontSize: 10, color: "#1f2937", paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36, lineHeight: 1.5 },
  cover: { backgroundColor: "#2563eb", borderRadius: 14, padding: 22, marginBottom: 18, color: "#ffffff" },
  dest: { fontSize: 10, color: "#dbeafe", marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 8, lineHeight: 1.35 },
  summary: { fontSize: 10.5, color: "#eff6ff" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 },
  box: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 14 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 10, color: "#2563eb" },
  bulletText: { flex: 1 },
  budgetRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  budgetCell: { width: "25%", paddingRight: 6, marginBottom: 4 },
  budgetLabel: { fontSize: 8.5, color: "#6b7280" },
  budgetValue: { fontSize: 10.5, fontWeight: 700 },
  dayHeader: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, color: "#ffffff" },
  dayTitle: { fontSize: 13, fontWeight: 700 },
  dayTheme: { fontSize: 9.5, color: "#f1f5f9" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 6 },
  time: { width: 44, fontWeight: 700, color: "#374151" },
  body: { flex: 1 },
  place: { fontSize: 11, fontWeight: 700, color: "#111827", textDecoration: "none" },
  activity: { color: "#374151" },
  meta: { fontSize: 8.5, color: "#6b7280", marginTop: 1 },
  tip: { fontSize: 8.5, color: "#b45309", marginTop: 1 },
  move: { fontSize: 8.5, color: "#0f766e", marginTop: 2 },
  dayFoot: { backgroundColor: "#f9fafb", borderRadius: 8, padding: 8, marginTop: 6, marginBottom: 16, fontSize: 9 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#9ca3af" },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{clean(t)}</Text>
        </View>
      ))}
    </>
  );
}

function DaySection({ day, idx, destination }: { day: DayPlan; idx: number; destination: string }) {
  const color = DAY_COLORS[idx % DAY_COLORS.length];
  const city = clean(day.city) || destination;
  const schedule = Array.isArray(day.schedule) ? day.schedule : [];
  return (
    <View>
      <View style={[s.dayHeader, { backgroundColor: color }]} wrap={false} minPresenceAhead={60}>
        <Text style={s.dayTitle}>
          Day {day.day ?? idx + 1}
          {day.city ? ` · ${clean(day.city)}` : ""} — {clean(day.title)}
        </Text>
        {!!day.theme && <Text style={s.dayTheme}>{clean(day.theme)}</Text>}
      </View>

      {schedule.length === 0 && !!day.plan && <Text style={{ marginBottom: 8 }}>{clean(day.plan)}</Text>}

      {schedule.map((it, i) => {
        const t = it.transport_to_next;
        const metaParts = [clean(it.duration), won(it.cost)].filter(Boolean);
        const moveParts = t ? [clean(t.mode), clean(t.duration), clean(t.cost_kr)].filter(Boolean) : [];
        return (
          <View key={i} style={s.row} wrap={false}>
            <Text style={s.time}>{clean(it.time)}</Text>
            <View style={s.body}>
              <Link src={mapsUrl(it, city)} style={s.place}>
                {clean(it.place)}
              </Link>
              {!!it.activity && <Text style={s.activity}>{clean(it.activity)}</Text>}
              {metaParts.length > 0 && <Text style={s.meta}>{metaParts.join(" · ")}</Text>}
              {!!it.tip && <Text style={s.tip}>TIP · {clean(it.tip)}</Text>}
              {moveParts.length > 0 && <Text style={s.move}>다음 장소로 → {moveParts.join(" · ")}</Text>}
            </View>
          </View>
        );
      })}

      {(day.meal || day.accommodation || day.dayBudget) && (
        <View style={s.dayFoot} wrap={false}>
          {day.meal && (
            <Text>
              식사 · 아침 {clean(day.meal.breakfast) || "-"} / 점심 {clean(day.meal.lunch) || "-"} / 저녁 {clean(day.meal.dinner) || "-"}
            </Text>
          )}
          {!!day.accommodation && <Text>숙소 · {clean(day.accommodation)}</Text>}
          {!!won(day.dayBudget) && <Text>하루 예상 경비 · {won(day.dayBudget)}</Text>}
        </View>
      )}
    </View>
  );
}

function ItineraryDoc({ itinerary, destination }: { itinerary: Itinerary; destination: string }) {
  const b = itinerary.totalBudget;
  const total = b ? (b.accommodation ?? 0) + (b.food ?? 0) + (b.transport ?? 0) + (b.activities ?? 0) : 0;
  const today = new Date().toLocaleDateString("ko-KR");
  return (
    <Document title={clean(itinerary.title) || "여행 일정"} author="Pothos" creator="Pothos (pothostravel.com)">
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.dest}>{clean(destination)} 여행 일정 · Pothos AI 플래너</Text>
          <Text style={s.title}>{clean(itinerary.title)}</Text>
          {!!itinerary.summary && <Text style={s.summary}>{clean(itinerary.summary)}</Text>}
        </View>

        {itinerary.highlights?.length > 0 && (
          <View style={s.box}>
            <Text style={s.sectionTitle}>이번 여행 하이라이트</Text>
            <Bullets items={itinerary.highlights} />
          </View>
        )}

        {total > 0 && (
          <View style={s.box} wrap={false}>
            <Text style={s.sectionTitle}>예상 총 경비 {won(total)}</Text>
            <View style={s.budgetRow}>
              {[
                ["숙박", b.accommodation],
                ["식비", b.food],
                ["교통", b.transport],
                ["즐길거리", b.activities],
              ].map(([label, v]) => (
                <View key={String(label)} style={s.budgetCell}>
                  <Text style={s.budgetLabel}>{label}</Text>
                  <Text style={s.budgetValue}>{won(v) || "-"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={[s.sectionTitle, { fontSize: 15, marginTop: 4 }]}>일자별 일정</Text>
        <Text style={{ fontSize: 8.5, color: "#6b7280", marginBottom: 10 }}>
          장소 이름을 누르면 구글 지도에서 위치를 볼 수 있어요.
        </Text>
        {(itinerary.days ?? []).map((d, i) => (
          <DaySection key={i} day={d} idx={i} destination={destination} />
        ))}

        {itinerary.tips?.length > 0 && (
          <View style={s.box}>
            <Text style={s.sectionTitle}>여행 꿀팁</Text>
            <Bullets items={itinerary.tips} />
            {!!itinerary.bestSeason && (
              <Text style={{ marginTop: 6, color: "#92400e" }}>추천 여행 시기 · {clean(itinerary.bestSeason)}</Text>
            )}
          </View>
        )}

        <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 6 }}>
          AI가 만든 일정이에요. 운영 시간·요금·교통편은 바뀔 수 있으니 출발 전에 꼭 다시 확인하세요.
        </Text>

        <View style={s.footer} fixed>
          <Text>Pothos · pothostravel.com · {today}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** 일정 PDF 파일(Blob) 만들기 */
export async function buildItineraryPdf(itinerary: Itinerary, destination: string): Promise<Blob> {
  registerFonts();
  return pdf(<ItineraryDoc itinerary={itinerary} destination={destination} />).toBlob();
}
