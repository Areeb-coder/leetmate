import type { PlatformAdapter } from './PlatformAdapter';
import type { ProblemDetails, SubmissionResult } from '../../store/useStore';

export class GeeksForGeeksAdapter implements PlatformAdapter {
  detect(): boolean {
    return window.location.hostname.includes('geeksforgeeks.org');
  }

  getPlatformName(): string {
    return 'GeeksforGeeks';
  }

  getBadge(): string {
    return '🔵 GeeksforGeeks';
  }

  async extractProblemDetails(): Promise<ProblemDetails | null> {
    try {
      // 1. Title
      const titleEl = document.querySelector('.problems_header_div__4jO2b h3, .problems_header_div h3, h3.problem-title, .problem-tab__header h3, h1');
      const questionTitle = titleEl ? titleEl.textContent?.trim() || 'GeeksforGeeks Problem' : 'GeeksforGeeks Problem';

      // 2. Slug
      const match = window.location.pathname.match(/\/problems\/([^/]+)/);
      const titleSlug = match ? match[1] : 'gfg-problem';

      // 3. Content
      const contentEl = document.querySelector('.problem-statement, .problems_problem_content__0y257');
      const content = contentEl ? contentEl.innerHTML : 'No problem statement found.';

      // 4. Difficulty
      let difficulty = 'Medium';
      const diffEl = document.querySelector('.problem-tab__difficulty, [class*="difficulty"]');
      if (diffEl) {
        difficulty = diffEl.textContent?.trim() || 'Medium';
      } else {
        const text = document.body.innerText;
        if (text.includes('Difficulty: Easy') || text.includes('Easy')) difficulty = 'Easy';
        else if (text.includes('Difficulty: Medium') || text.includes('Medium')) difficulty = 'Medium';
        else if (text.includes('Difficulty: Hard') || text.includes('Hard')) difficulty = 'Hard';
        else if (text.includes('Difficulty: Basic') || text.includes('Basic')) difficulty = 'Easy';
        else if (text.includes('Difficulty: School') || text.includes('School')) difficulty = 'Easy';
      }

      // 5. Topic Tags
      const topicTags: { name: string; slug: string }[] = [];
      document.querySelectorAll('.tag-list a, .problems_tag_link__3N_f2, [class*="tag-link"]').forEach(el => {
        const name = el.textContent?.trim() || '';
        if (name && !topicTags.some(t => t.name === name)) {
          topicTags.push({ name, slug: name.toLowerCase().replace(/ /g, '-') });
        }
      });

      return {
        titleSlug,
        questionId: 'gfg-' + titleSlug,
        questionTitle,
        content,
        difficulty,
        topicTags
      };
    } catch (e) {
      console.error('[Leetmate] GFG extraction failed:', e);
    }
    return null;
  }

  async extractEditorState(): Promise<{ code: string; language: string } | null> {
    // Handled in main world inject.ts
    return null;
  }

  interceptSubmission(url: string, requestBody: string, responseJson: any): SubmissionResult | null {
    // GFG compiler compile/submit API calls
    if (url.includes('/compile') || url.includes('/submit') || url.includes('/run')) {
      const status_code = responseJson.status === 'COMPILATION_ERROR' ? 20 : 
                          responseJson.status === 'SUCCESS' ? 10 : 11;
      
      const runtime = responseJson.time || responseJson.runtime || 'N/A';
      const memory = responseJson.memory || 'N/A';
      
      return {
        status_code,
        status_msg: responseJson.status || 'SUCCESS',
        state: 'SUCCESS',
        total_correct: responseJson.correct_testcases ?? responseJson.total_correct_testcases,
        total_testcases: responseJson.total_testcases,
        status_runtime: runtime,
        status_memory: memory,
        full_compile_error: responseJson.compile_message || responseJson.compilation_error,
        runtime_error: responseJson.runtime_error,
        code_answer: responseJson.user_output ? [responseJson.user_output] : undefined,
        expected_code_answer: responseJson.expected_output ? [responseJson.expected_output] : undefined,
        last_testcase: responseJson.input
      };
    }
    return null;
  }
}
