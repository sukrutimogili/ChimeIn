const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export const getAuthToken = () => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
};

export const revokeAuthToken = (token) => {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
};