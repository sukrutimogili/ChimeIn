export const extractionPrompt = (pageText) => `
You are an assistant that extracts event milestones from hackathon or competition pages.

Given the following webpage text, extract all milestones (registration deadline, submission deadline, presentation date, results announcement, etc.) and the event theme if mentioned.

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "eventName": "string",
  "theme": "string or null",
  "milestones": [
    {
      "name": "string",
      "date": "ISO 8601 date string or null",
      "confidence": "high or low"
    }
  ]
}

Rules:
- If a date is unclear or missing, set date to null and confidence to "low"
- If no theme is found, set theme to null
- Milestone names should be human-readable, e.g. "Registration Deadline" not "reg_deadline"
- Do not include prize info, team size, or eligibility
- Return only the JSON, no explanation, no markdown backticks

Webpage text:
${pageText}
`;