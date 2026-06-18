import { createMilestoneCard } from './milestone-card.js';
import { openReminderPicker } from './reminder-picker.js';

let milestones = [];
let approvedIndices = new Set();
let rejectedIndices = new Set();
let reminderDaysMap = {};
let currentTab = null;
const DEFAULT_DAYS = [7, 3, 1];

const show = (id) => {
  ['state-idle', 'state-loading', 'state-error', 'state-results', 'state-success']
    .forEach(s => document.getElementById(s).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
};

const renderCheckpoints = () => {
  const list = document.getElementById('checkpoint-list');
  const reminderList = document.getElementById('reminder-list');
  list.innerHTML = '';
  reminderList.innerHTML = '';

  milestones.forEach((m, i) => {
    if (rejectedIndices.has(i)) return;

    if (!reminderDaysMap[m.name]) {
      reminderDaysMap[m.name] = [...DEFAULT_DAYS];
    }

    const card = createMilestoneCard(
      m, i,
      (idx) => approvedIndices.add(idx),
      (idx) => { rejectedIndices.add(idx); renderCheckpoints(); },
      (idx, dateVal) => { milestones[idx].date = dateVal; milestones[idx].confidence = 'high'; }
    );
    list.appendChild(card);

    const row = document.createElement('div');
    row.className = 'reminder-row';
    const days = reminderDaysMap[m.name];
    const tagLabel = days.length === 1
      ? `${days[0]} DAY${days[0] > 1 ? 'S' : ''} OUT`
      : 'CUSTOM';

    row.innerHTML = `
      <span class="reminder-name">${m.name.toLowerCase().replace(/ /g, '_')}</span>
      <button class="reminder-tag" data-name="${m.name}">${tagLabel}</button>
    `;
    row.querySelector('.reminder-tag').addEventListener('click', () => {
      openReminderPicker(m.name, reminderDaysMap[m.name], (newDays) => {
        reminderDaysMap[m.name] = newDays;
        renderCheckpoints();
      });
    });
    reminderList.appendChild(row);
  });
};

// Scrapes page text by injecting a function directly — avoids module/timing issues
// with executeScript + file, which can cause "receiving end does not exist"
const scrapePageText = async (tabId) => {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const article = document.querySelector("article, main, [role='main']");
      const target = article || document.body;
      return target.innerText.trim();
    }
  });

  const text = results?.[0]?.result;
  if (!text || text.length < 100) {
    throw new Error("Page has no readable content");
  }
  return text;
};

document.getElementById('btn-scan').addEventListener('click', async () => {
  show('state-loading');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.startsWith('http')) {
    document.getElementById('error-message').textContent = 'Please navigate to a hackathon page first.';
    show('state-error');
    return;
  }

  currentTab = tab;

  let source = 'UNKNOWN';
  try {
    source = new URL(tab.url).hostname.replace('www.', '').split('.')[0].toUpperCase();
  } catch {
    source = 'UNKNOWN';
  }

  let pageText;
  try {
    pageText = await scrapePageText(tab.id);
  } catch (err) {
    console.error("Failed to scrape page:", err.message);
    document.getElementById('error-message').textContent = err.message || 'Could not read this page.';
    show('state-error');
    return;
  }

  console.log("Forwarding page text to service worker for Groq processing...");

  chrome.runtime.sendMessage(
    { type: 'EXTRACT_MILESTONES', pageText, pageUrl: tab.url },
    (result) => {
      if (chrome.runtime.lastError) {
        document.getElementById('error-message').textContent = 'Service worker error: ' + chrome.runtime.lastError.message;
        show('state-error');
        return;
      }

      if (!result?.success) {
        document.getElementById('error-message').textContent = result?.error || 'Extraction failed.';
        show('state-error');
        return;
      }

      milestones = result.data.milestones || [];
      approvedIndices = new Set();
      rejectedIndices = new Set();
      reminderDaysMap = {};

      document.getElementById('event-name').textContent = result.data.eventName || '';
      document.getElementById('event-source').textContent = source;
      document.getElementById('checkpoint-count').textContent = milestones.length;
      document.getElementById('review-count').textContent = String(milestones.length).padStart(2, '0');

      document.getElementById('event-meta').classList.remove('hidden');
      document.getElementById('checkpoint-badge').classList.remove('hidden');

      renderCheckpoints();
      show('state-results');
    }
  );
});

document.getElementById('btn-retry').addEventListener('click', () => show('state-idle'));

document.getElementById('btn-reset').addEventListener('click', () => {
  document.getElementById('event-meta').classList.add('hidden');
  document.getElementById('checkpoint-badge').classList.add('hidden');
  show('state-idle');
});

document.getElementById('btn-push').addEventListener('click', () => {
  const toPush = milestones
    .filter((milestone, i) => !rejectedIndices.has(i) && milestone.date)
    .map(milestone => ({ ...milestone, eventName: document.getElementById('event-name').textContent }));

  if (toPush.length === 0) {
    document.getElementById('error-message').textContent = 'No checkpoints with valid dates. Set dates before pushing.';
    show('state-error');
    return;
  }

  show('state-loading');

  chrome.runtime.sendMessage(
    {
      type: 'PUSH_TO_CALENDAR',
      milestones: toPush,
      reminderDaysMap,
      eventName: document.getElementById('event-name').textContent,
      pageUrl: currentTab?.url
    },
    (result) => {
      if (chrome.runtime.lastError) {
        document.getElementById('error-message').textContent = 'Service worker error: ' + chrome.runtime.lastError.message;
        show('state-error');
        return;
      }

      if (!result?.success) {
        document.getElementById('error-message').textContent = result?.error || 'Calendar push failed.';
        show('state-error');
        return;
      }

      show('state-success');
    }
  );
});
