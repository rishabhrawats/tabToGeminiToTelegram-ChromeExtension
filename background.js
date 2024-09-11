const GEMINI_API_KEY = 'AIzaSyB1J8Lpz65E20d-L6jcw3YNWubzme_Mg-w';
const TELEGRAM_BOT_TOKEN = '7471262191:AAFcdYd6BWa0A64_EEdb8OuiHySSh5h1H3c';
const TELEGRAM_CHAT_ID = '2128939773';

async function captureScreenshot() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Screenshot Error: ${chrome.runtime.lastError.message}`));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

async function analyzeWithGemini(dataUrl) {
  console.log('Analyzing with Gemini...');
  const base64Image = dataUrl.split(',')[1];
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {text: "What's in this image? If it's a question, please provide an answer."},
            {
              inline_data: {
                mime_type: "image/png",
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API response was not ok: ${response.status} ${response.statusText}. Error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing with Gemini:', error.message);
    if (error.response) {
      const errorBody = await error.response.text();
      console.error('Error response body:', errorBody);
    }
    return 'Error analyzing image with Gemini: ' + error.message;
  }
}

async function sendToTelegram(dataUrl, analysis) {
  const blob = await fetch(dataUrl).then(r => r.blob());
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('document', blob, 'screenshot.png');
  formData.append('caption', `Gemini Analysis: ${analysis}`);

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API response was not ok: ${response.status} ${response.statusText}. Error: ${errorText}`);
    }
    const data = await response.json();
    if (data.ok) {
      console.log('Screenshot and analysis sent to Telegram successfully');
    } else {
      console.error('Error sending to Telegram:', data.description);
    }
  } catch (error) {
    console.error('Error sending to Telegram:', error);
  }
}

async function handleScreenshot() {
  try {
    const screenshotDataUrl = await captureScreenshot();
    const analysis = await analyzeWithGemini(screenshotDataUrl);
    await sendToTelegram(screenshotDataUrl, analysis);
  } catch (error) {
    console.error('Error handling screenshot:', error.message);
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "take-screenshot") {
    handleScreenshot();
  }
});

chrome.action.onClicked.addListener((tab) => {
  handleScreenshot();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});