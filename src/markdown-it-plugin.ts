import type MarkdownIt from 'markdown-it';

/**
 * Generate a unique ID for infographic containers
 */
let infographicCounter = 0;

function generateId(): string {
  return `infographic-${Date.now()}-${infographicCounter++}`;
}

/**
 * Markdown-it plugin to transform infographic code blocks into container divs
 */
export function infographicPlugin(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence;

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();

    // Check if this is an infographic code block
    if (info === 'infographic') {
      const content = token.content;
      
      // Don't render anything if content is empty
      if (!content || content.trim() === '') {
        return '';
      }
      
      const id = generateId();

      // Encode content for safe storage in data attribute
      const encodedContent = Buffer.from(content).toString('base64');

      // Return container div with data attribute
      return `<div class="infographic-container" id="${id}" data-syntax="${encodedContent}"></div>\n`;
    }

    // Use default fence rendering for other code blocks
    if (defaultFence) {
      return defaultFence(tokens, idx, options, env, self);
    }

    return '';
  };
}
