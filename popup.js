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


function getSelectedCategories() {
  const checkboxes = document.querySelectorAll('input[name="flag-category"]:checked');
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
      document.querySelectorAll('input[name="flag-category"]').forEach(cb => cb.checked = false);
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


// New: Initialize filter settings
function initFilterSettings() {
  const filterToggle = document.getElementById("filter-enabled-toggle");
  const filterSettings = document.getElementById("filter-settings");
  const flagCountSlider = document.getElementById("flag-count-slider");
  const flagCountValue = document.getElementById("flag-count-value");
  
  // Load saved settings
  chrome.storage.sync.get(
    ["filterEnabled", "filterMinimumFlags", "filterCategories"],
    (data) => {
      // Default values
      const filterEnabled = data.filterEnabled === true; // default: false
      const filterMinimumFlags = data.filterMinimumFlags || 3;
      const filterCategories = data.filterCategories || [];
      
      // Set UI state
      filterToggle.checked = filterEnabled;
      flagCountSlider.value = filterMinimumFlags;
      flagCountValue.textContent = filterMinimumFlags;
      
      // Set filter category checkboxes
      filterCategories.forEach(category => {
        const checkbox = document.querySelector(`input[name="filter-category"][value="${category}"]`);
        if (checkbox) checkbox.checked = true;
      });
      
      // Update UI state
      updateFilterSettingsState();
    }
  );
  
  // Handle filter enable/disable toggle
  filterToggle.addEventListener("change", async (event) => {
    const filterEnabled = event.target.checked;
    chrome.storage.sync.set({ filterEnabled }, async () => {
      updateFilterSettingsState();
      const response = await sendMessageToActiveTab({ type: "UPDATE_FILTER_SETTINGS" });
      console.log("Filter enabled changed:", filterEnabled, response);
      
      // Show brief status update
      setStatus(filterEnabled ? "Filtering enabled" : "Filtering disabled");
      setTimeout(() => setStatus(""), 1500);
    });
  });
  
  // Handle flag count slider
  flagCountSlider.addEventListener("input", (event) => {
    const value = parseInt(event.target.value, 10);
    flagCountValue.textContent = value;
  });
  
  flagCountSlider.addEventListener("change", async (event) => {
    const filterMinimumFlags = parseInt(event.target.value, 10);
    chrome.storage.sync.set({ filterMinimumFlags }, async () => {
      await sendMessageToActiveTab({ type: "UPDATE_FILTER_SETTINGS" });
    });
  });
  
  // Handle filter category checkboxes
  document.querySelectorAll('input[name="filter-category"]').forEach(checkbox => {
    checkbox.addEventListener("change", async () => {
      const filterCategories = Array.from(
        document.querySelectorAll('input[name="filter-category"]:checked')
      ).map(cb => cb.value);
      
      chrome.storage.sync.set({ filterCategories }, async () => {
        await sendMessageToActiveTab({ type: "UPDATE_FILTER_SETTINGS" });
      });
    });
  });
}

function updateFilterSettingsState() {
  const filterToggle = document.getElementById("filter-enabled-toggle");
  const filterSettings = document.getElementById("filter-settings");
  
  if (filterToggle.checked) {
    filterSettings.classList.remove("disabled");
  } else {
    filterSettings.classList.add("disabled");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initFilterSettings();
  initFlagButton();
  initRefreshButton();
  initDebugButton();
});
