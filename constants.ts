import { CityWeather, ForecastDay } from './types';

export const getIcon = (slug: string) => {
  const map: Record<string, string> = {
    'clear-day': '☀️',
    'partly-cloudy-day': '⛅',
    'clear-day-hot': '🔥',
    'snow': '❄️',
    'rain': '🌧️',
    'fog': '🌫️',
    'overcast': '☁️',
    'thunderstorm': '⛈️',
    'partly-cloudy-night': '🌙',
    'clear-night': '🌕',
  };
  return map[slug] || '☁️';
};

export const getMoonPhase = (date: Date = new Date()) => {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  if (month < 3) { year--; month += 12; }
  const c = 365.25 * year;
  const e = 30.6 * month;
  const jd = c + e + day - 694039.09; 
  const b = jd / 29.5305882;
  return b - Math.floor(b);
};

export const getMoonPhaseDetails = (phase: number) => {
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
  let name = '';
  if (phase < 0.03 || phase > 0.97) name = 'New Moon';
  else if (phase < 0.23) name = 'Waxing Crescent';
  else if (phase < 0.27) name = 'First Quarter';
  else if (phase < 0.48) name = 'Waxing Gibbous';
  else if (phase < 0.53) name = 'Full Moon';
  else if (phase < 0.73) name = 'Waning Gibbous';
  else if (phase < 0.77) name = 'Last Quarter';
  else name = 'Waning Crescent';
  return { name, illumination };
};

export const getTheme = (isDay: boolean, condition: string, tempC: number, humidity: number = 50) => {
  // 1. NIGHT THEMES (High Contrast Dark)
  if (!isDay) {
    if (['thunderstorm', 'rain'].includes(condition)) {
        return { from: 'from-purple-900', via: 'via-indigo-900', to: 'to-slate-900' };
    }
    if (['snow', 'blizzard'].includes(condition)) {
        return { from: 'from-slate-800', via: 'via-slate-900', to: 'to-black' };
    }
    if (['clear-night', 'partly-cloudy-night'].includes(condition)) {
        return { from: 'from-indigo-950', via: 'via-blue-950', to: 'to-slate-950' };
    }
    return { from: 'from-slate-950', via: 'via-slate-900', to: 'to-black' };
  }

  // 2. DAY THEMES (Vibrant Standard Tailwind Colors)
  if (condition === 'clear-day-hot' || tempC >= 35) {
     return { from: 'from-orange-500', via: 'via-amber-500', to: 'to-red-600' };
  }
  if (['thunderstorm'].includes(condition)) {
      return { from: 'from-indigo-700', via: 'via-purple-800', to: 'to-slate-800' };
  }
  if (['rain', 'showers'].includes(condition)) {
      return { from: 'from-cyan-700', via: 'via-blue-700', to: 'to-slate-700' };
  }
  if (['snow', 'blizzard'].includes(condition)) {
      // Ice/Frost - Much lighter to distinct from Rain
      return { from: 'from-cyan-200', via: 'via-sky-200', to: 'to-blue-100' };
  }
  if (['fog', 'overcast'].includes(condition)) {
      return { from: 'from-slate-500', via: 'via-gray-500', to: 'to-zinc-600' };
  }
  if (['partly-cloudy-day'].includes(condition)) {
      return { from: 'from-sky-500', via: 'via-blue-500', to: 'to-indigo-500' };
  }
  // Clear Day
  return { from: 'from-blue-500', via: 'via-sky-500', to: 'to-cyan-500' };
};

const generateMockForecast = (baseTempF: number, baseIcon: string): ForecastDay[] => {
  return [
    { day: 'Today', icon: baseIcon, high: baseTempF, low: baseTempF - 12 },
    { day: 'Tomorrow', icon: getIcon('partly-cloudy-day'), high: baseTempF + 2, low: baseTempF - 10 },
    { day: 'Wed', icon: getIcon('rain'), high: baseTempF - 5, low: baseTempF - 15 },
    { day: 'Thu', icon: getIcon('clear-day'), high: baseTempF + 5, low: baseTempF - 8 },
  ];
};

