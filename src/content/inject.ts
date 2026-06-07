import './polyfill';

// Injected Script (runs in the MAIN world page context)
(function () {
  console.log('[Leetmate] Injected script active');

  // Utility to find Monaco editors
  function getMonacoCodeAndLang() {
    try {
      // @ts-ignore
      if (window.monaco && window.monaco.editor) {
        // @ts-ignore
        const editors = window.monaco.editor.getEditors();
        if (editors && editors.length > 0) {
          // Find the active or primary editor
          const editor = editors.find((e: any) => e.getDomNode()?.offsetParent !== null) || editors[0];
          const model = editor.getModel();
          if (model) {
            return {
              code: editor.getValue(),
              language: model.getLanguageId(),
              success: true
            };
          }
        }
      }
    } catch (e) {
      console.error('[Leetmate] Failed to extract Monaco editor details:', e);
    }
    return { success: false };
  }

  // Set up listener for messages from the content script
  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'LEETMATE_CONTENT') {
      if (event.data.action === 'GET_EDITOR_STATE') {
        const state = getMonacoCodeAndLang();
        window.postMessage({
          source: 'LEETMATE_INJECTED',
          action: 'EDITOR_STATE',
          payload: state
        }, '*');
      }
    }
  });

  // Intercept window.fetch to capture submission result check runs
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    if (url) {
      const isLeetCode = url.includes('/submissions/detail/') && url.includes('/check/');
      const isGFG = url.includes('/compile') || url.includes('/submit') || url.includes('/run');

      if (isLeetCode || isGFG) {
        try {
          const clonedResponse = response.clone();
          clonedResponse.json().then((data) => {
            console.log('[Leetmate] Intercepted network payload:', url, data);
            
            // Dispatch the intercepted result to the content script
            window.postMessage({
              source: 'LEETMATE_INJECTED',
              action: 'SUBMISSION_INTERCEPTED',
              payload: {
                url,
                data
              }
            }, '*');
          }).catch(err => console.error('[Leetmate] Error reading submission body:', err));
        } catch (e) {
          console.error('[Leetmate] Intercept failed:', e);
        }
      }
    }

    return response;
  };
})();
export {};
