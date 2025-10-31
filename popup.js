async function getActiveYouTubeTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs.find((candidate) => candidate.url?.includes("youtube.com"));
      resolve(tab || null);
    });
  });
}

async function sendMessageToActiveTab(message) {
  const tab = await getActiveYouTubeTab();
  if (!tab?.id) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, message, resolve);
  });
}

function setStatus(message, isError = false) {
  const statusNode = document.getElementById("status");
  statusNode.textContent = message || "";
  statusNode.dataset.state = isError ? "error" : "ok";
}

function initToggle() {
  const toggle = document.getElementById("hide-toggle");
  chrome.storage.sync.get(["hideFlaggedVideos"], (data) => {
    toggle.checked = Boolean(data.hideFlaggedVideos);
  });

  toggle.addEventListener("change", async (event) => {
    const hideFlaggedVideos = event.target.checked;
    chrome.storage.sync.set({ hideFlaggedVideos }, () => {
      sendMessageToActiveTab({ type: "SET_HIDE_PREFERENCE", hideFlaggedVideos });
    });
  });
}

function getSelectedCategories() {
  const checkboxes = document.querySelectorAll('input[name="category"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function initFlagButton() {
  const button = document.getElementById("flag-button");
  button.addEventListener("click", async () => {
    const categories = getSelectedCategories();
    
    if (categories.length === 0) {
      setStatus("Please select at least one AI content type.", true);
      return;
    }
    
    setStatus("Flagging…");
    const response = await sendMessageToActiveTab({ 
      type: "FLAG_CURRENT_VIDEO",
      categories: categories
    });
    
    if (!response) {
      setStatus("Open a YouTube tab to flag videos.", true);
      return;
    }

    setStatus(response.message || "Done.", !response.success);
    
    // Başarılı flag sonrası checkboxları temizle
    if (response.success) {
      document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
    }
  });
}

function initRefreshButton() {
  const button = document.getElementById("refresh-button");
  button.addEventListener("click", async () => {
    setStatus("Clearing cache and refreshing…");
    const response = await sendMessageToActiveTab({ type: "CLEAR_CACHE_AND_RESCAN" });
    if (!response) {
      setStatus("Open a YouTube tab first.", true);
      return;
    }

    setStatus(response.message || "Refreshed!", !response.success);
  });
}

function initDebugButton() {
  const button = document.getElementById("debug-button");
  button.addEventListener("click", async () => {
    setStatus("Debugging badges… (check console)");
    const response = await sendMessageToActiveTab({ type: "DEBUG_BADGES" });
    if (!response) {
      setStatus("Open a YouTube tab first.", true);
      return;
    }

    setStatus(`Found ${response.badgeCount} badge(s). Check console!`, !response.success);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initToggle();
  initFlagButton();
  initRefreshButton();
  initDebugButton();
});
