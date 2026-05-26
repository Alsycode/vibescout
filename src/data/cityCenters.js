// FILE: src/data/cityCenters.js
// PURPOSE: City center coordinates for commute verdict calculation (replaces cityLandmarks.js)

export const CITY_CENTERS = {
  kochi: { lat: 9.9312, lng: 76.2673 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  pune: { lat: 18.5204, lng: 73.8567 },
  delhi: { lat: 28.6139, lng: 77.2090 },
};

export const COMMUTE_SPEEDS = {
  walking: 5,
  two_wheeler: 30,
  auto_rickshaw: 20,
  car: 25,
  public_transport: 18,
};
