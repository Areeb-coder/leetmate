import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('Leetmate Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
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
    });
  });

  it('should update the API key and state', () => {
    useStore.getState().setApiKey('test_key');
    expect(useStore.getState().apiKey).toBe('test_key');
  });

  it('should update onboarding status', () => {
    useStore.getState().setOnboarded(true);
    expect(useStore.getState().onboarded).toBe(true);
  });

  it('should switch active tabs correctly', () => {
    useStore.getState().setActiveTab('hints');
    expect(useStore.getState().activeTab).toBe('hints');
  });

  it('should add messages to chat history', () => {
    useStore.getState().addChatMessage('Hello, Leetmate', 'user');
    const history = useStore.getState().chatHistory;
    expect(history.length).toBe(1);
    expect(history[0].text).toBe('Hello, Leetmate');
    expect(history[0].sender).toBe('user');
  });
});
