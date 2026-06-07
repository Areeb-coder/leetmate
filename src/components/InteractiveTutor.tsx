import React, { useState, useRef, useEffect } from 'react';
import { useStore, type ChatMessage, safeSendMessage } from '../store/useStore';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { formatMarkdown } from './Markdown';

export const InteractiveTutor: React.FC = () => {
  const { currentProblem, currentLanguage, currentCode, chatHistory, addChatMessage, clearChatHistory, isLoading, setLoading } = useStore();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage(userMessage, 'user');
    setLoading(true);

    // Prepare history format for Gemini API
    const history = chatHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const systemInstruction = `You are Leetmate, a world-class DSA mentor and FAANG interview coach.
Your goal is to guide the user to solve the problem by asking clarifying questions, showing diagrams, explaining complexities, and providing clean guidance.
Follow these guidelines strictly:
1. Ground your responses entirely on the current problem:
   - Title: ${currentProblem?.questionTitle || 'Unknown'}
   - Difficulty: ${currentProblem?.difficulty || 'Unknown'}
   - Language: ${currentLanguage || 'Unknown'}
   - Current user code in editor:
     \`\`\`${currentLanguage || ''}
     ${currentCode || '// No code written yet'}
     \`\`\`
2. Never spoon-feed the optimal solution directly in this tutor chat unless explicitly asked. Help them think by explaining the underlying patterns (e.g. dynamic programming, sliding window, fast/slow pointers).
3. Always justify design decisions. If they ask about a hash map, explain why it improves time complexity from O(N^2) to O(N) at the cost of O(N) space.
4. Keep explanations formatted with clean markdown, bullet points, and high contrast code blocks.`;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      safeSendMessage(
        {
          action: 'CALL_GEMINI',
          payload: {
            systemInstruction,
            prompt: userMessage,
            history,
          },
        },
        (response) => {
          setLoading(false);
          if (response && response.success) {
            addChatMessage(response.text, 'ai');
          } else {
            addChatMessage(`Error: ${response?.error || 'Failed to reach Leetmate.'}`, 'ai');
          }
        }
      );
    } else {
      // Offline fallback
      setTimeout(() => {
        setLoading(false);
        addChatMessage(
          `This is a local mockup response. You asked about: "${userMessage}". Since you are running in developer mode without a chrome runtime, I'm simulating a mentor response emphasizing hash maps and complexity analysis.`,
          'ai'
        );
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full text-white font-body">
      {/* Header action */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-low border-b border-outline-variant/10">
        <span className="text-xs text-gray-400">Tutor Chat Feed</span>
        {chatHistory.length > 0 && (
          <button
            onClick={clearChatHistory}
            className="p-1 hover:bg-surface-high rounded text-gray-400 hover:text-red-400 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-headline font-bold text-sm">Ask Leetmate anything</h4>
            <p className="text-xs text-gray-400 max-w-[240px]">
              Ask about intuition, how to optimize a double loop, edge cases, or request a dry run of your current code.
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-primary to-secondary text-white'
                    : 'bg-surface-high border border-outline-variant/10 text-primary-dim'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3 rounded-xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary/20 text-white rounded-tr-none border border-primary/20'
                    : 'bg-surface-normal text-gray-200 rounded-tl-none border border-outline-variant/10'
                }`}
              >
                <div>{formatMarkdown(msg.text)}</div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-7 h-7 rounded-lg bg-surface-high border border-outline-variant/10 text-primary-dim flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-surface-normal text-gray-400 rounded-xl rounded-tl-none border border-outline-variant/10 flex items-center gap-2 text-xs">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface-low border-t border-outline-variant/10 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask a question about the code or constraints..."
          rows={2}
          className="flex-1 px-3 py-2 text-xs rounded-xl glass-input text-white resize-none scrollbar-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:neon-glow hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition shrink-0 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
