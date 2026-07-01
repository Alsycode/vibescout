// FILE: src/services/maturity.service.js
// PURPOSE: Compute Neighbourhood Maturity Score from amenity counts already in intelligence

const CATEGORY_RADII = {
  schools:     2000,
  hospitals:   2000,
  gyms:        1500,
  cafes:       1500,
  restaurants: 1500,
  parks:       1500,
  worship:     1500,
};

function countNearby(arr, radiusM) {
  return (arr ?? []).filter(p => (p.distanceM ?? 9999) <= radiusM).length;
}

function maturityBand(score) {
  if (score >= 80) return 'Mature';
  if (score >= 55) return 'Established';
  if (score >= 30) return 'Developing';
  return 'Early Stage';
}

export function computeMaturityScore(amenities) {
  const counts = {};
  let totalPoints = 0;

  for (const [cat, radius] of Object.entries(CATEGORY_RADII)) {
    const n = countNearby(amenities?.[cat], radius);
    counts[cat] = n;
    totalPoints += Math.min(n, 2); // cap 2 per category, max possible = 14
  }

  const score = Math.round((totalPoints / 14) * 100);

  return {
    score,
    band: maturityBand(score),
    counts,
  };
}
