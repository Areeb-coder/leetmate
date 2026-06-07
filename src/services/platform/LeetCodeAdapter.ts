import type { PlatformAdapter } from './PlatformAdapter';
import type { ProblemDetails, SubmissionResult } from '../../store/useStore';

export class LeetCodeAdapter implements PlatformAdapter {
  detect(): boolean {
    return window.location.hostname.includes('leetcode.com');
  }

  getPlatformName(): string {
    return 'LeetCode';
  }

  getBadge(): string {
    return '🟢 LeetCode';
  }

  async extractProblemDetails(): Promise<ProblemDetails | null> {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    const titleSlug = match ? match[1] : null;
    if (!titleSlug) return null;

    try {
      const query = `
        query getProblemDetails($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            questionTitle
            content
            difficulty
            topicTags {
              name
              slug
            }
          }
        }
      `;

      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { titleSlug }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const question = data?.data?.question;
        if (question) {
          return {
            titleSlug,
            questionId: question.questionId,
            questionTitle: question.questionTitle,
            content: question.content,
            difficulty: question.difficulty,
            topicTags: question.topicTags || []
          };
        }
      }
    } catch (e) {
      console.error('[Leetmate] LeetCode GraphQL fetch failed:', e);
    }
    return null;
  }

  async extractEditorState(): Promise<{ code: string; language: string } | null> {
    // Editor state is queried via main-world window postMessage in index.tsx
    // So this returns null here and gets populated via postMessage listener.
    return null;
  }

  interceptSubmission(url: string, requestBody: string, responseJson: any): SubmissionResult | null {
    // Interception logic matching LeetCode run/submit endpoint structures
    if (url.includes('/submit/') || url.includes('/interpret_solution/')) {
      return {
        status_code: responseJson.status_code || 0,
        status_msg: responseJson.status_msg || 'Unknown',
        state: responseJson.state || 'SUCCESS',
        total_correct: responseJson.total_correct,
        total_testcases: responseJson.total_testcases,
        status_runtime: responseJson.status_runtime,
        status_memory: responseJson.status_memory,
        full_compile_error: responseJson.full_compile_error || responseJson.compile_error,
        runtime_error: responseJson.runtime_error,
        code_answer: responseJson.code_answer,
        expected_code_answer: responseJson.expected_code_answer,
        last_testcase: responseJson.last_testcase
      };
    }
    return null;
  }
}
