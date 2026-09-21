// FILE: test/unit/financialScores.test.js
// PURPOSE: Stage 2.3 — report.routes.js#computeFinancialScores: rent & sale
// paths, all income/price brackets, clamps at the 0/100 stress-score bounds,
// and the rent-baseline comparison wiring.

import { describe, it, expect } from 'vitest';
import { computeFinancialScores } from '../../src/routes/report.routes.js';

describe('computeFinancialScores — rent', () => {
  it('computes rent-to-income percent and a stress-free score', () => {
    const specs = { listingType: 'rent', budgetBracket: '20K–35K' };
    const prefs = { step7: { monthlyHouseholdIncome: '50K–1L' } }; // income midpoint 75000
    const result = computeFinancialScores(specs, prefs, {});
    // rent midpoint for 20K-35K is 27500; 27500/75000*100 = 36.67 -> 37
    expect(result.monthlyRentPercent).toBe(37);
    expect(result.rentToIncomeRatio).toBe(37);
    expect(result.monthlyIncome).toBe(75000);
    expect(result.estimatedRent).toBe(27500);
    expect(result.annualRentBurden).toBe('₹3,30,000 / yr');
  });

  it('prefers actualAmount over the bracket midpoint when provided', () => {
    const specs = { listingType: 'rent', budgetBracket: '20K–35K', actualAmount: 40000 };
    const prefs = { step7: { monthlyHouseholdIncome: '50K–1L' } };
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.estimatedRent).toBe(40000);
  });

  it('clamps the stress-free score at 0 for extreme rent burden', () => {
    const specs = { listingType: 'rent', budgetBracket: 'Above 1L', actualAmount: 500000 };
    const prefs = { step7: { monthlyHouseholdIncome: 'Under 25K' } }; // income 20000
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.rentStressFreeScore).toBe(0);
  });

  it('clamps the stress-free score at 100 for a trivial rent burden', () => {
    const specs = { listingType: 'rent', budgetBracket: 'Under 10K', actualAmount: 100 };
    const prefs = { step7: { monthlyHouseholdIncome: 'Above 3L' } }; // income 350000
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.rentStressFreeScore).toBe(100);
  });

  it('only resolves a rentBaseline comparison when actualAmount is set', () => {
    const specs = { listingType: 'rent', budgetBracket: '20K–35K', bhk: '2BHK' };
    const prefs = { step7: { monthlyHouseholdIncome: '50K–1L' } };
    const withoutActual = computeFinancialScores(specs, prefs, { cityName: 'Mumbai' });
    expect(withoutActual.rentBaseline).toBeNull();

    const withActual = computeFinancialScores({ ...specs, actualAmount: 55000 }, prefs, { cityName: 'Mumbai' });
    expect(withActual.rentBaseline).not.toBeNull();
    expect(withActual.rentBaseline.actualRent).toBe(55000);
  });

  it('falls back to the 75000 income midpoint for an unrecognized income bracket', () => {
    const specs = { listingType: 'rent', budgetBracket: '20K–35K' };
    const prefs = { step7: { monthlyHouseholdIncome: 'not-a-real-bracket' } };
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.monthlyIncome).toBe(75000);
  });

  it('falls back to the 25000 rent midpoint for an unrecognized budget bracket', () => {
    const specs = { listingType: 'rent', budgetBracket: 'not-a-real-bracket' };
    const prefs = { step7: { monthlyHouseholdIncome: '50K–1L' } };
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.estimatedRent).toBe(25000);
  });
});

describe('computeFinancialScores — sale', () => {
  it('computes EMI, affordability ratio, and down payment from an explicit down-payment bracket', () => {
    const specs = { listingType: 'sale', budgetBracket: '60L–1Cr' }; // price 8,000,000
    const prefs = { step7: { monthlyHouseholdIncome: '1L–2L', downPaymentBracket: '10L–20L' } }; // income 150000, downPayment 1,500,000
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.propertyPrice).toBe(8000000);
    expect(result.downPayment).toBe(1500000);
    expect(result.loanAmount).toBe(6500000);
    expect(result.estimatedEMI).toBe(Math.round(6500000 * 0.009));
    expect(result.downPaymentPercent).toBe(Math.round((1500000 / 8000000) * 100));
    expect(result.affordabilityRatio).toBe(result.emiPercent);
  });

  it('defaults down payment to 20% of price when no down-payment bracket is given', () => {
    const specs = { listingType: 'sale', budgetBracket: '60L–1Cr' }; // price 8,000,000
    const prefs = { step7: { monthlyHouseholdIncome: '1L–2L' } };
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.downPayment).toBe(Math.round(8000000 * 0.20));
  });

  it('clamps down payment to the property price when the bracket midpoint exceeds it', () => {
    const specs = { listingType: 'sale', budgetBracket: 'Under 30L' }; // price 2,000,000
    const prefs = { step7: { monthlyHouseholdIncome: '1L–2L', downPaymentBracket: 'Above 1Cr' } }; // 12,500,000 > price
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.downPayment).toBe(2000000);
    expect(result.loanAmount).toBe(0);
    expect(result.estimatedEMI).toBe(0);
  });

  it('clamps the stress-free score at 0 for an extreme EMI burden', () => {
    const specs = { listingType: 'sale', budgetBracket: 'Above 5Cr' }; // price 65,000,000
    const prefs = { step7: { monthlyHouseholdIncome: 'Under 25K' } }; // income 20000
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.stressFreeScore).toBe(0);
  });

  it('clamps the stress-free score at 100 for a trivial EMI burden', () => {
    const specs = { listingType: 'sale', budgetBracket: 'Under 30L' }; // downpayment clamps to full price -> emi 0
    const prefs = { step7: { monthlyHouseholdIncome: 'Above 3L', downPaymentBracket: 'Above 1Cr' } };
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.stressFreeScore).toBe(100);
  });

  it('falls back to the 8,000,000 price midpoint for an unrecognized budget bracket', () => {
    const specs = { listingType: 'sale', budgetBracket: 'not-a-real-bracket' };
    const prefs = { step7: { monthlyHouseholdIncome: '1L–2L' } };
    const result = computeFinancialScores(specs, prefs, {});
    expect(result.propertyPrice).toBe(8000000);
  });
});
