import { CALENDAR_API_BASE } from '../utils/constants.js';
import { getAuthToken , revokeAuthToken } from './auth.js';

const buildReminders = (reminderDays) => {
  return reminderDays.map((day) => ({
    method: "popup",
    minutes: day * 24 * 60
  }));
};

export const createCalendarEvent = async (milestone, reminderDays) => {
  const token = await getAuthToken();

  // Normalize datetime-local strings (no tz suffix) to avoid UTC misparse
  const rawDate = milestone.date;
  let startTime;
  if (rawDate.includes('T') || rawDate.includes(' ')) {
    // has time component
    startTime = rawDate.includes('Z') || rawDate.match(/[+-]\d{2}:\d{2}$/)
      ? new Date(rawDate)
      : new Date(rawDate + ':00');
  } else {
    // date only — treat as start of day in local timezone
    const [year, month, day] = rawDate.split('-').map(Number);
    startTime = new Date(year, month - 1, day, 9, 0, 0); // 9am local
  }

  if (isNaN(startTime.getTime())) {
    throw new Error(`Invalid date for "${milestone.name}": ${rawDate}`);
  }
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

  const event = {
    summary: milestone.name,
    description: milestone.eventName
      ? `Event: ${milestone.eventName}${milestone.theme ? `\nTheme: ${milestone.theme}` : ""}`
      : "",
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    reminders: {
      useDefault: false,
      overrides: buildReminders(reminderDays)
    }
  };

  const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });

  if (response.status === 401) {
    await revokeAuthToken(token);
    const freshToken = await getAuthToken();
    const retry = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${freshToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    if (!retry.ok) throw new Error(`Calendar API error: ${retry.status}`);
    return await retry.json();
  }

  if (!response.ok) throw new Error(`Calendar API error: ${response.status}`);
  return await response.json();
};

export const createAllEvents = async (milestones, reminderDaysMap) => {
  const results = await Promise.allSettled(
    milestones.map((milestone) =>
      createCalendarEvent(milestone, reminderDaysMap[milestone.name] || [1])
    )
  );

  const mapped = results.map((result, i) => ({
    milestone: milestones[i].name,
    status: result.status,
    error: result.reason?.message || null
  }));

  const failures = mapped.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    const msg = failures.map(f => `${f.milestone}: ${f.error}`).join('; ');
    throw new Error(`Some events failed to push: ${msg}`);
  }

  return mapped;
};