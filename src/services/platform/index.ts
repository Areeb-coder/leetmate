import type { PlatformAdapter } from './PlatformAdapter';
import { LeetCodeAdapter } from './LeetCodeAdapter';
import { GeeksForGeeksAdapter } from './GeeksForGeeksAdapter';

const adapters: PlatformAdapter[] = [
  new LeetCodeAdapter(),
  new GeeksForGeeksAdapter()
];

export function getPlatformAdapter(): PlatformAdapter {
  for (const adapter of adapters) {
    if (adapter.detect()) {
      return adapter;
    }
  }
  // Fallback to LeetCode as default
  return adapters[0];
}

export type { PlatformAdapter } from './PlatformAdapter';
export { LeetCodeAdapter } from './LeetCodeAdapter';
export { GeeksForGeeksAdapter } from './GeeksForGeeksAdapter';
