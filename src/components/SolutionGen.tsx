import React, { useState } from 'react';
import { useStore, safeSendMessage } from '../store/useStore';
import { Copy, Check, Sparkles } from 'lucide-react';

export const SolutionGen: React.FC = () => {
  const { currentProblem, currentLanguage, currentCode } = useStore();
  const [solutions, setSolutions] = useState<{
    brute?: { desc: string; code: string; time: string; space: string };
    better?: { desc: string; code: string; time: string; space: string };
    optimal?: { desc: string; code: string; time: string; space: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const generateSolutions = () => {
    if (isLoading) return;
    setIsLoading(true);

    const systemInstruction = `You are Leetmate, an AI coding mentor specialized in LeetCode solutions.
Your objective is to generate solutions in three distinct categories:
1. Brute Force (simplest approach, usually O(N^2) or higher)
2. Better (partial optimization, sorting, hashing)
3. Optimal (best possible time and space complexities)

CRITICAL RULES:
- The generated code MUST strictly preserve the exact function signature and classes of the starter template:
  Starter code:
  ${currentCode || '// Starter signature not captured yet'}
- Supported language: ${currentLanguage || 'Any language matching the template'}
- Never invent libraries or drivers. Write clean, accepted-leetcode style class code.
- Return responses as a valid JSON object. Do not include markdown code ticks outside the JSON. Format it as:
{
  "brute": { "desc": "explanation", "code": "code block", "time": "O(N^2)", "space": "O(1)" },
  "better": { "desc": "explanation", "code": "code block", "time": "O(N log N)", "space": "O(N)" },
  "optimal": { "desc": "explanation", "code": "code block", "time": "O(N)", "space": "O(N)" }
}`;

    const prompt = `Generate solutions for the problem:
Title: ${currentProblem?.questionTitle}
Difficulty: ${currentProblem?.difficulty}
Constraints: ${currentProblem?.content ? 'Ground logic in the problem text.' : 'Standard constraints apply.'}
Selected language: ${currentLanguage}`;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      safeSendMessage(
        {
          action: 'CALL_GEMINI',
          payload: { systemInstruction, prompt },
        },
        (response) => {
          setIsLoading(false);
          if (response && response.success) {
            try {
              // Parse out JSON. Sometimes Gemini returns json inside markdown ticks. Clean it up.
              let text = response.text.trim();
              if (text.startsWith('```json')) {
                text = text.substring(7);
              }
              if (text.endsWith('```')) {
                text = text.substring(0, text.length - 3);
              }
              const parsed = JSON.parse(text.trim());
              setSolutions(parsed);
            } catch (e) {
              console.error('Failed to parse solution JSON', e, response.text);
              setSolutions({
                optimal: {
                  desc: 'Failed to format as structured JSON. Raw text: ' + response.text,
                  code: currentCode || '',
                  time: 'N/A',
                  space: 'N/A',
                },
              });
            }
          }
        }
      );
    } else {
      // Offline fallback
      setTimeout(() => {
        setIsLoading(false);
        setSolutions({
          brute: {
            desc: 'Double loop search checking all pairs.',
            code: `// Brute force template code\n${currentCode || ''}`,
            time: 'O(N^2)',
            space: 'O(1)',
          },
          optimal: {
            desc: 'Single pass solution utilizing a hash map for linear lookup speeds.',
            code: `// Optimal template code\n${currentCode || ''}`,
            time: 'O(N)',
            space: 'O(N)',
          },
        });
      }, 1000);
    }
  };

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="flex flex-col h-full text-white font-body p-4 space-y-4 overflow-y-auto custom-scrollbar">
      <div>
        <h3 className="text-sm font-headline font-bold text-white">Solution Suite</h3>
        <p className="text-[11px] text-gray-400">Generate explanations, complexities, and code for different code approaches</p>
      </div>

      {!solutions && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs text-gray-400 max-w-[250px]">
            Generate 3 tiers of solutions (Brute, Better, Optimal) matching your current function signature.
          </p>
          <button
            onClick={generateSolutions}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:neon-glow hover:scale-105 active:scale-95 transition"
          >
            Generate Solutions
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400">Synthesizing solutions based on signature...</p>
        </div>
      )}

      {solutions && (
        <div className="space-y-4">
          {Object.entries(solutions).map(([key, sol]) => {
            if (!sol) return null;
            return (
              <div key={key} className="p-4 rounded-xl bg-surface-normal border border-outline-variant/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-headline capitalize text-primary-dim bg-primary/10 px-2 py-0.5 rounded">
                    {key} Approach
                  </span>
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span>Time: <strong className="text-white">{sol.time}</strong></span>
                    <span>Space: <strong className="text-white">{sol.space}</strong></span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{sol.desc}</p>

                <div className="relative group rounded-lg overflow-hidden border border-outline-variant/5">
                  <pre className="p-3 bg-surface-lowest text-[11px] text-gray-200 font-mono overflow-x-auto max-h-48 custom-scrollbar">
                    <code>{sol.code}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(sol.code, key)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-surface-normal hover:bg-surface-high border border-outline-variant/15 text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                    title="Copy Code"
                  >
                    {copiedType === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={generateSolutions}
            className="w-full py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-high text-xs text-gray-300 font-semibold transition"
          >
            Regenerate Solutions
          </button>
        </div>
      )}
    </div>
  );
};
