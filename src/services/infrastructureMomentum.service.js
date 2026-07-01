// FILE: src/services/infrastructureMomentum.service.js
// PURPOSE: Scan existing news headlines for infrastructure keywords — no new API call

const INFRA_KEYWORDS = [
  'metro', 'flyover', 'highway', 'ring road', 'elevated road', 'expressway',
  'underpass', 'airport', 'runway', 'terminal', 'railway', 'train station',
  'brts', 'overbridge', 'tunnel', 'road widening', 'interchange',
  'signal-free', 'it corridor', 'tech corridor', 'new road',
];

export function extractInfraSignals(headlines) {
  if (!Array.isArray(headlines) || !headlines.length) {
    return { signals: [], hasSignals: false, count: 0 };
  }

  const signals = [];
  for (const h of headlines) {
    const text = `${h.title ?? ''} ${h.snippet ?? ''}`.toLowerCase();
    const matched = INFRA_KEYWORDS.filter(kw => text.includes(kw));
    if (matched.length) {
      signals.push({
        title:           h.title,
        url:             h.url,
        source:          h.source,
        publishedAt:     h.publishedAt,
        matchedKeywords: matched,
      });
    }
  }

  return {
    signals,
    hasSignals: signals.length > 0,
    count:      signals.length,
  };
}
