const getPageText = () => {
  const article = document.querySelector("article, main, [role='main']");
  const target = article || document.body;
  return target.innerText.trim();
};

const notifyServiceWorker = (pageText) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "EXTRACT_MILESTONES", pageText, pageUrl: window.location.href },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (!response.success) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      }
    );
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_PAGE") {
    const pageText = getPageText();

    if (!pageText || pageText.length < 100) {
      sendResponse({ success: false, error: "Page has no readable content" });
      return;
    }

    notifyServiceWorker(pageText)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true;
  }
});