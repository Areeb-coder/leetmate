import React, { useState, useEffect } from 'react';
import { useStore, safeSendMessage } from '../store/useStore';
import { PlayCircle, AlertTriangle, CheckCircle, Bug, Sparkles } from 'lucide-react';
import { formatMarkdown } from './Markdown';

export const Debugger: React.FC = () => {
  const { lastSubmission, currentProblem, currentLanguage, currentCode } = useStore();
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto trigger analysis when a failed submission is intercepted
  useEffect(() => {
    if (lastSubmission && lastSubmission.status_code !== 10) {
      analyzeSubmission(lastSubmission);
    }
  }, [lastSubmission]);

  const analyzeSubmission = (submission: typeof lastSubmission) => {
    if (!submission || isLoading) return;
    setIsLoading(true);
    setAnalysis('');

    const systemInstruction = `You are Leetmate, a world-class debugger specializing in LeetCode test outcomes.
Identify why the user's code failed based on the LeetCode compiler output.
Common outcome types:
- status_code 11 (Wrong Answer)
- status_code 14 (Time Limit Exceeded - TLE)
- status_code 12 (Memory Limit Exceeded - MLE)
- status_code 15 (Runtime Error)
- status_code 20 (Compile Error)

Provide:
1. Root Cause: Explain simply and precisely why the error occurred.
2. The failing testcase (if provided in payload).
3. Optimized fix guidelines: Describe how to correct the logic. Do NOT spoon-feed the complete code right away, teach them the logic of the fix first, then show the modified section of the code.`;

    const prompt = `Analyze LeetCode execution outcome:
Problem: ${currentProblem?.questionTitle}
Language: ${currentLanguage}
User's Code:
${currentCode}

Submission Payload:
${JSON.stringify(submission, null, 2)}`;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      safeSendMessage(
        {
          action: 'CALL_GEMINI',
          payload: { systemInstruction, prompt },
        },
        (response) => {
          setIsLoading(false);
          if (response && response.success) {
            setAnalysis(response.text);
          } else {
            setAnalysis(`Error analyzing submission: ${response?.error || 'Failed to reach AI'}`);
          }
        }
      );
    } else {
      // Offline fallback
      setTimeout(() => {
        setIsLoading(false);
        setAnalysis(`### Debug Report (Mockup)
- **Error Type:** Wrong Answer (status_code: 11)
- **Root Cause:** Indexing out of bounds in loop termination condition.
- **Fix Suggestion:** Change \`i <= nums.length\` to \`i < nums.length\`.`);
      }, 1000);
    }
  };

  const handleManualAnalyze = () => {
    analyzeSubmission({
      status_code: 11,
      status_msg: 'Wrong Answer',
      state: 'SUCCESS',
    });
  };

  return (
    <div className="flex flex-col h-full text-white font-body p-4 space-y-4 overflow-y-auto custom-scrollbar">
      <div>
        <h3 className="text-sm font-headline font-bold text-white">AI Debugger</h3>
        <p className="text-[11px] text-gray-400">Detect and fix compiler errors, infinite loops, and wrong outputs</p>
      </div>

      {lastSubmission ? (
        <div className="space-y-4">
          {/* Submission Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              lastSubmission.status_code === 10
                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300'
                : 'bg-red-950/40 border-red-500/20 text-red-300'
            }`}
          >
            {lastSubmission.status_code === 10 ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <h4 className="font-bold">
                LeetCode Run Outcome: {lastSubmission.status_msg || 'Finished'}
              </h4>
              <p className="text-[10px] text-gray-300">
                {lastSubmission.total_correct !== undefined && lastSubmission.total_testcases !== undefined
                  ? `Passed ${lastSubmission.total_correct}/${lastSubmission.total_testcases} testcases`
                  : 'Compilation completed'}
              </p>
              {(lastSubmission.status_runtime || lastSubmission.status_memory) && (
                <p className="text-[10px] text-gray-400">
                  Runtime: {lastSubmission.status_runtime || 'N/A'} | Memory:{' '}
                  {lastSubmission.status_memory || 'N/A'}
                </p>
              )}
            </div>
          </div>

          {/* Compilation/Output detail if any */}
          {(lastSubmission.full_compile_error || lastSubmission.runtime_error) && (
            <div className="p-3 bg-surface-lowest border border-outline-variant/10 rounded-lg font-mono text-[10px] text-red-400 overflow-x-auto max-h-32 custom-scrollbar">
              {lastSubmission.full_compile_error || lastSubmission.runtime_error}
            </div>
          )}

          {/* AI Analysis */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400">Investigating execution log...</p>
            </div>
          ) : analysis ? (
            <div className="p-4 rounded-xl bg-surface-normal border border-outline-variant/10 space-y-2 text-xs leading-relaxed text-gray-300">
              <div className="flex items-center gap-2 text-primary-dim font-bold mb-2">
                <Bug className="w-4 h-4" /> AI Analysis & Recommendation
              </div>
              <div>{formatMarkdown(analysis)}</div>
            </div>
          ) : (
            <button
              onClick={() => analyzeSubmission(lastSubmission)}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs hover:neon-glow transition"
            >
              Analyze Submission Results
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
            <Bug className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-headline">No submissions captured yet</h4>
            <p className="text-[10px] text-gray-400 max-w-[240px] leading-relaxed">
              When you click "Run" or "Submit" on LeetCode, Leetmate will automatically intercept the results and show them here.
            </p>
          </div>
          <button
            onClick={handleManualAnalyze}
            className="px-4 py-2 text-[11px] rounded-lg border border-outline-variant/20 hover:bg-surface-high text-gray-300 transition"
          >
            Dry Run / Analyze Editor Code
          </button>
        </div>
      )}
    </div>
  );
};
