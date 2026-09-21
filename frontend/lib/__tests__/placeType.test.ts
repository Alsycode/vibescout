// FILE: frontend/lib/__tests__/placeType.test.ts
import { describe, it, expect } from 'vitest';
import { getNonResidentialWarning } from '@/lib/placeType';

describe('getNonResidentialWarning', () => {
  it('warns when a non-residential type is present', () => {
    expect(getNonResidentialWarning(['restaurant', 'point_of_interest'])).toMatch(
      /business or landmark/i,
    );
  });

  it('returns null for a plain residential address', () => {
    expect(getNonResidentialWarning(['street_address', 'geocode'])).toBeNull();
  });

  it('returns null for ambiguous-only types', () => {
    expect(getNonResidentialWarning(['point_of_interest', 'establishment'])).toBeNull();
  });

  it('returns null for empty or invalid input', () => {
    expect(getNonResidentialWarning([])).toBeNull();
    expect(getNonResidentialWarning(undefined as unknown as string[])).toBeNull();
  });
});
