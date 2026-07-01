// FILE: src/services/livability.service.js
// PURPOSE: Compute Livability Index from AQI + noise + parks + solar already in intelligence

function scoreAQI(value) {
  if (value == null) return 50;
  if (value <= 50)  return 100;
  if (value <= 100) return 75;
  if (value <= 200) return 50;
  if (value <= 300) return 25;
  return 10;
}

function scoreNoise(noiseRiskScore) {
  if (noiseRiskScore == null) return 50;
  return Math.max(0, 100 - noiseRiskScore);
}

function scoreParks(parksArray) {
  const count = (parksArray ?? []).filter(p => (p.distanceM ?? 9999) <= 1500).length;
  if (count === 0) return 0;
  if (count === 1) return 50;
  if (count === 2) return 75;
  return 100;
}

function scoreSolar(peakSunHours) {
  if (peakSunHours == null) return 50;
  if (peakSunHours >= 6) return 100;
  if (peakSunHours >= 4) return 75;
  if (peakSunHours >= 2) return 50;
  return 25;
}

function gradeFromScore(score) {
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

export function computeLivabilityIndex(aqi, noise, amenities, solar) {
  const aqiScore   = scoreAQI(aqi?.value);
  const noiseScore = scoreNoise(noise?.noiseRiskScore);
  const parksScore = scoreParks(amenities?.parks);
  const solarScore = scoreSolar(solar?.peakSunHours);

  const score = Math.round(
    aqiScore * 0.30 +
    noiseScore * 0.30 +
    parksScore * 0.20 +
    solarScore * 0.20,
  );

  return {
    score,
    grade: gradeFromScore(score),
    breakdown: {
      aqi:   { score: aqiScore,   weight: 30, value: aqi?.value ?? null },
      noise: { score: noiseScore, weight: 30, value: noise?.estimatedDb ?? null },
      parks: { score: parksScore, weight: 20, value: (amenities?.parks ?? []).filter(p => (p.distanceM ?? 9999) <= 1500).length },
      solar: { score: solarScore, weight: 20, value: solar?.peakSunHours ?? null },
    },
  };
}
