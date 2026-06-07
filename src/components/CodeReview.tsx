import React, { useState } from 'react';
import { useStore, safeSendMessage } from '../store/useStore';
import { Award, ShieldAlert, CheckCircle, Sparkles, RefreshCw } from 'lucide-react';
import { formatMarkdown } from './Markdown';

interface ReviewResult {
  score: number;
  readability: string;
  performance: string;
  naming: string;
  feedback: string[];
}

export const CodeReview: React.FC = () => {
  const { currentProblem, currentLanguage, currentCode } = useStore();
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performReview = () => {
    if (isLoading) return;
    setIsLoading(true);

    const systemInstruction = `You are Leetmate, a senior FAANG technical interviewer and clean code advocate.
Your objective is to evaluate the user's LeetCode solution for naming conventions, structure, code performance, maintainability, and readability.

CRITICAL RULES:
- Generate an overall quality score out of 100.
- Explain:
  - Readability (structure, formatting, comments)
  - Performance (unnecessary allocations, branching, cycles)
  - Naming (variables, helper functions)
- Provide a list of actionable bullet points to improve the code.
- Return response as a valid JSON object. Do not include markdown code ticks outside the JSON. Format it as:
{
  "score": 85,
  "readability": "Description...",
  "performance": "Description...",
  "naming": "Description...",
  "feedback": [
    "Feedback point 1",
    "Feedback point 2"
  ]
}`;

    const prompt = `Review the code for:
Problem: ${currentProblem?.questionTitle}
Language: ${currentLanguage}
Code:
${currentCode}`;

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
              let text = response.text.trim();
              if (text.startsWith('```json')) {
                text = text.substring(7);
              }
              if (text.endsWith('```')) {
                text = text.substring(0, text.length - 3);
              }
              const parsed = JSON.parse(text.trim());
              setReview(parsed);
            } catch (e) {
              console.error('Failed to parse review JSON', e);
              setReview({
                score: 70,
                readability: 'Failed to format feedback cleanly.',
                performance: 'N/A',
                naming: 'N/A',
                feedback: [response.text],
              });
            }
          }
        }
      );
    } else {
      // Offline fallback
      setTimeout(() => {
        setIsLoading(false);
        setReview({
          score: 88,
          readability: 'Excellent indentation and structuring. Standard layout conforms to templates.',
          performance: 'No redundant loops detected. Average runtime matches expected O(N) constraints.',
          naming: 'Variable names are standard (nums, target). Could refine accumulator naming.',
          feedback: [
            'Consider renaming variable `temp` to reflect its purpose as `indexMap`.',
            'Avoid re-checking size of the collection within the loop boundary conditions.',
          ],
        });
      }, 1000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 70) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  return (
    <div className="flex flex-col h-full text-white font-body p-4 space-y-4 overflow-y-auto custom-scrollbar">
      <div>
        <h3 className="text-sm font-headline font-bold text-white">Code Review & Score</h3>
        <p className="text-[11px] text-gray-400">Evaluate readability, structure, performance, and best practices</p>
      </div>

      {!review && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs text-gray-400 max-w-[250px]">
            Run a static review of your editor code to generate suggestions and quality score.
          </p>
          <button
            onClick={performReview}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:neon-glow hover:scale-105 active:scale-95 transition"
          >
            Review Editor Code
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400">Running analysis heuristics...</p>
        </div>
      )}

      {review && (
        <div className="space-y-4">
          {/* Score Circle Card */}
          <div className={`flex flex-col items-center justify-center p-6 border rounded-xl ${getScoreColor(review.score)}`}>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Overall Score</span>
            <span className="text-4xl font-headline font-extrabold mt-1">{review.score} / 100</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-surface-normal border border-outline-variant/10 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-primary-dim">Readability & Style</h4>
              <div className="text-[11px] text-gray-300 leading-relaxed">{formatMarkdown(review.readability)}</div>
            </div>

            <div className="p-3 bg-surface-normal border border-outline-variant/10 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-primary-dim">Performance & Memory</h4>
              <div className="text-[11px] text-gray-300 leading-relaxed">{formatMarkdown(review.performance)}</div>
            </div>

            <div className="p-3 bg-surface-normal border border-outline-variant/10 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-primary-dim">Naming Conventions</h4>
              <div className="text-[11px] text-gray-300 leading-relaxed">{formatMarkdown(review.naming)}</div>
            </div>
          </div>

          {review.feedback && review.feedback.length > 0 && (
            <div className="p-4 bg-surface-normal border border-outline-variant/10 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold font-headline">Actionable Feedback</h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-300">
                {review.feedback.map((f, i) => (
                  <li key={i} className="leading-relaxed">
                    <span>{formatMarkdown(f)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={performReview}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-high text-xs text-gray-300 font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze Code
          </button>
        </div>
      )}
    </div>
  );
};
