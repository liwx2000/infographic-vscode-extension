/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import { loadInfographicConfig, renderInfographicBlocksInElement } from '../shared-infographic';

/**
 * Initialize all infographic containers in the document.
 * Following the pattern from vscode-markdown-mermaid:
 * 1. Load configuration from injected DOM element
 * 2. Initialize library (if needed)
 * 3. Render all infographic blocks
 */
function init() {
    // Step 1: Load configuration from DOM
    // This reads the config injected by the extension and caches it
    loadInfographicConfig();
    
    // Step 2: Initialize library
    // @antv/infographic doesn't require explicit initialization like mermaid.initialize(),
    // but loading config first ensures it's available for all render operations
    
    // Step 3: Render all infographic blocks in the document
    renderInfographicBlocksInElement(document.body, (infographicContainer, content) => {
        infographicContainer.innerHTML = content;
    });
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
