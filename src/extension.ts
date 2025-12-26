import type MarkdownIt from 'markdown-it';
import { infographicPlugin } from './markdown-it-plugin';

/**
 * Extension activation function
 * This is called when the extension is activated
 */
export function activate(): {
  extendMarkdownIt(md: MarkdownIt): MarkdownIt;
} {
  return {
    extendMarkdownIt(md: MarkdownIt) {
      // Register the infographic plugin with markdown-it
      return md.use(infographicPlugin);
    }
  };
}

/**
 * Extension deactivation function
 */
export function deactivate(): void {
  // Cleanup if needed
}
