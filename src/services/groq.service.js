// FILE: src/services/groq.service.js
// PURPOSE: Layer 2 — constrained GROQ formatter. Receives verdict object, returns raw GROQ response for validateGroqOutput to parse.

import { fetchWithTimeout } from '../lib/fetchWithTimeout.js';

const GROQ_SYSTEM_PROMPT = `You are a property report formatter. You receive a verdict object containing computed verdict keys and numeric values only. Your ONLY job is to write one short sentence (max 20 words) for each label key using ONLY the values provided.

Rules you must never break:
- Do not name any city, area, neighbourhood, street, or landmark
- Do not describe the property or its surroundings
- Do not add market comparisons or investment advice
- Do not use adjectives not directly derivable from the input numbers
- Do not include coordinates or location identifiers of any kind
- Return ONLY valid JSON. Start with {. End with }. No markdown. No preamble. No explanation.

For matchKeywords, return only keywords from this exact list:
["quiet","sunny","well-connected","green","family-friendly","budget-friendly","noisy","polluted","high-amenity","low-amenity","bright-home","commute-friendly"]
Pick maximum 3. No others.

For newsLabel, write one sentence (max 20 words) summarizing the provided newsHeadlines array. If newsHeadlines is empty, return: "No recent local developments noted." Do not invent headlines. Only reference what is provided.`;

export async function callGroq(factSheet, listingType) {
  try {
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 500,
        temperature: 0.1,
        messages: [
          { role: 'system', content: GROQ_SYSTEM_PROMPT },
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
