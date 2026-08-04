// Server-only — never imported in client components.
// Open-Meteo: free, no API key, covers South Africa globally.

export interface WeatherSnapshot {
  type: 'forecast' | 'historical';
  condition: string;
  temperatureCelsius: number;
  tempMinCelsius: number;
  tempMaxCelsius: number;
  rainfallMm: number;
  windKmh: number;
  humidityPercent: number;
  uvIndex: number;
  fetchedAt: string;
}

// Approximate centroids for SA regions
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  KZN:      { lat: -29.6, lng: 30.4 },
  WC:       { lat: -33.9, lng: 18.4 },
  GP:       { lat: -26.2, lng: 28.0 },
  EC:       { lat: -32.3, lng: 26.5 },
  FS:       { lat: -29.1, lng: 26.2 },
  LP:       { lat: -23.9, lng: 29.5 },
  MP:       { lat: -25.5, lng: 30.9 },
  NC:       { lat: -29.1, lng: 23.9 },
  NW:       { lat: -26.7, lng: 25.8 },
  National: { lat: -28.5, lng: 24.7 },
};

// WMO weather code → human label (subset)
function wmoLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export async function fetchWeather(region: string, date: string): Promise<WeatherSnapshot | null> {
  const coords = REGION_COORDS[region];
  if (!coords) return null;

  const eventDate = new Date(date);
  const now = new Date();
  const isPast = eventDate < now;

  try {
    let url: string;
    let type: 'forecast' | 'historical';

    if (isPast) {
      const d = eventDate.toISOString().slice(0, 10);
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lng}&start_date=${d}&end_date=${d}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&hourly=relativehumidity_2m&timezone=Africa%2FJohannesburg`;
      type = 'historical';
    } else {
      const d = eventDate.toISOString().slice(0, 10);
      url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&start_date=${d}&end_date=${d}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&hourly=relativehumidity_2m&timezone=Africa%2FJohannesburg`;
      type = 'forecast';
    }

    const res = await fetch(url, { next: { revalidate: isPast ? 86400 * 30 : 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const d = data.daily;
    if (!d?.weathercode?.[0]) return null;

    const hourlyHumidity: number[] = data.hourly?.relativehumidity_2m ?? [];
    const humidityPercent = hourlyHumidity.length
      ? Math.round(hourlyHumidity.reduce((a: number, b: number) => a + b, 0) / hourlyHumidity.length)
      : 0;

    return {
      type,
      condition: wmoLabel(d.weathercode[0]),
      temperatureCelsius: Math.round((d.temperature_2m_max[0] + d.temperature_2m_min[0]) / 2),
      tempMinCelsius: Math.round(d.temperature_2m_min[0]),
      tempMaxCelsius: Math.round(d.temperature_2m_max[0]),
      rainfallMm: Math.round((d.precipitation_sum[0] ?? 0) * 10) / 10,
      windKmh: Math.round(d.windspeed_10m_max[0] ?? 0),
      humidityPercent,
      uvIndex: Math.round(d.uv_index_max[0] ?? 0),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
