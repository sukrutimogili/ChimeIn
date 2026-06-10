import { GROQ_API_KEY } from './config.js';
import { extractMilestones } from '../ai/parser.js';
import { createAllEvents } from './calendar.js';
import { isDuplicate, markAsAdded } from '../utils/duplicate-check.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ GROQ_API_KEY }, () => {
    console.log("ChimeIn: Groq key seeded into storage");
  });
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting side panel behavior:", error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_MILESTONES") {
    handleExtraction(message.pageText, message.pageUrl)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === "PUSH_TO_CALENDAR") {
    handleCalendarPush(message.milestones, message.reminderDaysMap, message.eventName, message.pageUrl)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

const handleExtraction = async (pageText, pageUrl) => {
  if (!pageText || pageText.trim().length === 0) {
    throw new Error("No page text received");
  }
  const result = await extractMilestones(pageText);
  const duplicate = await isDuplicate(result.eventName, pageUrl);
  if (duplicate) {
    throw new Error(`DUPLICATE::${result.eventName}`);
  }
  return result;
};

const handleCalendarPush = async (milestones, reminderDaysMap, eventName, pageUrl) => {
  if (!milestones || milestones.length === 0) {
    throw new Error("No milestones to push");
  }
  const calendarResult = await createAllEvents(milestones, reminderDaysMap);
  await markAsAdded(eventName, pageUrl);
  return calendarResult;
};