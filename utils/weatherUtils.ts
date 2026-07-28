import { CityWeather, ForecastDay, RawAICityWeather } from '../types';
import { getIcon, getTheme } from '../constants';

/**
 * Hydrates raw weather data from AI response into full CityWeather objects.
 * @param rawData - The raw data array from the AI model.
 * @param startIndex - The starting index for IDs to ensure uniqueness.
 * @returns An array of hydrated CityWeather objects.
 */
export const hydrateWeatherData = (rawData: RawAICityWeather[], startIndex: number): CityWeather[] => {
    return rawData.map((item, i) => {
        const tempF = Math.round((item.temp_c * 9 / 5) + 32);
        const icon = getIcon(item.icon_slug);
        const forecast: ForecastDay[] = [
            { day: 'Today', icon: icon, high: tempF, low: tempF - 10 },
            { day: 'Tomorrow', icon: icon, high: tempF + 2, low: tempF - 8 },
            { day: 'Wed', icon: getIcon('partly-cloudy-day'), high: tempF - 2, low: tempF - 12 },
            { day: 'Thu', icon: getIcon('clear-day'), high: tempF + 5, low: tempF - 5 },
        ];
        const theme = getTheme(item.is_day, item.icon_slug, item.temp_c, item.humidity);
        return {
            id: startIndex + i,
            city: item.city,
            country: item.country,
            timezone: "UTC",
            coords: { lat: 0, lon: 0 },
            placeholderData: {
                temp_c: item.temp_c,
                condition: item.condition,
                icon_slug: item.icon_slug,
                humidity: item.humidity,
                wind_kph: item.wind_kph
            },
            theme,
            icon,
            forecast,
            sunrise: "06:00 AM",
            sunset: "07:30 PM",
            dayLength: "13h 30m",
            precipChance: item.humidity > 70 ? 60 : 10,
            isDay: item.is_day // Ensure consistent property naming
        };
    });
};