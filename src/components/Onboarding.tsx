import React, { useState } from 'react';
import { useStore, safeSendMessage, ASSISTANT_ICON_URL } from '../store/useStore';
import { Key, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { setApiKey, setOnboarded } = useStore();

  const handleValidateKey = () => {
    if (!apiKeyInput.trim()) {
      setErrorMsg('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setErrorMsg('');

    // Send validation message to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      safeSendMessage(
        { action: 'VALIDATE_API_KEY', payload: { key: apiKeyInput } },
        (response) => {
          setIsValidating(false);
          if (response && response.success) {
            setApiKey(apiKeyInput);
            setStep(3);
          } else {
            setErrorMsg(response?.error || 'Invalid API key. Please check and try again.');
          }
        }
      );
    } else {
      // Offline / dev fallback
      setTimeout(() => {
        setIsValidating(false);
        setApiKey(apiKeyInput);
        setStep(3);
      }, 1000);
    }
  };

  const handleFinish = () => {
    setOnboarded(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-white font-body">
      <div className="w-full max-w-md p-6 rounded-2xl glass-panel relative overflow-hidden">
        {/* Background light glow orbs */}
        <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-primary/20 blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-secondary/20 blur-3xl animate-pulse-slow"></div>

        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-5 relative z-10">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-2xl neon-glow">
              <img 
                src={ASSISTANT_ICON_URL} 
                className="w-10 h-10 object-contain" 
                alt="Leetmate AI" 
              />
            </div>
            <h2 className="text-2xl font-headline font-bold bg-gradient-to-r from-primary-dim to-secondary text-transparent bg-clip-text">
              Welcome to Leetmate
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your premium, AI-powered LeetCode mentor and interview coach. Get hints, deep-dive into logic, visualisations, and review code inside the page.
            </p>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:neon-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full justify-center"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold text-white">Enter Gemini API Key</h3>
                <p className="text-xs text-gray-400">Securely stored locally on your machine</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Leetmate uses the <strong>gemini-2.5-flash-lite</strong> model for fast, cheap, and precise operations.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm"
              />
              <p className="text-[10px] text-gray-400">
                Don't have an API key? You can get a free key from the{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleValidateKey}
              disabled={isValidating}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:neon-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 w-full"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Validating Key...
                </>
              ) : (
                'Validate & Continue'
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-5 relative z-10">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold text-white">Setup Completed!</h3>
              <p className="text-gray-300 text-sm mt-1">
                Your API key is verified and stored securely.
              </p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Open any LeetCode problem, and click the floating sparkles button to open Leetmate.
            </p>
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:neon-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full justify-center"
            >
              Enter Leetmate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
