document.getElementById('captureButton').addEventListener('click', () => {
    chrome.scripting.executeScript({
      target: { tabId: chrome.tabs.activeTab.id },
      files: ['scripts/screenshot.js']
    });
  });