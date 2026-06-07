import React, { useState } from 'react';
import { useStore, safeSendMessage } from '../store/useStore';
import { Settings as SettingsIcon, Save, Key, Trash2, Download, Upload, Check, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { apiKey, setApiKey, setOnboarded } = useStore();
  const [newKey, setNewKey] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSaveAndTest = () => {
    if (!newKey.trim()) {
      setStatus({ type: 'error', msg: 'Key cannot be empty' });
      return;
    }

    setIsValidating(true);
    setStatus(null);

    // Send validation to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      safeSendMessage(
        { action: 'VALIDATE_API_KEY', payload: { key: newKey } },
        (response) => {
          setIsValidating(false);
          if (response && response.success) {
            setApiKey(newKey);
            setStatus({ type: 'success', msg: 'API Key successfully verified and saved!' });
          } else {
            setStatus({ type: 'error', msg: response?.error || 'Invalid API Key. Verification failed.' });
          }
        }
      );
    } else {
      setTimeout(() => {
        setIsValidating(false);
        setApiKey(newKey);
        setStatus({ type: 'success', msg: 'Mockup API Key saved!' });
      }, 1000);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to remove your Gemini API key?')) {
      setApiKey('');
      setNewKey('');
      setOnboarded(false);
      setStatus({ type: 'success', msg: 'API key cleared. Please complete setup again.' });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ apiKey, exportDate: new Date().toISOString() }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'leetmate_settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = e => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed && parsed.apiKey) {
            setApiKey(parsed.apiKey);
            setNewKey(parsed.apiKey);
            setStatus({ type: 'success', msg: 'Settings imported successfully!' });
          } else {
            setStatus({ type: 'error', msg: 'Invalid configuration file structure.' });
          }
        } catch (err) {
          setStatus({ type: 'error', msg: 'Failed to parse JSON backup.' });
        }
      };
    }
  };

  return (
    <div className="flex flex-col h-full text-white font-body p-4 space-y-5 overflow-y-auto custom-scrollbar">
      <div>
        <h3 className="text-sm font-headline font-bold text-white">Leetmate Settings</h3>
        <p className="text-[11px] text-gray-400">Manage your Gemini credentials and export configuration backups</p>
      </div>

      {/* API Key management */}
      <div className="p-4 bg-surface-normal border border-outline-variant/10 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-primary-dim">
          <Key className="w-4 h-4" /> API Credentials
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider">Gemini API Key</label>
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 text-xs rounded-xl glass-input text-white font-mono"
          />
        </div>

        {status && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-xs border ${
              status.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/10 text-emerald-300'
                : 'bg-red-950/30 border-red-500/10 text-red-300'
            }`}
          >
            {status.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSaveAndTest}
            disabled={isValidating}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-lg hover:neon-glow disabled:opacity-50 transition flex items-center justify-center gap-1.5"
          >
            {isValidating ? 'Testing...' : <><Save className="w-3.5 h-3.5" /> Save & Test Key</>}
          </button>
          {apiKey && (
            <button
              onClick={handleClear}
              className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded-lg transition"
              title="Remove Key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Backup and restore settings */}
      <div className="p-4 bg-surface-normal border border-outline-variant/10 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-primary-dim">
          <Upload className="w-4 h-4" /> Backup & Restore
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2 px-3 border border-outline-variant/20 hover:bg-surface-high rounded-lg text-xs text-gray-300 font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Settings
          </button>
          
          <label className="flex-1 py-2 px-3 border border-outline-variant/20 hover:bg-surface-high rounded-lg text-xs text-gray-300 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
            <Upload className="w-3.5 h-3.5" /> Import Settings
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
