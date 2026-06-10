const getPageText = () => {
  const article = document.querySelector("article, main, [role='main']");
  const target = article || document.body;
  return target.innerText.trim();
};
 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_PAGE") {
    const pageText = getPageText();
 
    if (!pageText || pageText.length < 100) {
      sendResponse({ success: false, error: "Page has no readable content" });
      return true;
    }
 
    sendResponse({ success: true, text: pageText });
    return true;
  }
});