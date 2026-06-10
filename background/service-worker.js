import { GROQ_API_KEY } from './config.js';
import { extractMilestones } from '../ai/parser.js';
import { createAllEvents } from './calendar.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ GROQ_API_KEY }, () => {
    console.log("ChimeIn: Groq key seeded into storage");
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_MILESTONES") {
    handleExtraction(message.pageText)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // keeps the message channel open for async response
  }

  if (message.type === "PUSH_TO_CALENDAR") {
    handleCalendarPush(message.milestones, message.reminderDaysMap)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

const handleExtraction = async (pageText) => {
  if (!pageText || pageText.trim().length === 0) {
    throw new Error("No page text received");
  }
  return await extractMilestones(pageText);
};

const handleCalendarPush = async (milestones, reminderDaysMap) => {
  if (!milestones || milestones.length === 0) {
    throw new Error("No milestones to push");
  }
  return await createAllEvents(milestones, reminderDaysMap);
};