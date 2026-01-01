import type MarkdownIt from 'markdown-it';

const infographicLanguageId = 'infographic';

function preProcess(source: string): string {
    return source
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n+$/, '')
        .trimStart();
}

/**
 * Extends markdown-it so that it can parse infographic code blocks.
 * 
 * This does not actually implement rendering of infographic diagrams. Instead we just make sure that
 * infographic block syntax is properly parsed by markdown-it. All actual infographic rendering happens
 * in the webview where the markdown is rendered.
 */
export function extendMarkdownItWithInfographic(md: MarkdownIt): MarkdownIt {
    // Store the original fence renderer
    const defaultFenceRenderer = md.renderer.rules.fence;
    
    // Override the fence renderer to handle infographic blocks
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
        const langName = info ? info.split(/\s+/g)[0] : '';
        
        // Check if this is an infographic block
        if (langName.toLowerCase() === infographicLanguageId) {
            const code = token.content;
            
            // Don't render anything if content is empty
            if (!code || code.trim() === '') {
                return '';
            }
            
            // Return container div with data attribute
            // Config is injected at the document level by the extension, not per block
            return `<pre style="all:unset;"><div class="${infographicLanguageId}" data-syntax="${preProcess(code)}"></div></pre>`;
        }
        
        // For all other code blocks, use the default renderer
        return defaultFenceRenderer ? defaultFenceRenderer(tokens, idx, options, env, self) : '';
    };
    
    return md;
}
