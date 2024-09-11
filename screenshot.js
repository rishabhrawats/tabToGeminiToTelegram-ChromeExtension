chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'screenshot.png';
    link.click();
  });