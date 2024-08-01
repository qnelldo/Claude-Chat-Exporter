console.log("Content script loaded");

function extractTextFromElement(element) {
  if (!element) return "";
  return element.innerText.trim().replace(/\s+/g, " ");
}

function extractCodeBlock(codeBlock) {
  const language =
    codeBlock.querySelector(".language-id")?.textContent.trim() || "plaintext";
  const code =
    codeBlock.querySelector("code")?.innerText.trim() ||
    codeBlock.innerText.trim();
  return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
}

async function extractArtifactContent(artifactButton) {
  const title = artifactButton.textContent.trim();

  return new Promise((resolve) => {
    artifactButton.click();

    const observer = new MutationObserver((mutations, obs) => {
      const artifactContent = document.querySelector(".code-block__code");
      if (artifactContent) {
        obs.disconnect();
        resolve(`[Artifact: ${title}]\n${artifactContent.innerText}\n\n`);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(`[Artifact: ${title} - 내용을 불러오지 못했습니다.]\n\n`);
    }, 5000); // 5초 타임아웃
  });
}

async function extractMessageContent(message) {
  let content = "";

  for (const node of message.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent.trim() + " ";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList.contains("code-block_code")) {
        content += extractCodeBlock(node);
      } else if (
        node.tagName === "BUTTON" &&
        node.classList.contains("border-0.5")
      ) {
        content += await extractArtifactContent(node);
      } else if (node.tagName === "CODE") {
        content += `\`${node.textContent.trim()}\` `;
      } else {
        content += await extractMessageContent(node);
      }
    }
  }

  return content;
}

async function extractChatContent() {
  console.log("Extracting chat content...");
  const chatMessages = document.querySelectorAll(
    ".font-user-message, .font-claude-message"
  );
  let chatContent = "";

  for (const message of chatMessages) {
    const role = message.classList.contains("font-user-message")
      ? "Human"
      : "Claude";
    const content = await extractMessageContent(message);
    chatContent += `${role}:\n${content.trim()}\n\n`;
  }

  console.log("Chat content length:", chatContent.length);
  return chatContent || "No chat content found.";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "exportChat") {
    console.log("Exporting chat...");
    extractChatContent().then((chatContent) => {
      console.log("Sending chat content to popup");
      sendResponse({ success: true, data: chatContent });
    });
    return true; // 비동기 응답을 위해 true 반환
  }
});
