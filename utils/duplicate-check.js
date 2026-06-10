const STORAGE_KEY = "chimein_added_events";

const getAddedEvents = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
};

const saveAddedEvent = (eventIdentifier) => {
  return new Promise(async (resolve) => {
    const existing = await getAddedEvents();
    const updated = [...new Set([...existing, eventIdentifier])];
    chrome.storage.local.set({ [STORAGE_KEY]: updated }, resolve);
  });
};

export const isDuplicate = async (eventName, pageUrl) => {
  const identifier = `${eventName}::${pageUrl}`;
  const added = await getAddedEvents();
  return added.includes(identifier);
};

export const markAsAdded = async (eventName, pageUrl) => {
  const identifier = `${eventName}::${pageUrl}`;
  await saveAddedEvent(identifier);
};