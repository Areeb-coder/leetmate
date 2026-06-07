import React, { useState, useEffect, useRef } from 'react';
import { useStore, ASSISTANT_ICON_URL } from '../store/useStore';
import { InteractiveTutor } from './InteractiveTutor';
import { HintMode } from './HintMode';
import { SolutionGen } from './SolutionGen';
import { Debugger } from './Debugger';
import { CodeReview } from './CodeReview';
import { Settings } from './Settings';
import { X, Settings as Gear, ArrowLeftRight, RefreshCw } from 'lucide-react';

interface SidePanelProps {
  onClose: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ onClose }) => {
  const { currentProblem, activeTab, setActiveTab, contextInvalidated, activeBadge } = useStore();
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, w: 0 });

  // Load width from chrome storage
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['panelWidth']).then((data) => {
        if (data.panelWidth) {
          setWidth(data.panelWidth);
        }
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      w: width
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = resizeStart.current.x - e.clientX;
      const newWidth = Math.max(400, Math.min(600, resizeStart.current.w + deltaX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ panelWidth: width });
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  const getDifficultyColor = (diff?: string) => {
    if (!diff) return 'bg-gray-500/10 text-gray-400';
    if (diff.toLowerCase() === 'easy') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (diff.toLowerCase() === 'medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  };

  return (
    <div
      style={{ width: `${width}px` }}
      className="fixed top-0 right-0 h-screen glass-panel shadow-2xl z-[99999] flex flex-col transition-all duration-300 font-body text-white"
    >
      {contextInvalidated && (
        <div className="absolute inset-0 bg-surface-lowest/90 backdrop-blur-md z-[100000] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4 animate-bounce">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-headline mb-2 text-white">Extension Reloaded</h2>
          <p className="text-sm text-gray-300 mb-6 max-w-xs leading-relaxed">
            Leetmate has been updated or reloaded in Developer Mode. Please refresh the page to reconnect.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:neon-glow hover:scale-105 active:scale-95 transition"
          >
            Refresh Page
          </button>
        </div>
      )}

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize hover:bg-primary/40 active:bg-primary transition-colors flex items-center justify-center group"
      >
        <div className="w-0.5 h-12 bg-outline-variant/30 rounded group-hover:bg-primary/50 group-active:bg-primary transition"></div>
      </div>

      {/* Header section */}
      <div className="p-4 bg-surface-low border-b border-outline-variant/10 flex flex-col space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-r from-primary to-secondary rounded-lg">
              <img 
                src={ASSISTANT_ICON_URL} 
                className="w-5 h-5 object-contain" 
                alt="Leetmate logo" 
              />
            </div>
            <h1 className="text-base font-headline font-bold bg-gradient-to-r from-primary-dim to-secondary text-transparent bg-clip-text">
              Leetmate AI
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-high/60 text-gray-300 border border-outline-variant/10">
              {activeBadge}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-1.5 rounded-lg hover:bg-surface-high text-gray-400 hover:text-white transition ${
                activeTab === 'settings' ? 'bg-surface-high text-primary-dim' : ''
              }`}
              title="Settings"
            >
              <Gear className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-high text-gray-400 hover:text-white transition"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Problem Metadata Info */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold truncate max-w-[70%]">
            {currentProblem?.questionTitle || 'No active problem'}
          </span>
          {currentProblem && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${getDifficultyColor(currentProblem.difficulty)}`}>
              {currentProblem.difficulty}
            </span>
          )}
        </div>

        {/* Tabs Control */}
        <div className="flex bg-surface-lowest/60 p-1 rounded-xl border border-outline-variant/5">
          {(['tutor', 'hints', 'solutions', 'debugger', 'review'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-[10px] uppercase font-bold font-headline rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-surface-high/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Tab Body */}
      <div className="flex-1 overflow-hidden min-h-0 bg-surface-lowest/10">
        {activeTab === 'tutor' && <InteractiveTutor />}
        {activeTab === 'hints' && <HintMode />}
        {activeTab === 'solutions' && <SolutionGen />}
        {activeTab === 'debugger' && <Debugger />}
        {activeTab === 'review' && <CodeReview />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
};
