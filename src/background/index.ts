import '../content/polyfill';

// Background Service Worker

// Securely call the Gemini API
async function callGemini(apiKey: string, systemInstruction: string, prompt: string, history: { role: string; parts: { text: string }[] }[] = []) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    
    // Construct request contents
    const contents = [
      ...history,
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    return { success: true, text };
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CALL_GEMINI') {
    const { systemInstruction, prompt, history } = message.payload;
    
    // Retrieve API key from storage to ensure security
    chrome.storage.local.get(['apiKey']).then(async (data) => {
      const apiKey = data.apiKey;
      if (!apiKey) {
        sendResponse({ success: false, error: 'API Key not found. Please configure it in Leetmate settings.' });
        return;
      }
      
      const result = await callGemini(apiKey, systemInstruction, prompt, history);
      sendResponse(result);
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'VALIDATE_API_KEY') {
    const { key } = message.payload;
    callGemini(key, 'Verify API key by returning exactly: OK', 'Hello')
      .then((result) => {
        if (result.success && result.text.includes('OK')) {
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: result.error || 'Validation failed' });
        }
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    
    return true;
  }
});
