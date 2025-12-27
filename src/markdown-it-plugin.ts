import type MarkdownIt from 'markdown-it';

const configSection = 'infographicMarkdown';

/**
 * Plugin options interface
 */
interface PluginOptions {
  getConfig: () => {
    resolvedTheme: 'light' | 'dark';
    width: string | number;
    height: string | number;
    padding: number | number[];
  };
}

/**
 * Generate a unique ID for infographic containers
 */
function generateId(): string {
  return `infographic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Inject configuration into rendered output
 * This approach ensures config is always fresh on each render
 * Similar to vscode-markdown-mermaid implementation
 */
function injectInfographicConfig(md: MarkdownIt, getConfig: () => any) {
  const originalRender = md.renderer.render;
  md.renderer.render = function (...args) {
    // Fetch fresh config on each render
    const config = getConfig();
    
    // Inject config as a hidden span at the beginning of the rendered output
    // The preview script will read this to get the current configuration
    const configElement = `<span id="${configSection}" style="display: none" aria-hidden="true"
      data-theme="${config.resolvedTheme}"
      data-width="${config.width}"
      data-height="${config.height}"
      data-padding="${JSON.stringify(config.padding).replace(/"/g, '&quot;')}"></span>`;
    
    return configElement + originalRender.apply(md.renderer, args);
  };
  return md;
}

/**
 * Markdown-it plugin to transform infographic code blocks into container divs
 */
export function infographicPlugin(md: MarkdownIt, options: PluginOptions): void {
  // Inject config at the renderer level (always fresh)
  injectInfographicConfig(md, options.getConfig);
  
  const defaultFence = md.renderer.rules.fence;

  md.renderer.rules.fence = (tokens, idx, optionsParam, env, self) => {
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
      // Config is injected at the document level, not per block
      return `<div class="infographic-container" id="${id}" data-syntax="${encodedContent}"></div>\n`;
    }

    // Use default fence rendering for other code blocks
    if (defaultFence) {
      return defaultFence(tokens, idx, optionsParam, env, self);
    }

    return '';
  };
}
