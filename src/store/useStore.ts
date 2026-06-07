import { create } from 'zustand';

export const ASSISTANT_ICON_URL = typeof chrome !== 'undefined' && chrome.runtime?.getURL
  ? chrome.runtime.getURL('assets/assistant.png')
  : '/src/assets/assistant.png';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface ProblemDetails {
  titleSlug: string;
  questionId: string;
  questionTitle: string;
  content: string; // HTML description
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  topicTags: { name: string; slug: string }[];
  codeSnippets?: { lang: string; langSlug: string; code: string }[];
}

export interface SubmissionResult {
  status_code: number;
  status_msg: string;
  state: string;
  total_correct?: number;
  total_testcases?: number;
  status_runtime?: string;
  status_memory?: string;
  full_compile_error?: string;
  runtime_error?: string;
  code_answer?: string[];
  expected_code_answer?: string[];
  last_testcase?: string;
}

interface AppState {
  apiKey: string;
  onboarded: boolean;
  isPanelOpen: boolean;
  activeTab: 'tutor' | 'hints' | 'solutions' | 'debugger' | 'review' | 'settings';
  currentProblem: ProblemDetails | null;
  currentLanguage: string;
  currentCode: string;
  chatHistory: ChatMessage[];
  hintsUnlocked: number;
  lastSubmission: SubmissionResult | null;
  isLoading: boolean;
  contextInvalidated: boolean;
  activePlatform: string;
  activeBadge: string;
  
  // Actions
  setApiKey: (key: string) => void;
  setOnboarded: (val: boolean) => void;
  setPanelOpen: (val: boolean) => void;
  setActiveTab: (tab: 'tutor' | 'hints' | 'solutions' | 'debugger' | 'review' | 'settings') => void;
  setCurrentProblem: (problem: ProblemDetails | null) => void;
  setCurrentLanguage: (lang: string) => void;
  setCurrentCode: (code: string) => void;
  addChatMessage: (text: string, sender: 'user' | 'ai') => void;
  clearChatHistory: () => void;
  unlockHint: () => void;
  resetHints: () => void;
  setLastSubmission: (result: SubmissionResult | null) => void;
  setLoading: (isLoading: boolean) => void;
  setContextInvalidated: (val: boolean) => void;
  setActivePlatform: (platform: string, badge: string) => void;
  
  // Sync
  loadFromStorage: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  apiKey: '',
  onboarded: false,
  isPanelOpen: false,
  activeTab: 'tutor',
  currentProblem: null,
  currentLanguage: '',
  currentCode: '',
  chatHistory: [],
  hintsUnlocked: 0,
  lastSubmission: null,
  isLoading: false,
  contextInvalidated: false,
  activePlatform: 'LeetCode',
  activeBadge: '🟢 LeetCode',

  setApiKey: (apiKey) => {
    set({ apiKey });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ apiKey });
    }
  },

  setOnboarded: (onboarded) => {
    set({ onboarded });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ onboarded });
    }
  },

  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  
  setActiveTab: (activeTab) => set({ activeTab }),
  
  setCurrentProblem: (currentProblem) => {
    set({ currentProblem });
    // Reset page-specific states
    set({ hintsUnlocked: 0 });
    get().clearChatHistory();
  },
  
  setCurrentLanguage: (currentLanguage) => set({ currentLanguage }),
  
  setCurrentCode: (currentCode) => set({ currentCode }),
  
  addChatMessage: (text, sender) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender,
      text,
      timestamp: Date.now(),
    };
    set((state) => ({ chatHistory: [...state.chatHistory, newMessage] }));
  },
  
  clearChatHistory: () => set({ chatHistory: [] }),
  
  unlockHint: () => set((state) => ({ hintsUnlocked: Math.min(state.hintsUnlocked + 1, 5) })),
  
  resetHints: () => set({ hintsUnlocked: 0 }),
  
  setLastSubmission: (lastSubmission) => set({ lastSubmission }),
  
  setLoading: (isLoading) => set({ isLoading }),

  setContextInvalidated: (contextInvalidated) => set({ contextInvalidated }),

  setActivePlatform: (activePlatform, activeBadge) => set({ activePlatform, activeBadge }),

  loadFromStorage: async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const data = await chrome.storage.local.get(['apiKey', 'onboarded']);
        set({
          apiKey: data.apiKey || '',
          onboarded: !!data.onboarded,
        });
      } catch (err: any) {
        if (err.message && (err.message.includes('invalidated') || err.message.includes('context invalidated'))) {
          set({ contextInvalidated: true });
        }
      }
    }
  },
}));

export const safeSendMessage = (message: any, callback: (response: any) => void) => {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      throw new Error("Extension context invalidated.");
    }
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || '';
        if (errorMsg.includes('context invalidated') || errorMsg.includes('Extension context invalidated')) {
          useStore.getState().setContextInvalidated(true);
        } else {
          console.warn('Runtime message error:', errorMsg);
        }
        return;
      }
      callback(response);
    });
  } catch (error: any) {
    console.error('safeSendMessage error:', error);
    if (error.message && (error.message.includes('invalidated') || error.message.includes('Extension context invalidated'))) {
      useStore.getState().setContextInvalidated(true);
    }
  }
};
