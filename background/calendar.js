import { CALENDAR_API_BASE } from '../utils/constants.js';
import { getAuthToken } from './auth.js';

const buildReminders = (reminderDays) => {
  return reminderDays.map((day) => ({
    method: "popup",
    minutes: day * 24 * 60
  }));
};

export const createCalendarEvent = async (milestone, reminderDays) => {
  const token = await getAuthToken();

  const startTime = new Date(milestone.date);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 minutes

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

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.status}`);
  }

  return await response.json();
};

export const createAllEvents = async (milestones, reminderDaysMap) => {
  const results = await Promise.allSettled(
    milestones.map((milestone) =>
      createCalendarEvent(milestone, reminderDaysMap[milestone.name] || [1])
    )
  );

  return results.map((result, i) => ({
    milestone: milestones[i].name,
    status: result.status,
    error: result.reason?.message || null
  }));
};