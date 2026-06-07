import type { ProblemDetails, SubmissionResult } from '../../store/useStore';

export interface PlatformAdapter {
  detect(): boolean;
  getPlatformName(): string;
  getBadge(): string; // e.g. "🟢 LeetCode" or "🔵 GeeksforGeeks"
  extractProblemDetails(): Promise<ProblemDetails | null>;
  extractEditorState(): Promise<{ code: string; language: string } | null>;
  interceptSubmission(url: string, requestBody: string, responseJson: any): SubmissionResult | null;
}
