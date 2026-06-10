import { GROQ_API_URL, GROQ_MODEL } from '../utils/constants.js';
import { extractionPrompt } from './prompt-template.js';

export const extractMilestones = async (pageText) => {
  const apiKey = process.env.GROQ_API_KEY;

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
          content: extractionPrompt(pageText)
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Failed to parse Groq response as JSON");
  }
};