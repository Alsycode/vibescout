// FILE: src/data/cityAQIAverages.js
// PURPOSE: State-wise monthly AQI seasonal averages used as final waterfall fallback

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export const CITY_AQI_AVERAGES = {
  kerala: {
    jan: 45, feb: 42, mar: 40, apr: 38, may: 35,
    jun: 32, jul: 30, aug: 30, sep: 33, oct: 38, nov: 42, dec: 45,
  },
  karnataka: {
    jan: 85, feb: 80, mar: 75, apr: 70, may: 65,
    jun: 55, jul: 50, aug: 48, sep: 55, oct: 65, nov: 75, dec: 82,
  },
  tamilnadu: {
    jan: 80, feb: 75, mar: 70, apr: 68, may: 65,
    jun: 60, jul: 55, aug: 55, sep: 60, oct: 65, nov: 72, dec: 78,
  },
  maharashtra: {
    jan: 120, feb: 115, mar: 100, apr: 90, may: 80,
    jun: 65, jul: 55, aug: 55, sep: 65, oct: 80, nov: 100, dec: 115,
  },
  delhi: {
    jan: 250, feb: 220, mar: 180, apr: 140, may: 120,
    jun: 90, jul: 70, aug: 65, sep: 90, oct: 150, nov: 220, dec: 260,
  },
  uttarpradesh: {
    jan: 220, feb: 190, mar: 160, apr: 130, may: 110,
    jun: 85, jul: 65, aug: 60, sep: 85, oct: 140, nov: 195, dec: 230,
  },
  haryana: {
    jan: 200, feb: 175, mar: 150, apr: 120, may: 100,
    jun: 80, jul: 65, aug: 62, sep: 80, oct: 130, nov: 190, dec: 215,
  },
  rajasthan: {
    jan: 150, feb: 140, mar: 130, apr: 120, may: 130,
    jun: 110, jul: 80, aug: 75, sep: 85, oct: 110, nov: 140, dec: 155,
  },
  gujarat: {
    jan: 130, feb: 120, mar: 110, apr: 100, may: 95,
    jun: 80, jul: 65, aug: 62, sep: 70, oct: 90, nov: 115, dec: 128,
  },
  westbengal: {
    jan: 180, feb: 160, mar: 140, apr: 110, may: 90,
    jun: 70, jul: 55, aug: 52, sep: 70, oct: 110, nov: 155, dec: 175,
  },
  telanagana: {
    jan: 90, feb: 85, mar: 80, apr: 75, may: 70,
    jun: 60, jul: 52, aug: 50, sep: 60, oct: 70, nov: 82, dec: 88,
  },
  andhrapradesh: {
    jan: 85, feb: 80, mar: 75, apr: 70, may: 65,
    jun: 58, jul: 50, aug: 48, sep: 55, oct: 65, nov: 75, dec: 82,
  },
  national_default: {
    jan: 120, feb: 110, mar: 100, apr: 90, may: 85,
    jun: 70, jul: 60, aug: 58, sep: 70, oct: 90, nov: 105, dec: 115,
  },
};

// Maps Nominatim state names to CITY_AQI_AVERAGES keys
export const STATE_NAME_MAP = {
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
  'rajasthan': 'rajasthan',
  'gujarat': 'gujarat',
  'west bengal': 'westbengal',
  'telangana': 'telanagana',
  'andhra pradesh': 'andhrapradesh',
};

export function getSeasonalAQI(stateName) {
  const normalizedState = STATE_NAME_MAP[stateName?.toLowerCase().trim()] ?? null;
  const month = MONTHS[new Date().getMonth()];
  const stateData = normalizedState ? CITY_AQI_AVERAGES[normalizedState] : null;
  const value = stateData?.[month] ?? CITY_AQI_AVERAGES.national_default[month];
  return value;
}
