export interface CloudLayerConfig {
  z: number;
  seed: number;
  speed: number;
  density: number;
  coverage: number;
  sharpness: number;
  detail: number;
  color: string;
}

export interface CloudSystemConfig {
  fogColor: string;
  fogDensity: number;
  ambientIntensity: number;
  lightIntensity: number;
  layers: CloudLayerConfig[];
}

export interface ForecastDay {
  day: string;
  icon: string;
  high: number;
  low: number;
}

export interface RawAICityWeather {
  city: string;
  country: string;
  temp_c: number;
  condition: string;
  humidity: number;
  wind_kph: number;
  is_day: boolean; // Note: 'is_day' from AI output, transformed to 'isDay' in CityWeather
  icon_slug: 'clear-day' | 'partly-cloudy-day' | 'clear-day-hot' | 'snow' | 'rain' | 'fog' | 'overcast' | 'thunderstorm' | 'partly-cloudy-night' | 'clear-night';
}

export interface CityWeather {
  id: number;
  city: string;
  country: string;
  timezone: string;
  coords: { lat: number; lon: number };
  placeholderData: {
    temp_c: number;
    condition: string;
    icon_slug: string;
    humidity: number;
    wind_kph: number;
  };
  theme: {
    from: string;
    via: string;
    to: string;
  };
  icon: string;
  forecast: ForecastDay[];
  sunrise: string;
  sunset: string;
  dayLength: string;
  precipChance: number;
  isDay: boolean;
}

export interface CustomGradient {
  from: string;
  via: string;
  to: string;
}