// FILE: src/services/solarSavings.service.js
// PURPOSE: Estimate annual solar savings from peak sun hours already in intelligence
// Assumes 3kW rooftop system at ₹8/unit — representative mid-tier Indian figures

const PANEL_KW       = 3;
const EFFICIENCY     = 0.85;
const DAYS_PER_YEAR  = 365;
const RATE_PER_UNIT  = 8; // ₹/kWh

export function computeSolarSavings(peakSunHours) {
  if (peakSunHours == null || peakSunHours <= 0) return null;

  const dailyKwh      = peakSunHours * PANEL_KW * EFFICIENCY;
  const annualKwh     = dailyKwh * DAYS_PER_YEAR;
  const annualSavings = Math.round(annualKwh * RATE_PER_UNIT);

  return {
    annualSavingsRs: annualSavings,
    annualKwh:       Math.round(annualKwh),
    dailyKwh:        parseFloat(dailyKwh.toFixed(1)),
    panelKw:         PANEL_KW,
    displayText:     `₹${annualSavings.toLocaleString('en-IN')}/yr`,
  };
}
