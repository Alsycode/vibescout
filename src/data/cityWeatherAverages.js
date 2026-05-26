// FILE: src/data/cityWeatherAverages.js
// PURPOSE: State-wise monthly weather averages (temp °C, humidity %) for seasonal fallback

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export const CITY_WEATHER_AVERAGES = {
  kerala: {
    jan: { temp: 30, humidity: 65 }, feb: { temp: 32, humidity: 62 },
    mar: { temp: 34, humidity: 68 }, apr: { temp: 35, humidity: 75 },
    may: { temp: 34, humidity: 80 }, jun: { temp: 29, humidity: 90 },
    jul: { temp: 27, humidity: 92 }, aug: { temp: 27, humidity: 92 },
    sep: { temp: 28, humidity: 88 }, oct: { temp: 30, humidity: 80 },
    nov: { temp: 29, humidity: 75 }, dec: { temp: 29, humidity: 68 },
  },
  karnataka: {
    jan: { temp: 22, humidity: 50 }, feb: { temp: 25, humidity: 45 },
    mar: { temp: 28, humidity: 42 }, apr: { temp: 31, humidity: 45 },
    may: { temp: 30, humidity: 52 }, jun: { temp: 25, humidity: 75 },
    jul: { temp: 23, humidity: 82 }, aug: { temp: 23, humidity: 82 },
    sep: { temp: 25, humidity: 75 }, oct: { temp: 25, humidity: 68 },
    nov: { temp: 22, humidity: 58 }, dec: { temp: 21, humidity: 52 },
  },
  tamilnadu: {
    jan: { temp: 26, humidity: 68 }, feb: { temp: 28, humidity: 65 },
    mar: { temp: 31, humidity: 62 }, apr: { temp: 34, humidity: 65 },
    may: { temp: 36, humidity: 68 }, jun: { temp: 34, humidity: 72 },
    jul: { temp: 33, humidity: 75 }, aug: { temp: 33, humidity: 76 },
    sep: { temp: 32, humidity: 78 }, oct: { temp: 28, humidity: 82 },
    nov: { temp: 25, humidity: 80 }, dec: { temp: 25, humidity: 74 },
  },
  maharashtra: {
    jan: { temp: 22, humidity: 48 }, feb: { temp: 25, humidity: 42 },
    mar: { temp: 29, humidity: 38 }, apr: { temp: 33, humidity: 35 },
    may: { temp: 35, humidity: 40 }, jun: { temp: 30, humidity: 72 },
    jul: { temp: 27, humidity: 85 }, aug: { temp: 27, humidity: 85 },
    sep: { temp: 29, humidity: 75 }, oct: { temp: 30, humidity: 62 },
    nov: { temp: 26, humidity: 52 }, dec: { temp: 23, humidity: 48 },
  },
  delhi: {
    jan: { temp: 10, humidity: 58 }, feb: { temp: 13, humidity: 52 },
    mar: { temp: 20, humidity: 42 }, apr: { temp: 28, humidity: 32 },
    may: { temp: 35, humidity: 28 }, jun: { temp: 38, humidity: 42 },
    jul: { temp: 32, humidity: 75 }, aug: { temp: 31, humidity: 78 },
    sep: { temp: 30, humidity: 65 }, oct: { temp: 24, humidity: 48 },
    nov: { temp: 17, humidity: 50 }, dec: { temp: 12, humidity: 58 },
  },
  uttarpradesh: {
    jan: { temp: 10, humidity: 60 }, feb: { temp: 14, humidity: 55 },
    mar: { temp: 22, humidity: 45 }, apr: { temp: 30, humidity: 35 },
    may: { temp: 38, humidity: 28 }, jun: { temp: 40, humidity: 38 },
    jul: { temp: 33, humidity: 72 }, aug: { temp: 32, humidity: 76 },
    sep: { temp: 30, humidity: 65 }, oct: { temp: 24, humidity: 50 },
    nov: { temp: 17, humidity: 52 }, dec: { temp: 11, humidity: 60 },
  },
  haryana: {
    jan: { temp: 9, humidity: 62 },  feb: { temp: 12, humidity: 55 },
    mar: { temp: 20, humidity: 45 }, apr: { temp: 28, humidity: 35 },
    may: { temp: 36, humidity: 28 }, jun: { temp: 39, humidity: 38 },
    jul: { temp: 32, humidity: 70 }, aug: { temp: 31, humidity: 74 },
    sep: { temp: 29, humidity: 62 }, oct: { temp: 23, humidity: 48 },
    nov: { temp: 16, humidity: 52 }, dec: { temp: 10, humidity: 60 },
  },
  gujarat: {
    jan: { temp: 18, humidity: 52 }, feb: { temp: 21, humidity: 45 },
    mar: { temp: 26, humidity: 40 }, apr: { temp: 32, humidity: 35 },
    may: { temp: 36, humidity: 38 }, jun: { temp: 32, humidity: 68 },
    jul: { temp: 29, humidity: 82 }, aug: { temp: 29, humidity: 82 },
    sep: { temp: 30, humidity: 72 }, oct: { temp: 30, humidity: 58 },
    nov: { temp: 25, humidity: 48 }, dec: { temp: 20, humidity: 52 },
  },
  national_default: {
    jan: { temp: 18, humidity: 58 }, feb: { temp: 21, humidity: 52 },
    mar: { temp: 26, humidity: 48 }, apr: { temp: 31, humidity: 44 },
    may: { temp: 34, humidity: 46 }, jun: { temp: 32, humidity: 68 },
    jul: { temp: 29, humidity: 78 }, aug: { temp: 29, humidity: 78 },
    sep: { temp: 29, humidity: 70 }, oct: { temp: 27, humidity: 60 },
    nov: { temp: 22, humidity: 56 }, dec: { temp: 18, humidity: 58 },
  },
};

// Maps Nominatim state names to CITY_WEATHER_AVERAGES keys
export const WEATHER_STATE_NAME_MAP = {
  'kerala': 'kerala',
  'karnataka': 'karnataka',
  'tamil nadu': 'tamilnadu',
  'tamilnadu': 'tamilnadu',
  'maharashtra': 'maharashtra',
  'delhi': 'delhi',
  'national capital territory of delhi': 'delhi',
  'uttar pradesh': 'uttarpradesh',
  'uttarpradesh': 'uttarpradesh',
  'haryana': 'haryana',
  'gujarat': 'gujarat',
};

export function getSeasonalWeather(stateName) {
  const normalizedState = WEATHER_STATE_NAME_MAP[stateName?.toLowerCase().trim()] ?? null;
  const month = MONTHS[new Date().getMonth()];
  const stateData = normalizedState ? CITY_WEATHER_AVERAGES[normalizedState] : null;
  return stateData?.[month] ?? CITY_WEATHER_AVERAGES.national_default[month];
}
