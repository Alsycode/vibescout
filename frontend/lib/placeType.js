// FILE: lib/placeType.js
// PURPOSE: Soft heuristic to flag when a searched Google Place looks like a business/
//          landmark rather than a residential address, so we can warn the user before
//          they run a livability report on the wrong kind of place.

// Google Place types that are clearly commercial/institutional, not a home.
// Kept conservative on purpose — ambiguous types (point_of_interest, establishment,
// political, locality, etc.) are left alone to avoid false positives on real addresses.
const NON_RESIDENTIAL_TYPES = new Set([
  'store', 'restaurant', 'lodging', 'shopping_mall', 'supermarket', 'convenience_store',
  'clothing_store', 'electronics_store', 'furniture_store', 'hardware_store',
  'jewelry_store', 'shoe_store', 'book_store', 'bicycle_store', 'department_store',
  'liquor_store', 'pet_store', 'car_dealer', 'car_rental', 'car_repair', 'car_wash',
  'beauty_salon', 'hair_care', 'spa', 'gas_station', 'movie_theater', 'night_club',
  'bar', 'cafe', 'bakery', 'meal_delivery', 'meal_takeaway', 'pharmacy', 'doctor',
  'dentist', 'hospital', 'veterinary_care', 'laundry', 'locksmith', 'plumber',
  'electrician', 'real_estate_agency', 'insurance_agency', 'travel_agency', 'lawyer',
  'accounting', 'atm', 'bank', 'casino', 'amusement_park', 'aquarium', 'art_gallery',
  'museum', 'zoo', 'stadium', 'bowling_alley', 'gym', 'airport', 'bus_station',
  'train_station', 'subway_station', 'taxi_stand', 'parking', 'post_office', 'police',
  'fire_station', 'courthouse', 'embassy', 'city_hall', 'local_government_office',
  'library', 'university', 'school', 'primary_school', 'secondary_school',
]);

/**
 * Returns a warning message if the given Google Place `types[]` array looks like a
 * business/landmark rather than a residential address, else null.
 */
export function getNonResidentialWarning(types) {
  if (!Array.isArray(types) || types.length === 0) return null;
  const hit = types.find((t) => NON_RESIDENTIAL_TYPES.has(t));
  if (!hit) return null;
  return "This looks like a business or landmark, not a home. VibeScout analyzes residential livability — results may not be relevant here.";
}
