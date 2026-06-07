import './polyfill';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useStore, type ProblemDetails } from '../store/useStore';
import { getPlatformAdapter } from '../services/platform';
import { FloatingButton } from '../components/FloatingButton';
import { SidePanel } from '../components/SidePanel';
import { Onboarding } from '../components/Onboarding';
// @ts-ignore
import tailwindStyles from '../styles/index.css?inline';

// Global styles injector inside Shadow DOM
const App: React.FC = () => {
  const {
    apiKey,
    onboarded,
    isPanelOpen,
    setPanelOpen,
    loadFromStorage,
    setCurrentProblem,
    setCurrentLanguage,
    setCurrentCode,
    setLastSubmission
  } = useStore();

  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // 1. Initial storage load and platform detection
  useEffect(() => {
    loadFromStorage();
    const adapter = getPlatformAdapter();
    useStore.getState().setActivePlatform(adapter.getPlatformName(), adapter.getBadge());
  }, []);

  // 2. Poll URL slug changes to detect problem switches (resilient to pathname layout)
  useEffect(() => {
    const checkSlug = () => {
      const match = window.location.pathname.match(/\/problems\/([^/]+)/);
      const newSlug = match ? match[1] : null;
      if (newSlug !== currentSlug) {
        setCurrentSlug(newSlug);
        if (newSlug) {
          const adapter = getPlatformAdapter();
          adapter.extractProblemDetails().then((details) => {
            if (details) {
              setCurrentProblem(details);
              console.log('[Leetmate] Loaded problem metadata via adapter:', details.questionTitle);
            }
          });
        } else {
          setCurrentProblem(null);
        }
      }
    };

    checkSlug();
    const interval = setInterval(checkSlug, 2000);
    return () => clearInterval(interval);
  }, [currentSlug]);

  // 3. Listen to page-world messages (from inject.js)
  useEffect(() => {
    const handlePageMessages = (event: MessageEvent) => {
      if (event.data && event.data.source === 'LEETMATE_INJECTED') {
        const { action, payload } = event.data;
        
        if (action === 'EDITOR_STATE') {
          if (payload.success) {
            setCurrentCode(payload.code);
            setCurrentLanguage(payload.language);
          }
        }
        
        if (action === 'SUBMISSION_INTERCEPTED') {
          const adapter = getPlatformAdapter();
          const result = adapter.interceptSubmission(payload.url, '', payload.data);
          if (result) {
            setLastSubmission(result);
            // Auto switch to Debugger view if wrong answer or error
            if (result.status_code !== 10) {
              useStore.getState().setActiveTab('debugger');
            }
          }
        }
      }
    };

    window.addEventListener('message', handlePageMessages);
    return () => window.removeEventListener('message', handlePageMessages);
  }, []);

  // 4. Periodically request editor updates from page world when panel is open
  useEffect(() => {
    if (!isPanelOpen) return;

    const requestEditorState = () => {
      window.postMessage({
        source: 'LEETMATE_CONTENT',
        action: 'GET_EDITOR_STATE'
      }, '*');
    };

    requestEditorState();
    const interval = setInterval(requestEditorState, 1500);
    return () => clearInterval(interval);
  }, [isPanelOpen]);

  return (
    <>
      <FloatingButton onClick={() => setPanelOpen(true)} isOpen={isPanelOpen} />
      {isPanelOpen && (
        <>
          {onboarded ? (
            <SidePanel onClose={() => setPanelOpen(false)} />
          ) : (
            <div className="fixed top-0 right-0 w-[450px] h-screen bg-surface/90 glass-panel shadow-2xl z-[99999]">
              <div className="absolute top-4 right-4 text-white">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 hover:bg-surface-high rounded-lg text-gray-400 hover:text-white transition"
                >
                  Close
                </button>
              </div>
              <Onboarding />
            </div>
          )}
        </>
      )}
    </>
  );
};

// Injection bootstrap logic
function bootstrap() {
  const containerId = 'leetmate-extension-root';
  if (document.getElementById(containerId)) return;

  if (!document.body) {
    setTimeout(bootstrap, 50);
    return;
  }

  const appContainer = document.createElement('div');
  appContainer.id = containerId;
  document.body.appendChild(appContainer);

  // Attach Shadow Root for complete styling isolation
  const shadowRoot = appContainer.attachShadow({ mode: 'open' });

  // Create style tag inside shadow root and insert raw Tailwind CSS code
  const styleEl = document.createElement('style');
  styleEl.textContent = tailwindStyles;
  shadowRoot.appendChild(styleEl);

  // Mount React app inside the shadow root container
  const reactRoot = document.createElement('div');
  reactRoot.className = 'leetmate-theme-wrapper';
  shadowRoot.appendChild(reactRoot);

  const root = ReactDOM.createRoot(reactRoot);
  root.render(<App />);

  // Also inject the page-script (inject.js) into LeetCode's main context
  const injectScript = document.createElement('script');
  injectScript.src = chrome.runtime.getURL('inject.js');
  (document.head || document.documentElement).appendChild(injectScript);
}

// Bootstrap on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