export const SAMPLE_CITIES: CityWeather[] = [
  {
    id: 101, city: "Seattle Storm", country: "US", timezone: "America/Los_Angeles",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 12, condition: "Heavy Rain", icon_slug: "rain", humidity: 90, wind_kph: 25 },
    theme: getTheme(true, 'rain', 12, 90), icon: getIcon('rain'),
    forecast: generateMockForecast(54, getIcon('rain')),
    sunrise: "06:12 AM", sunset: "07:45 PM", dayLength: "13h 33m", precipChance: 100, isDay: true
  },
  {
    id: 102, city: "Anchorage Blizzard", country: "US", timezone: "America/Anchorage",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: -5, condition: "Blizzard", icon_slug: "snow", humidity: 80, wind_kph: 40 },
    theme: getTheme(true, 'snow', -5, 80), icon: getIcon('snow'),
    forecast: generateMockForecast(23, getIcon('snow')),
    sunrise: "09:30 AM", sunset: "04:15 PM", dayLength: "6h 45m", precipChance: 95, isDay: true
  },
  {
    id: 103, city: "Dubai Heatwave", country: "AE", timezone: "Asia/Dubai",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 42, condition: "Scorching", icon_slug: "clear-day-hot", humidity: 15, wind_kph: 10 },
    theme: getTheme(true, 'clear-day-hot', 42, 15), icon: getIcon('clear-day-hot'),
    forecast: generateMockForecast(108, getIcon('clear-day-hot')),
    sunrise: "05:45 AM", sunset: "06:30 PM", dayLength: "12h 45m", precipChance: 0, isDay: true
  },
  {
    id: 104, city: "London Fog", country: "GB", timezone: "Europe/London",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 8, condition: "Dense Fog", icon_slug: "fog", humidity: 95, wind_kph: 5 },
    theme: getTheme(true, 'fog', 8, 95), icon: getIcon('fog'),
    forecast: generateMockForecast(46, getIcon('fog')),
    sunrise: "07:10 AM", sunset: "05:50 PM", dayLength: "10h 40m", precipChance: 20, isDay: true
  },
  {
    id: 105, city: "Tokyo Night", country: "JP", timezone: "Asia/Tokyo",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 18, condition: "Clear Night", icon_slug: "clear-night", humidity: 60, wind_kph: 12 },
    theme: getTheme(false, 'clear-night', 18, 60), icon: getIcon('clear-night'),
    forecast: generateMockForecast(65, getIcon('clear-day')),
    sunrise: "05:20 AM", sunset: "06:10 PM", dayLength: "12h 50m", precipChance: 5, isDay: false
  },
  {
    id: 106, city: "Singapore Thunder", country: "SG", timezone: "Asia/Singapore",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 30, condition: "Thunderstorm", icon_slug: "thunderstorm", humidity: 90, wind_kph: 20 },
    theme: getTheme(true, 'thunderstorm', 30, 90), icon: getIcon('thunderstorm'),
    forecast: generateMockForecast(86, getIcon('thunderstorm')),
    sunrise: "06:50 AM", sunset: "07:00 PM", dayLength: "12h 10m", precipChance: 90, isDay: true
  },
  {
    id: 107, city: "Hawaii Sunset", country: "US", timezone: "Pacific/Honolulu",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 27, condition: "Partly Cloudy", icon_slug: "partly-cloudy-day", humidity: 65, wind_kph: 15 },
    theme: getTheme(true, 'partly-cloudy-day', 27, 65), icon: getIcon('partly-cloudy-day'),
    forecast: generateMockForecast(80, getIcon('partly-cloudy-day')),
    sunrise: "06:15 AM", sunset: "06:45 PM", dayLength: "12h 30m", precipChance: 10, isDay: true
  },
  {
    id: 108, city: "Berlin Overcast", country: "DE", timezone: "Europe/Berlin",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 14, condition: "Overcast", icon_slug: "overcast", humidity: 75, wind_kph: 18 },
    theme: getTheme(true, 'overcast', 14, 75), icon: getIcon('overcast'),
    forecast: generateMockForecast(57, getIcon('overcast')),
    sunrise: "06:45 AM", sunset: "07:30 PM", dayLength: "12h 45m", precipChance: 15, isDay: true
  },
  {
    id: 109, city: "Sydney Rainy Night", country: "AU", timezone: "Australia/Sydney",
    coords: { lat: 0, lon: 0 },
    placeholderData: { temp_c: 16, condition: "Showers", icon_slug: "rain", humidity: 85, wind_kph: 22 },
    theme: getTheme(false, 'rain', 16, 85), icon: getIcon('rain'),
    forecast: generateMockForecast(61, getIcon('rain')),
    sunrise: "06:00 AM", sunset: "05:30 PM", dayLength: "11h 30m", precipChance: 80, isDay: false
  },
];
