// FILE: test/unit/groqValidator.test.js
// PURPOSE: Stage 2.8 — groqValidator.service.js: Layer 3 of the anti-hallucination
// protocol. Strips hallucinated keys, requires every label to be present and
// non-empty (else template fallback), filters the keyword allowlist, and
// force-corrects any numeric field GROQ tried to change.

import { describe, it, expect } from 'vitest';
import { validateGroqOutput } from '../../src/services/groqValidator.service.js';

function groqResponse(content) {
  return { choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }] };
}

function fullLabels(overrides = {}) {
  return {
    noiseLabel: 'Quiet area.',
    aqiLabel: 'Air is fine.',
    solarLabel: 'Sunny.',
    amenityLabel: 'Good access.',
    budgetLabel: 'In budget.',
    commuteLabel: 'Short commute.',
    verdict: 'Good overall fit.',
    newsLabel: 'No headlines.',
    vastuLabel: 'Favourable.',
    communityLabel: 'Family-friendly.',
    financialNote: 'Within budget.',
    rentalNote: 'Within budget.',
    matchKeywords: ['quiet', 'sunny'],
    ...overrides,
  };
}

const inputVerdictObject = {
  estimatedDb: 50,
  aqiValue: 60,
  peakSunHours: 5,
  nearestHospitalM: 1000,
  nearestSchoolM: 500,
};

describe('validateGroqOutput — malformed input', () => {
  it('returns null when the response has no content', () => {
    expect(validateGroqOutput({ choices: [] }, inputVerdictObject, 'sale')).toBeNull();
    expect(validateGroqOutput(null, inputVerdictObject, 'sale')).toBeNull();
  });

  it('returns null for non-JSON content', () => {
    expect(validateGroqOutput(groqResponse('this is not json'), inputVerdictObject, 'sale')).toBeNull();
  });

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(fullLabels()) + '\n```';
    const result = validateGroqOutput(groqResponse(raw), inputVerdictObject, 'sale');
    expect(result).not.toBeNull();
    expect(result.noiseLabel).toBe('Quiet area.');
  });
});

describe('validateGroqOutput — key allowlisting', () => {
  it('strips keys not in the allowlist for the listing type', () => {
    const result = validateGroqOutput(
      groqResponse(fullLabels({ hallucinatedField: 'made up', anotherOne: 123 })),
      inputVerdictObject,
      'sale',
    );
    expect(result.hallucinatedField).toBeUndefined();
    expect(result.anotherOne).toBeUndefined();
  });

  it('requires financialNote for sale and rentalNote for rent', () => {
    const saleMissingFinancial = validateGroqOutput(
      groqResponse(fullLabels({ financialNote: undefined })),
      inputVerdictObject,
      'sale',
    );
    expect(saleMissingFinancial).toBeNull();

    const rentMissingRental = validateGroqOutput(
      groqResponse(fullLabels({ rentalNote: undefined })),
      inputVerdictObject,
      'rent',
    );
    expect(rentMissingRental).toBeNull();
  });
});

describe('validateGroqOutput — required label completeness', () => {
  it('returns null when a required label is missing', () => {
    const { noiseLabel, ...rest } = fullLabels();
    expect(validateGroqOutput(groqResponse(rest), inputVerdictObject, 'sale')).toBeNull();
  });

  it('returns null when a required label is an empty/whitespace string', () => {
    expect(validateGroqOutput(groqResponse(fullLabels({ verdict: '   ' })), inputVerdictObject, 'sale')).toBeNull();
    expect(validateGroqOutput(groqResponse(fullLabels({ verdict: '' })), inputVerdictObject, 'sale')).toBeNull();
  });

  it('returns null when a required label is the wrong type', () => {
    expect(validateGroqOutput(groqResponse(fullLabels({ aqiLabel: 42 })), inputVerdictObject, 'sale')).toBeNull();
  });

  it('accepts a fully-populated sale response', () => {
    const result = validateGroqOutput(groqResponse(fullLabels()), inputVerdictObject, 'sale');
    expect(result).not.toBeNull();
    expect(result.verdict).toBe('Good overall fit.');
  });
});

describe('validateGroqOutput — matchKeywords filtering', () => {
  it('drops keywords not in the allowlist', () => {
    const result = validateGroqOutput(
      groqResponse(fullLabels({ matchKeywords: ['quiet', 'made-up-keyword', 'sunny'] })),
      inputVerdictObject,
      'sale',
    );
    expect(result.matchKeywords).toEqual(['quiet', 'sunny']);
  });

  it('caps matchKeywords at 3 entries', () => {
    const result = validateGroqOutput(
      groqResponse(fullLabels({ matchKeywords: ['quiet', 'sunny', 'green', 'well-connected'] })),
      inputVerdictObject,
      'sale',
    );
    expect(result.matchKeywords).toHaveLength(3);
  });

  it('leaves a non-array matchKeywords untouched (not filtered)', () => {
    const result = validateGroqOutput(
      groqResponse(fullLabels({ matchKeywords: 'not-an-array' })),
      inputVerdictObject,
      'sale',
    );
    expect(result.matchKeywords).toBe('not-an-array');
  });
});

describe('validateGroqOutput — numeric fields are stripped, never echoed back', () => {
  // NOTE: estimatedDb/aqiValue/peakSunHours/nearestHospitalM/nearestSchoolM are not
  // in ALLOWED_OUTPUT_KEYS_SALE/RENT, so the key-allowlist pass deletes them before
  // the numeric-correction loop ever runs — the "force-correct a tampered numeric
  // field" logic is consequently unreachable given the current allowlists. Pin down
  // the actual (safe) behavior: GROQ can't smuggle a numeric field through at all.
  it('strips a numeric field even when GROQ tried to tamper with it', () => {
    const result = validateGroqOutput(
      groqResponse(fullLabels({ estimatedDb: 999, aqiValue: 1 })),
      inputVerdictObject,
      'sale',
    );
    expect(result.estimatedDb).toBeUndefined();
    expect(result.aqiValue).toBeUndefined();
  });

  it('strips a numeric field even when it matches the true value', () => {
    const result = validateGroqOutput(
      groqResponse(fullLabels({ peakSunHours: 5 })),
      inputVerdictObject,
      'sale',
    );
    expect(result.peakSunHours).toBeUndefined();
  });
});
