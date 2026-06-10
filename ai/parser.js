import { GROQ_API_URL, GROQ_MODEL, MAX_PAGE_TEXT_CHARS } from '../utils/constants.js';
import { extractionPrompt } from './prompt-template.js';

export const extractMilestones = async (pageText) => {
  const storageResult = await chrome.storage.local.get('GROQ_API_KEY');
  const apiKey = storageResult.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key not found in storage. Please check your config.");
  }

  // Truncate page text to avoid exceeding Groq's context window (causes 400)
  const truncatedText = pageText.length > MAX_PAGE_TEXT_CHARS
    ? pageText.slice(0, MAX_PAGE_TEXT_CHARS) + "\n\n[... page truncated ...]"
    : pageText;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "user",
          content: extractionPrompt(truncatedText)
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${errorBody}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Failed to parse Groq response as JSON");
  }
};