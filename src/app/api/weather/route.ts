// Open-Meteo 프록시 — API 키 불필요, 무료
// https://open-meteo.com/en/docs

export const revalidate = 1800; // 30분 캐싱

const WMO_CODE: Record<number, { ko: string; emoji: string }> = {
  0: { ko: "맑음", emoji: "☀️" },
  1: { ko: "대체로 맑음", emoji: "🌤️" },
  2: { ko: "구름 조금", emoji: "⛅" },
  3: { ko: "흐림", emoji: "☁️" },
  45: { ko: "안개", emoji: "🌫️" },
  48: { ko: "착빙성 안개", emoji: "🌫️" },
  51: { ko: "약한 이슬비", emoji: "🌦️" },
  53: { ko: "이슬비", emoji: "🌦️" },
  55: { ko: "강한 이슬비", emoji: "🌧️" },
  61: { ko: "약한 비", emoji: "🌦️" },
  63: { ko: "비", emoji: "🌧️" },
  65: { ko: "강한 비", emoji: "🌧️" },
  71: { ko: "약한 눈", emoji: "🌨️" },
  73: { ko: "눈", emoji: "❄️" },
  75: { ko: "강한 눈", emoji: "❄️" },
  77: { ko: "싸락눈", emoji: "🌨️" },
  80: { ko: "소나기", emoji: "🌦️" },
  81: { ko: "강한 소나기", emoji: "⛈️" },
  82: { ko: "폭우", emoji: "⛈️" },
  85: { ko: "약한 눈보라", emoji: "🌨️" },
  86: { ko: "강한 눈보라", emoji: "❄️" },
  95: { ko: "뇌우", emoji: "⛈️" },
  96: { ko: "우박 동반 뇌우", emoji: "⛈️" },
  99: { ko: "강한 우박 뇌우", emoji: "⛈️" },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return Response.json({ error: "lat/lon required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "5",
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      return Response.json({ error: "weather fetch failed" }, { status: 502 });
    }
    const data = await res.json();

    const code = data.current?.weather_code as number | undefined;
    const wmo = code !== undefined ? WMO_CODE[code] ?? { ko: "알수없음", emoji: "🌡️" } : null;

    const daily = (data.daily?.time ?? []).map((day: string, i: number) => {
      const dCode = data.daily.weather_code[i] as number;
      const meta = WMO_CODE[dCode] ?? { ko: "알수없음", emoji: "🌡️" };
      return {
        date: day,
        max: data.daily.temperature_2m_max[i],
        min: data.daily.temperature_2m_min[i],
        precipitation: data.daily.precipitation_probability_max[i],
        condition: meta.ko,
        emoji: meta.emoji,
      };
    });

    return Response.json({
      current: {
        temperature: data.current?.temperature_2m,
        apparent: data.current?.apparent_temperature,
        humidity: data.current?.relative_humidity_2m,
        wind: data.current?.wind_speed_10m,
        condition: wmo?.ko,
        emoji: wmo?.emoji,
      },
      daily,
      timezone: data.timezone,
    });
  } catch {
    return Response.json({ error: "weather fetch failed" }, { status: 502 });
  }
}
