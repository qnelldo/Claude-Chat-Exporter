console.log("Background script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  if (request.action === "downloadChat") {
    console.log("Initiating download...");
    const blob = new Blob([request.data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download(
      {
        url: url,
        filename: "claude_chat_export.txt",
        saveAs: true,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download error:", chrome.runtime.lastError);
        } else {
          console.log("File download initiated, ID:", downloadId);
        }
        URL.revokeObjectURL(url);
      }
    );
  }
});
