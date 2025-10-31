// Firebase Configuration
// In production, load from config.js (not committed to git)
// In development, you can set these values directly
const FIREBASE_CONFIG = (() => {
  // Try to load from external config file (for local development)
  try {
    // This will work if config.js exists
    if (typeof FIREBASE_CONFIG_EXTERNAL !== 'undefined') {
      return FIREBASE_CONFIG_EXTERNAL;
    }
  } catch (e) {
    // Config file doesn't exist, will use defaults or environment
  }
  
  // Default/fallback configuration
  // Users need to create config.js with their own values
  return {
    apiKey: "YOUR_FIREBASE_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    collectionPath: "flags",
    minimumFlagCount: 1
  };
})();

// Backend API base URL
const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${FIREBASE_CONFIG.collectionPath}`;
const flagCache = new Map();
const elementRegistry = new Map();
const VIDEO_CONTAINER_SELECTORS = [
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-reel-item-renderer",
  "ytd-playlist-video-renderer"
].join(",");

let settings = {
  hideFlaggedVideos: false
};
let scanScheduled = false;
let currentWatchVideoId = null;

async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["aiContentUserId"], (data) => {
      if (data.aiContentUserId) {
        resolve(data.aiContentUserId);
        return;
      }

      const newId = crypto.randomUUID();
      chrome.storage.sync.set({ aiContentUserId: newId }, () => resolve(newId));
    });
  });
}

function buildDocumentUrl(videoId) {
  return `${firestoreBaseUrl}/${videoId}?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
}

