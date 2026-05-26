// FILE: src/services/groqValidator.service.js
// PURPOSE: Layer 3 of anti-hallucination protocol — strips hallucinated keys, enforces keyword allowlist, corrects numeric values.

const ALLOWED_KEYWORDS = [
  'quiet', 'sunny', 'well-connected', 'green', 'family-friendly', 'budget-friendly',
  'noisy', 'polluted', 'high-amenity', 'low-amenity', 'bright-home', 'commute-friendly',
];

// PATCH #4 — newsLabel appended to both allowed key arrays
const ALLOWED_OUTPUT_KEYS_SALE = [
  'noiseLabel', 'aqiLabel', 'solarLabel', 'amenityLabel',
  'budgetLabel', 'commuteLabel', 'financialNote', 'matchKeywords', 'verdict',
  'newsLabel',
];

const ALLOWED_OUTPUT_KEYS_RENT = [
  'noiseLabel', 'aqiLabel', 'solarLabel', 'amenityLabel',
  'budgetLabel', 'commuteLabel', 'rentalNote', 'matchKeywords', 'verdict',
  'newsLabel',
];

export function validateGroqOutput(groqResponse, inputVerdictObject, listingType) {
  let parsed;
  try {
    const raw = groqResponse?.choices?.[0]?.message?.content;
    if (!raw) return null;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return null; // triggers template fallback
  }

  const allowedKeys = listingType === 'sale'
    ? ALLOWED_OUTPUT_KEYS_SALE
    : ALLOWED_OUTPUT_KEYS_RENT;

  for (const key of Object.keys(parsed)) {
    if (!allowedKeys.includes(key)) delete parsed[key];
  }

  if (Array.isArray(parsed.matchKeywords)) {
    parsed.matchKeywords = parsed.matchKeywords
      .filter(k => ALLOWED_KEYWORDS.includes(k))
      .slice(0, 3);
  }

  const numericFields = {
    estimatedDb:      inputVerdictObject.estimatedDb,
    aqiValue:         inputVerdictObject.aqiValue,
    peakSunHours:     inputVerdictObject.peakSunHours,
    nearestHospitalM: inputVerdictObject.nearestHospitalM,
    nearestSchoolM:   inputVerdictObject.nearestSchoolM,
  };

  for (const [field, expected] of Object.entries(numericFields)) {
    if (parsed[field] !== undefined && parsed[field] !== expected) {
      parsed[field] = expected;
    }
  }

  return parsed;
}
