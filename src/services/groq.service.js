// FILE: src/services/groq.service.js
// PURPOSE: Layer 2 — constrained GROQ formatter. Receives verdict object, returns raw GROQ response for validateGroqOutput to parse.

import { fetchWithTimeout } from '../lib/fetchWithTimeout.js';

const GROQ_BASE_PROMPT = `You are a property report formatter. You receive a verdict object containing computed verdict keys and numeric values only. Your ONLY job is to write one short sentence (max 20 words) for each label key using ONLY the values provided.

Rules you must never break:
- Do not name any city, area, neighbourhood, street, or landmark
- Do not describe the property or its surroundings
- Do not use adjectives not directly derivable from the input numbers
- Do not include coordinates or location identifiers of any kind
- Return ONLY valid JSON. Start with {. End with }. No markdown. No preamble. No explanation.

For matchKeywords, return only keywords from this exact list:
["quiet","sunny","well-connected","green","family-friendly","budget-friendly","noisy","polluted","high-amenity","low-amenity","bright-home","commute-friendly"]
Pick maximum 3. No others.

For newsLabel, write one sentence (max 20 words) summarizing the provided newsHeadlines array. If newsHeadlines is empty, return: "No recent local developments noted." Do not invent headlines. Only reference what is provided.

For vastuLabel, write one sentence (max 20 words) about the Vastu alignment of the facingDirection provided. Use vastuVerdict to calibrate tone — pass is favourable, caution is moderate, red_flag is inauspicious. If vastuPreference is not "Yes", return: "Vastu not applied for this report."

For communityLabel, write one sentence (max 20 words) describing why the derivedCharacter matches or mismatches communityPreference. Reference the amenity counts (schoolsNear, parksNear, cafesNear, gymsNear) as evidence. Use communityMatchVerdict to calibrate tone.`;

const FINANCIAL_NOTE_PERSONAL =
  `For financialNote/rentalNote, focus on monthly affordability — frame EMI or rent as a share of income and whether it leaves comfortable headroom.`;

const FINANCIAL_NOTE_INVESTMENT =
  `For financialNote, the user is evaluating this as an investment. Frame the note around capital efficiency: mention the EMI-to-income ratio (emiPercent) and whether the price bracket (propertyBudgetBracket) positions this as an entry-level or premium acquisition. Do not invent yield figures — only use the numbers provided.`;

const FINANCIAL_NOTE_BOTH =
  `For financialNote, the user intends both personal use and investment. Frame the note around dual value: comment on monthly affordability (emiPercent of income) and whether the price bracket suggests long-term value retention. Only use the numbers provided.`;

function buildSystemPrompt(investmentIntent) {
  const suffix = investmentIntent === 'Investment' ? FINANCIAL_NOTE_INVESTMENT
    : investmentIntent === 'Both'       ? FINANCIAL_NOTE_BOTH
    : FINANCIAL_NOTE_PERSONAL;
  return `${GROQ_BASE_PROMPT}\n\n${suffix}`;
}

export async function callGroq(factSheet, listingType, investmentIntent) {
  try {
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        temperature: 0.1,
        messages: [
          { role: 'system', content: buildSystemPrompt(investmentIntent) },
          { role: 'user',   content: JSON.stringify(factSheet) },
        ],
      }),
    }, 10000);

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      console.error('[GROQ] Empty or malformed response');
      return null;
    }

    // Return raw response — validateGroqOutput handles parsing + cleanup
    return data;
  } catch (err) {
    console.error('[GROQ] Request failed:', err.message);
    return null;
  }
}
