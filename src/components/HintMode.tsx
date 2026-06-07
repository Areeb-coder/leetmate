import React, { useState } from 'react';
import { useStore, safeSendMessage } from '../store/useStore';
import { Lock, Unlock, Eye, Sparkles, RefreshCw } from 'lucide-react';
import { formatMarkdown } from './Markdown';

interface Hint {
  level: number;
  title: string;
  description: string;
  content: string;
}

const HINT_LEVELS = [
  { level: 1, title: 'Tiny Nudge', desc: 'A subtle push in the right direction.' },
  { level: 2, title: 'Logical Direction', desc: 'Conceptual approach or mathematical insight.' },
  { level: 3, title: 'Data Structure Tip', desc: 'Which data structures could optimize lookups/sorting?' },
  { level: 4, title: 'Algorithm Hint', desc: 'The step-by-step algorithm flow.' },
  { level: 5, title: 'Near-Complete Solution', desc: 'Detailed pseudocode or structure (no spoilers code).' },
];

export const HintMode: React.FC = () => {
  const { currentProblem, currentLanguage, currentCode, hintsUnlocked, unlockHint, resetHints } = useStore();
  const [hints, setHints] = useState<Record<number, string>>({});
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);

  const fetchHintForLevel = (level: number) => {
    if (loadingLevel !== null) return;
    setLoadingLevel(level);

    const systemInstruction = `You are Leetmate, a world-class DSA mentor.
Your objective is to provide a specific level of hint to the user for the problem: ${currentProblem?.questionTitle}.
You must NOT spoil the code solution. Keep it conceptual.
Explain clearly according to this requested Level:
- Level 1 (Tiny Nudge): Very subtle clue about the problem essence.
- Level 2 (Logical Direction): The mathematical, topological, or structural logic.
- Level 3 (Data Structure Tip): Suggest the most appropriate data structures (e.g. hash map, double-ended queue, monostack) and explain why.
- Level 4 (Algorithm Hint): Detail the algorithm design (e.g. two pointers sliding window step-by-step).
- Level 5 (Near-Complete Solution): Explain pseudocode or precise operations without writing actual executable code.

Respond in clear, short markdown paragraphs.`;

    const prompt = `Generate Level ${level} Hint for:
Problem: ${currentProblem?.questionTitle || 'Unknown'}
Difficulty: ${currentProblem?.difficulty || 'Unknown'}
Current user code:
${currentCode || '// None'}
Active coding language: ${currentLanguage || 'Unknown'}`;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      safeSendMessage(
        {
          action: 'CALL_GEMINI',
          payload: { systemInstruction, prompt },
        },
        (response) => {
          setLoadingLevel(null);
          if (response && response.success) {
            setHints((prev) => ({ ...prev, [level]: response.text }));
            unlockHint();
          } else {
            setHints((prev) => ({ ...prev, [level]: `Error: ${response?.error || 'Failed to fetch hint'}` }));
          }
        }
      );
    } else {
      // Offline fallback
      setTimeout(() => {
        setLoadingLevel(null);
        setHints((prev) => ({
          ...prev,
          [level]: `Mockup Level ${level} Hint: Focus on the problem restrictions and edge cases. In ${currentLanguage || 'JavaScript'}, verify how you index bounds!`,
        }));
        unlockHint();
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full text-white font-body p-4 space-y-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-headline font-bold text-white">Progressive Hints</h3>
          <p className="text-[11px] text-gray-400">Unlock hints one-by-one without spoiling the solution</p>
        </div>
        {hintsUnlocked > 0 && (
          <button
            onClick={() => {
              resetHints();
              setHints({});
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg hover:bg-surface-high border border-outline-variant/10 text-gray-400 hover:text-white transition"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="space-y-3">
        {HINT_LEVELS.map((h) => {
          const isUnlocked = hintsUnlocked >= h.level;
          const isNextToUnlock = hintsUnlocked === h.level - 1;
          const isLocked = hintsUnlocked < h.level - 1;

          return (
            <div
              key={h.level}
              className={`p-3.5 rounded-xl border transition-all duration-300 ${
                isUnlocked
                  ? 'bg-surface-normal border-primary/20'
                  : isNextToUnlock
                  ? 'bg-surface-low/80 border-outline-variant/15 hover:border-primary/30'
                  : 'bg-surface-lowest/40 border-outline-variant/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                      isUnlocked
                        ? 'bg-primary/20 text-primary-dim'
                        : isNextToUnlock
                        ? 'bg-surface-high text-gray-400'
                        : 'bg-surface-lowest text-gray-600'
                    }`}
                  >
                    {h.level}
                  </div>
                  <div>
                    <h4 className="text-xs font-headline font-bold text-white">{h.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{h.desc}</p>
                  </div>
                </div>

                {isUnlocked ? (
                  <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Unlock className="w-3.5 h-3.5" />
                  </span>
                ) : isNextToUnlock ? (
                  <button
                    onClick={() => fetchHintForLevel(h.level)}
                    disabled={loadingLevel !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:neon-glow transition"
                  >
                    {loadingLevel === h.level ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> Unlock
                      </>
                    )}
                  </button>
                ) : (
                  <span className="p-1 text-gray-600">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {isUnlocked && hints[h.level] && (
                <div className="mt-3 pt-3 border-t border-outline-variant/10 text-xs text-gray-300 leading-relaxed">
                  <div>{formatMarkdown(hints[h.level])}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
