console.log("Popup script loaded");

document.getElementById("exportBtn").addEventListener("click", async () => {
  console.log("Export button clicked");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.tabs.sendMessage(tab.id, { action: "exportChat" }, (response) => {
      console.log("Received response from content script:", response);
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError.message);
      } else if (response && response.success) {
        console.log("Chat content received, length:", response.data.length);
        if (response.data === "No chat content found.") {
          alert(
            "No chat content found. Please make sure you're on a Claude chat page with conversation history."
          );
        } else {
          downloadChatContent(response.data);
        }
      } else {
        console.error("Failed to export chat");
      }
    });
  } catch (error) {
    console.error("Error querying tabs:", error);
  }
});

function downloadChatContent(content) {
  const blob = new Blob([content], { type: "text/plain" });
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