async function fetchFlagStatus(videoId) {
  if (flagCache.has(videoId)) {
    console.log(`🎯 [AI Filter] Cache hit for ${videoId}:`, flagCache.get(videoId));
    return flagCache.get(videoId);
  }

  const configReady =
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.apiKey.startsWith("YOUR_") &&
    !FIREBASE_CONFIG.projectId.startsWith("YOUR_");

  if (!configReady) {
    console.warn("YouTube AI Content Filter: Backend config missing. Please set up config.js");
    const result = { flagged: false, count: 0, flaggers: [], categories: {} };
    flagCache.set(videoId, result);
    return result;
  }

  try {
    console.log(`🔍 [AI Filter] Fetching flag status for video: ${videoId}`);
    const url = buildDocumentUrl(videoId);
    console.log(`📡 [AI Filter] Request URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`📨 [AI Filter] Response status: ${response.status}`);
    
    if (response.status === 404) {
      console.log(`❌ [AI Filter] Video ${videoId} not found in database`);
      const result = { flagged: false, count: 0, flaggers: [], categories: {} };
      flagCache.set(videoId, result);
      return result;
    }

    const payload = await response.json();
    console.log(`📦 [AI Filter] Backend response:`, payload);
    
    if (!response.ok) {
      throw new Error(payload.error?.message || "Unable to read backend document");
    }

    const fields = payload.fields || {};
    const count = parseInt(fields.aiFlagCount?.integerValue ?? fields.aiFlagCount?.stringValue ?? "0", 10);
    const flaggers =
      fields.flaggers?.arrayValue?.values?.map((entry) => entry.stringValue).filter(Boolean) ?? [];
    
    // Parse categories
    const categories = {};
    if (fields.categories?.mapValue?.fields) {
      Object.keys(fields.categories.mapValue.fields).forEach(key => {
        const value = fields.categories.mapValue.fields[key];
        categories[key] = parseInt(value.integerValue || value.stringValue || "0", 10);
      });
    }
    
    const flagged = Number.isFinite(count) && count >= FIREBASE_CONFIG.minimumFlagCount;
    const result = { 
      flagged, 
      count: Number.isFinite(count) ? count : 0, 
      flaggers,
      categories 
    };
    
    console.log(`✅ [AI Filter] Parsed result for ${videoId}:`, result);
    console.log(`🎨 [AI Filter] Should show badge: ${result.flagged} (count: ${result.count}, minimum: ${FIREBASE_CONFIG.minimumFlagCount})`);
    
    flagCache.set(videoId, result);
    return result;
  } catch (error) {
    console.error("YouTube AI Content Filter: failed to fetch flag state", error);
    const result = { flagged: false, count: 0, flaggers: [], categories: {} };
    flagCache.set(videoId, result);
    return result;
  }
}

function registerElement(videoId, element) {
  if (!elementRegistry.has(videoId)) {
    elementRegistry.set(videoId, new Set());
  }
  elementRegistry.get(videoId).add(element);
  element.dataset.aiVideoId = videoId;
}

function extractVideoId(element) {
  // Check YouTube's own data attributes first (faster and more reliable)
  const videoIdAttr = element.querySelector('[data-video-id]')?.getAttribute('data-video-id');
  if (videoIdAttr) {
    return videoIdAttr;
  }

  // Alternative: href attribute in ytd-thumbnail
  const thumbnailLink = element.querySelector('ytd-thumbnail a');
  if (thumbnailLink?.href) {
    try {
      const url = new URL(thumbnailLink.href, window.location.href);
      if (url.searchParams.has("v")) {
        return url.searchParams.get("v");
      }
    } catch (e) {}
  }

  // Ana anchor elementlerini kontrol et
  const anchor =
    element.querySelector("a#thumbnail") ||
    element.querySelector("a.ytd-thumbnail") ||
    element.querySelector("a#video-title-link") ||
    element.querySelector("a#video-title") ||
    element.querySelector("a[href*='/watch?v=']");

  if (!anchor?.href) {
    // Debug: Sample 1% of cases to understand why anchor is missing
    if (Math.random() < 0.01) {
      console.warn(`⚠️ [AI Filter] No anchor found in element:`, {
        element,
        hasDataVideoId: !!element.querySelector('[data-video-id]'),
        hasThumbnailLink: !!element.querySelector('ytd-thumbnail a'),
        hasThumbnail: !!element.querySelector("a#thumbnail"),
        innerHTML: element.innerHTML.substring(0, 200)
      });
    }
    return null;
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }
    if (url.hostname === "youtu.be") {
      return url.pathname.replace("/", "");
    }
    
    // Handle Shorts URLs
    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.replace("/shorts/", "").split("?")[0];
    }
  } catch (error) {
    console.warn("YouTube AI Content Filter: unable to parse video url", error);
  }

  return null;
}

function ensureBadge(element) {
  let badge = element.querySelector(".ai-content-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "ai-content-badge";
    badge.textContent = "AI Content";
    badge.setAttribute("data-visible", "false");
    
    // Find thumbnail container - try multiple selectors
    const thumbnail = 
      element.querySelector("#thumbnail") || 
      element.querySelector("ytd-thumbnail") ||
      element.querySelector("a#thumbnail-link") ||
      element.querySelector(".ytd-thumbnail") ||
      element.querySelector("yt-image");
    
    if (thumbnail) {
      console.log(`🎯 [AI Filter] Found thumbnail container:`, thumbnail);
      
      // Ensure position is relative
      const computedStyle = window.getComputedStyle(thumbnail);
      if (computedStyle.position === "static") {
        thumbnail.style.setProperty("position", "relative", "important");
      }
      
      // Append badge
      thumbnail.appendChild(badge);
      console.log(`✅ [AI Filter] Badge appended to thumbnail`);
    } else {
      console.warn(`⚠️ [AI Filter] No thumbnail found, appending to element root`);
      element.style.setProperty("position", "relative", "important");
      element.appendChild(badge);
    }
  }
  return badge;
}

function updateElementVisibility(element, flagged) {
  if (flagged && settings.hideFlaggedVideos) {
    element.classList.add("ai-video-hidden");
  } else {
    element.classList.remove("ai-video-hidden");
  }
}

function getCategoryIcons(categories) {
  const iconMap = {
    'ai-video': '🎬',
    'ai-music': '🎵',
    'ai-voice': '🎤',
    'ai-images': '🖼️'
  };
  
  return Object.keys(categories)
    .filter(cat => categories[cat] > 0)
    .map(cat => iconMap[cat] || '🤖')
    .join(' ');
}

function updateBadge(element, flagged, count, categories = {}) {
  const badge = ensureBadge(element);
  console.log(`🎨 [AI Filter] Updating badge - flagged: ${flagged}, count: ${count}, categories:`, categories);
  
  if (flagged) {
    badge.setAttribute("data-visible", "true");
    
    // Add category icons
    const categoryIcons = getCategoryIcons(categories);
    const badgeText = categoryIcons ? `${categoryIcons} AI` : "AI Content";
    badge.textContent = badgeText;
    
    // Build tooltip content
    let tooltipText = `Community flagged (${count})`;
    const categoryCounts = Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([cat, count]) => {
        const names = {
          'ai-video': 'Video',
          'ai-music': 'Music',
          'ai-voice': 'Voice',
          'ai-images': 'Images'
        };
        return `${names[cat] || cat}: ${count}`;
      });
    
    if (categoryCounts.length > 0) {
      tooltipText += '\n' + categoryCounts.join(', ');
    }
    
    badge.title = tooltipText;
    
    console.log(`✨ [AI Filter] Badge shown with categories for element:`, element);
  } else {
    badge.setAttribute("data-visible", "false");
    console.log(`🚫 [AI Filter] Badge hidden for element`);
  }

  updateElementVisibility(element, flagged);
}

async function markVideoIfFlagged(videoId, element) {
  const status = await fetchFlagStatus(videoId);
  console.log(`🏷️ [AI Filter] Marking video ${videoId}:`, { flagged: status.flagged, count: status.count, categories: status.categories });
  updateBadge(element, status.flagged, status.count, status.categories);
}

function processVideos() {
  scanScheduled = false;

  const elements = document.querySelectorAll(VIDEO_CONTAINER_SELECTORS);
  console.log(`🔄 [AI Filter] Processing ${elements.length} video elements`);
  
  let foundCount = 0;
  elements.forEach((element) => {
    const videoId = extractVideoId(element);
    if (!videoId) {
      return;
    }

    foundCount++;
    console.log(`📌 [AI Filter] Found video: ${videoId}`);
    registerElement(videoId, element);
    markVideoIfFlagged(videoId, element);
  });
  
  console.log(`✅ [AI Filter] Successfully processed ${foundCount}/${elements.length} videos`);
  
  // If very few video IDs found and elements exist, retry (timing issue)
  if (foundCount === 0 && elements.length > 0) {
    console.warn(`⚠️ [AI Filter] No video IDs found, will retry in 500ms...`);
    setTimeout(() => {
      console.log(`🔁 [AI Filter] Retrying video scan...`);
      processVideos();
    }, 500);
  } else if (foundCount < elements.length * 0.5 && elements.length > 10) {
    // If found IDs in less than 50% of elements, retry once
    console.warn(`⚠️ [AI Filter] Only found ${foundCount}/${elements.length} IDs, will retry once...`);
    setTimeout(() => {
      console.log(`🔁 [AI Filter] Retrying video scan...`);
      const retryElements = document.querySelectorAll(VIDEO_CONTAINER_SELECTORS);
      retryElements.forEach((element) => {
        // Only process elements not yet processed
        if (!element.dataset.aiVideoId) {
          const videoId = extractVideoId(element);
          if (videoId) {
            console.log(`📌 [AI Filter] Found video on retry: ${videoId}`);
            registerElement(videoId, element);
            markVideoIfFlagged(videoId, element);
          }
        }
      });
    }, 1000);
  }
}

function scheduleScan() {
  if (scanScheduled) {
    return;
  }
  scanScheduled = true;
  setTimeout(processVideos, 250);
}

// Add badge to video title on watch page
async function checkAndMarkWatchPageTitle() {
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get("v");
  
  if (!videoId) {
    return; // Not on a watch page
  }
  
  // Don't check the same video again
  if (currentWatchVideoId === videoId) {
    return;
  }
  
  currentWatchVideoId = videoId;
  console.log(`🎬 [AI Filter] Checking watch page for video: ${videoId}`);
  
  const status = await fetchFlagStatus(videoId);
  
  if (!status.flagged) {
    console.log(`✅ [AI Filter] Video ${videoId} is not flagged`);
    return;
  }
  
  console.log(`🚩 [AI Filter] Video ${videoId} is FLAGGED! Adding title badge...`);
  
  // Find title element
  const titleSelectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1.ytd-watch-metadata',
    'ytd-watch-metadata h1',
    '#title h1'
  ];
  
  let titleElement = null;
  for (const selector of titleSelectors) {
    titleElement = document.querySelector(selector);
    if (titleElement) break;
  }
  
  if (!titleElement) {
    console.warn(`⚠️ [AI Filter] Could not find title element on watch page`);
    // Retry once more
    setTimeout(() => {
      currentWatchVideoId = null; // Reset to retry
      checkAndMarkWatchPageTitle();
    }, 1000);
    return;
  }
  
  // Don't add badge if already exists
  if (titleElement.querySelector('.ai-watch-title-badge')) {
    return;
  }
  
  // Create and add badge
  const badge = document.createElement('span');
  badge.className = 'ai-watch-title-badge';
  
  // Add category icons
  const categoryIcons = getCategoryIcons(status.categories);
  badge.textContent = categoryIcons ? `${categoryIcons} AI CONTENT` : 'AI CONTENT';
  
  // Build tooltip
  let tooltipText = `This video has been flagged as AI content by the community (${status.count} flag${status.count > 1 ? 's' : ''})`;
  const categoryCounts = Object.entries(status.categories || {})
    .filter(([_, count]) => count > 0)
    .map(([cat, count]) => {
      const names = {
        'ai-video': 'AI Video',
        'ai-music': 'AI Music',
        'ai-voice': 'AI Voice',
        'ai-images': 'AI Images'
      };
      return `${names[cat] || cat}: ${count} flag${count > 1 ? 's' : ''}`;
    });
  
  if (categoryCounts.length > 0) {
    tooltipText += '\n\nCategories:\n' + categoryCounts.join('\n');
  }
  
  badge.title = tooltipText;
  
  // Insert badge at the beginning of title
  titleElement.insertBefore(badge, titleElement.firstChild);
  console.log(`✨ [AI Filter] Title badge added with categories!`);
}

async function flagCurrentVideo(categories = []) {
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get("v");
  if (!videoId) {
    return { success: false, message: "No YouTube video detected in this tab." };
  }

  console.log(`🚩 [AI Filter] Flagging video: ${videoId} with categories:`, categories);
  
  const userId = await getUserId();
  console.log(`👤 [AI Filter] User ID: ${userId}`);
  
  // Clear cache to get fresh data
  flagCache.delete(videoId);
  
  const status = await fetchFlagStatus(videoId);
  console.log(`📊 [AI Filter] Current status:`, status);
  
  if (status.flaggers.includes(userId)) {
    return { success: true, message: "You have already flagged this video.", flagged: true };
  }

  const newFlaggers = [...status.flaggers, userId];
  const newCount = status.count + 1;
  
  // Update category counts
  const updatedCategories = { ...status.categories };
  categories.forEach(category => {
    updatedCategories[category] = (updatedCategories[category] || 0) + 1;
  });
  
  // Prepare category object for backend format
  const categoriesMapValue = {
    mapValue: {
      fields: {}
    }
  };
  
  Object.keys(updatedCategories).forEach(key => {
    categoriesMapValue.mapValue.fields[key] = { 
      integerValue: String(updatedCategories[key]) 
    };
  });
  
  const body = {
    fields: {
      aiFlagCount: { integerValue: String(newCount) },
      flaggers: {
        arrayValue: {
          values: newFlaggers.map((id) => ({ stringValue: id }))
        }
      },
      categories: categoriesMapValue,
      lastUpdatedAt: { timestampValue: new Date().toISOString() }
    }
  };

  console.log(`📤 [AI Filter] Sending update:`, body);

  try {
    const response = await fetch(buildDocumentUrl(videoId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      console.error(`❌ [AI Filter] Backend error:`, payload);
      throw new Error(payload.error?.message || `Backend update failed with ${response.status}`);
    }

    const flagged = newCount >= FIREBASE_CONFIG.minimumFlagCount;
    const freshStatus = { flagged, count: newCount, flaggers: newFlaggers, categories: updatedCategories };
    
    console.log(`✅ [AI Filter] Flag successful! New status:`, freshStatus);
    
    // Update cache
    flagCache.set(videoId, freshStatus);
    
    // Clear entire cache to fetch fresh data on homepage
    console.log(`🧹 [AI Filter] Clearing entire cache to force refresh`);
    flagCache.clear();
    
    if (elementRegistry.has(videoId)) {
      elementRegistry.get(videoId).forEach((element) => updateBadge(element, flagged, newCount, updatedCategories));
    }

    return { success: true, message: "Flag submitted. Thanks!", flagged };
  } catch (error) {
    console.error("YouTube AI Content Filter: failed to flag video", error);
    return { success: false, message: error.message };
  }
}

function handleStorageChange(changes, areaName) {
  if (areaName !== "sync") {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "hideFlaggedVideos")) {
    settings.hideFlaggedVideos = Boolean(changes.hideFlaggedVideos.newValue);
    elementRegistry.forEach((elements, videoId) => {
      const cached = flagCache.get(videoId);
      const flagged = cached?.flagged ?? false;
      elements.forEach((element) => updateElementVisibility(element, flagged));
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "FLAG_CURRENT_VIDEO") {
    flagCurrentVideo(message.categories).then(sendResponse);
    return true;
  }

  if (message?.type === "REQUEST_HIDE_PREFERENCE") {
    sendResponse({ hideFlaggedVideos: settings.hideFlaggedVideos });
  }

  if (message?.type === "SET_HIDE_PREFERENCE") {
    settings.hideFlaggedVideos = Boolean(message.hideFlaggedVideos);
    chrome.storage.sync.set({ hideFlaggedVideos: settings.hideFlaggedVideos });
    elementRegistry.forEach((elements, videoId) => {
      const cached = flagCache.get(videoId);
      const flagged = cached?.flagged ?? false;
      elements.forEach((element) => updateElementVisibility(element, flagged));
    });
  }

  if (message?.type === "CLEAR_CACHE_AND_RESCAN") {
    console.log(`🧹 [AI Filter] Manual cache clear requested`);
    flagCache.clear();
    elementRegistry.clear();
    scheduleScan();
    sendResponse({ success: true, message: "Cache cleared and rescanning..." });
  }

  if (message?.type === "DEBUG_BADGES") {
    console.log(`🔍 [AI Filter] === DEBUG: All Badges ===`);
    const allBadges = document.querySelectorAll(".ai-content-badge");
    console.log(`📊 [AI Filter] Total badges found: ${allBadges.length}`);
    allBadges.forEach((badge, index) => {
      const visible = badge.getAttribute("data-visible");
      const computedStyle = window.getComputedStyle(badge);
      console.log(`Badge ${index + 1}:`, {
        visible,
        text: badge.textContent,
        display: computedStyle.display,
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        parent: badge.parentElement?.tagName,
        element: badge
      });
    });
    sendResponse({ success: true, badgeCount: allBadges.length });
  }
});

function init() {
  console.log(`🚀 [AI Filter] Initializing YouTube AI Filter...`);
  
  chrome.storage.sync.get(["hideFlaggedVideos"], (result) => {
    settings.hideFlaggedVideos = Boolean(result.hideFlaggedVideos);
    scheduleScan();
  });

  chrome.storage.onChanged.addListener(handleStorageChange);

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // YouTube navigation events
  document.addEventListener("yt-navigate-finish", () => {
    console.log(`🧭 [AI Filter] Navigation finished, scheduling scan...`);
    currentWatchVideoId = null; // Reset watch video ID
    scheduleScan();
    checkAndMarkWatchPageTitle(); // Check title if on watch page
    
    // Extra retry for subscriptions and similar pages
    setTimeout(() => {
      console.log(`⏰ [AI Filter] Delayed scan (1s after navigation)`);
      scheduleScan();
      checkAndMarkWatchPageTitle(); // Check once more
    }, 1000);
  });
  
  window.addEventListener("yt-page-data-updated", () => {
    console.log(`📄 [AI Filter] Page data updated, scheduling scan...`);
    scheduleScan();
    checkAndMarkWatchPageTitle();
  });
  
  // Special observer for watch page sidebar recommendations
  const watchPageObserver = new MutationObserver(() => {
    // If on watch page and sidebar is loaded
    if (window.location.pathname === '/watch') {
      const relatedVideos = document.querySelector('#related');
      if (relatedVideos) {
        scheduleScan(); // Scan sidebar videos
      }
    }
  });
  
  // Watch secondary column on watch page
  const secondary = document.querySelector('#secondary');
  if (secondary) {
    watchPageObserver.observe(secondary, { childList: true, subtree: true });
  }
  
  // Initial delayed scan on load
  scheduleScan();
  checkAndMarkWatchPageTitle(); // Also check on initial load
  
  setTimeout(() => {
    console.log(`⏰ [AI Filter] Initial delayed scan (2s)`);
    scheduleScan();
    checkAndMarkWatchPageTitle();
  }, 2000);
  
  console.log(`✅ [AI Filter] Initialization complete`);
}

init();
