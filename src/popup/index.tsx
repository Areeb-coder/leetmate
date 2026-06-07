import '../content/polyfill';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Key, CheckCircle, HelpCircle, Save, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import '../styles/index.css';
import { ASSISTANT_ICON_URL } from '../store/useStore';

const PopupApp: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['apiKey']).then((data) => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setInputKey(data.apiKey);
        } else {
          setIsEditing(true);
        }
      });
    }
  }, []);

  const handleSaveAndTest = () => {
    if (!inputKey.trim()) {
      setStatus({ type: 'error', msg: 'Key cannot be empty' });
      return;
    }

    setIsValidating(true);
    setStatus(null);

    // Send validation message to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        { action: 'VALIDATE_API_KEY', payload: { key: inputKey } },
        (response) => {
          setIsValidating(false);
          if (response && response.success) {
            chrome.storage.local.set({ apiKey: inputKey, onboarded: true }).then(() => {
              setApiKey(inputKey);
              setIsEditing(false);
              setStatus({ type: 'success', msg: 'API Key verified and saved!' });
            });
          } else {
            setStatus({ type: 'error', msg: response?.error || 'Invalid API Key. Please try again.' });
          }
        }
      );
    } else {
      // Dev mock validation
      setTimeout(() => {
        setIsValidating(false);
        setApiKey(inputKey);
        setIsEditing(false);
        setStatus({ type: 'success', msg: 'Mock API Key saved!' });
      }, 1000);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your API key?')) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(['apiKey', 'onboarded']).then(() => {
          setApiKey('');
          setInputKey('');
          setIsEditing(true);
          setStatus(null);
        });
      }
    }
  };

  return (
    <div className="w-[380px] p-5 bg-[#0B0F19] text-white font-body relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-primary/20 blur-2xl animate-pulse-slow"></div>

      <div className="flex flex-col space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-r from-primary to-secondary rounded-lg">
              <img 
                src={ASSISTANT_ICON_URL} 
                className="w-5 h-5 object-contain" 
                alt="Leetmate" 
              />
            </div>
            <h1 className="text-base font-headline font-bold bg-gradient-to-r from-primary-dim to-secondary text-transparent bg-clip-text">
              Leetmate AI
            </h1>
          </div>
          <div className="flex items-center justify-center p-1 bg-primary/10 border border-primary/20 rounded-lg text-primary-dim text-xs font-headline font-bold">
            v1.0.0
          </div>
        </div>

        {/* API Key Status */}
        {!isEditing && apiKey ? (
          <div className="p-4 rounded-xl bg-surface-normal border border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h3 className="font-bold text-gray-200">API Key Active</h3>
                <p className="text-[10px] text-gray-400">Ready for LeetCode</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-bold px-2.5 py-1 bg-surface-high hover:bg-surface-highest rounded border border-outline-variant/10 transition text-primary-dim"
              >
                Change
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded transition"
                title="Clear Key"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-normal border border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-dim">
              <Key className="w-4 h-4" /> Enter Gemini API Key
            </div>
            
            <div className="space-y-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs rounded-xl glass-input text-white font-mono"
              />
              <button
                onClick={handleSaveAndTest}
                disabled={isValidating}
                className="w-full py-2 px-3 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-lg hover:neon-glow disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                {isValidating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save & Verify Key
                  </>
                )}
              </button>
            </div>
            
            {apiKey && (
              <button
                onClick={() => setIsEditing(false)}
                className="w-full py-1 text-[10px] text-gray-400 hover:text-white text-center transition"
              >
                Cancel Editing
              </button>
            )}
          </div>
        )}

        {status && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-xs border ${
              status.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/10 text-emerald-300'
                : 'bg-red-950/30 border-red-500/10 text-red-300'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <span>{status.msg}</span>
          </div>
        )}

        {/* Steps to get API Key */}
        <div className="p-4 rounded-xl bg-surface-normal border border-outline-variant/10 space-y-3">
          <h3 className="text-xs font-bold font-headline text-gray-200">How to get a Free Gemini API Key:</h3>
          <ol className="list-decimal pl-4 space-y-2 text-[11px] text-gray-300">
            <li className="leading-relaxed">
              Open{' '}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5 font-bold"
              >
                Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
              </a>.
            </li>
            <li className="leading-relaxed">
              Sign in with your Google Account.
            </li>
            <li className="leading-relaxed">
              Click the blue <strong className="text-white font-bold">"Create API Key"</strong> button in the top left.
            </li>
            <li className="leading-relaxed">
              Select/Create a project and copy your generated API Key.
            </li>
            <li className="leading-relaxed">
              Paste the key in the input box above and click <strong className="text-white font-bold">Save & Verify</strong>.
            </li>
          </ol>
        </div>

        {/* Helpful Tips */}
        <div className="p-3 bg-surface-lowest rounded-lg border border-outline-variant/5 text-[10px] text-gray-400 leading-relaxed flex items-start gap-2">
          <HelpCircle className="w-4 h-4 shrink-0 text-primary-dim mt-0.5" />
          <span>
            Once saved, the Leetmate sparkles button will float in the bottom-left corner of all LeetCode problem pages.
          </span>
        </div>
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<PopupApp />);
}
export {};
