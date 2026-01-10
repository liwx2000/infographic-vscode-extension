import * as vscode from 'vscode';

/**
 * Configuration interface for webview
 */
export interface WebviewConfig {
    width: string | number;
    height: string | number;
    padding: number | number[];
}

/**
 * Generate HTML content for the infographic editor webview
 * Provides split view with text editor and live preview
 */
export function getEditorWebviewHTML(
    webview: vscode.Webview,
    content: string,
    config: WebviewConfig,
    context: vscode.ExtensionContext
): string {
    const nonce = getNonce();
    const scriptUri = getEditorRendererScriptUri(webview, context);
    
    // Log the script URI for debugging
    console.log('[EditorTemplate] Script URI:', scriptUri.toString());
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
        style-src ${webview.cspSource} 'unsafe-inline'; 
        script-src 'nonce-${nonce}' ${webview.cspSource}; 
        img-src ${webview.cspSource} https: data:;">
    <title>Infographic Editor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            overflow: hidden;
        }
        .main-container {
            display: flex;
            width: 100vw;
            height: 100vh;
        }
        .editor-pane {
            flex: 0 0 50%;
            display: flex;
            flex-direction: column;
            min-width: 200px;
        }
        .splitter {
            width: 4px;
            background: var(--vscode-panel-border);
            cursor: col-resize;
            flex-shrink: 0;
            z-index: 1;
            transition: background-color 0.1s ease;
        }
        .splitter:hover {
            background: var(--vscode-focusBorder);
        }
        .preview-pane {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            min-width: 200px;
            position: relative;
        }
        textarea {
            flex: 1;
            width: 100%;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: none;
            padding: 10px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: none;
            outline: none;
        }
        textarea:focus {
            border: none;
            outline: none;
        }
        #container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loading {
            padding: 20px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
        }
        .infographic-error {
            padding: 20px;
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 4px;
            max-width: 600px;
        }
        .error-icon {
            font-size: 48px;
            text-align: center;
            margin-bottom: 10px;
        }
        .error-title {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 10px;
            text-align: center;
        }
        .error-message {
            margin-bottom: 10px;
            text-align: center;
        }
        /* Export Sidebar Styles */
        .export-sidebar {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: row;
            gap: 8px;
            z-index: 1000;
        }
        .export-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 13px;
            transition: background-color 0.2s, transform 0.1s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .export-button:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .export-button:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .export-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .export-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="editor-pane">
            <textarea id="editor">${escapeHtml(content)}</textarea>
        </div>
        <div class="splitter" id="splitter" tabindex="0"></div>
        <div class="preview-pane">
            <!-- Export Sidebar -->
            <div class="export-sidebar">
                <button id="export-svg-btn" class="export-button" aria-label="Export as SVG" title="Export as SVG">
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.5 1a.5.5 0 0 0-1 0v8.793L5.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 9.793V1z"/>
                        <path d="M3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                    <span>SVG</span>
                </button>
                <button id="export-png-btn" class="export-button" aria-label="Export as PNG" title="Export as PNG">
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.5 1a.5.5 0 0 0-1 0v8.793L5.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 9.793V1z"/>
                        <path d="M3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                    <span>PNG</span>
                </button>
            </div>

            <div id="container" 
                 data-width="${config.width}"
                 data-height="${config.height}"
                 data-padding="${JSON.stringify(config.padding).replace(/"/g, '&quot;')}">
                <div class="loading">Loading renderer...</div>
            </div>
        </div>
    </div>
    
    <script src="${scriptUri}" nonce="${nonce}" id="renderer-script"></script>
    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('container');
            const editor = document.getElementById('editor');
            const splitter = document.getElementById('splitter');
            const editorPane = document.querySelector('.editor-pane');
            const previewPane = document.querySelector('.preview-pane');
            const mainContainer = document.querySelector('.main-container');
            const exportSvgBtn = document.getElementById('export-svg-btn');
            const exportPngBtn = document.getElementById('export-png-btn');
            
            let debounceTimer = null;
            let isDragging = false;
            let startX = 0;
            let startEditorWidth = 0;
            let currentInfographicInstance = null;
            
            // Editor input handler with debouncing
            editor.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const content = editor.value;
                    const cursorPosition = editor.selectionStart;
                    vscode.postMessage({ type: 'edit', content });
                    renderInfographic(content, {}).then(() => {
                        // Restore focus and cursor position after render
                        editor.focus();
                        editor.setSelectionRange(cursorPosition, cursorPosition);
                    });
                }, 500);
            });
            
            // Add event listeners to the script element
            const scriptEl = document.getElementById('renderer-script');
            if (scriptEl) {
                scriptEl.addEventListener('load', function() {
                    console.log('[Webview] Script loaded successfully');
                });
                scriptEl.addEventListener('error', function(e) {
                    console.error('[Webview] Script loading error:', e);
                    container.innerHTML = \`
                        <div class="infographic-error">
                            <div class="error-icon">⚠️</div>
                            <div class="error-title">Script Loading Error</div>
                            <div class="error-message">Failed to load renderer script. Check console for details.</div>
                        </div>
                    \`;
                });
            } else {
                console.error('[Webview] Script element not found');
            }
            
            // Wait for the renderer script to load before initial render
            let rendererCheckCount = 0;
            const maxRendererChecks = 100;
            
            function waitForRenderer(callback) {
                if (typeof window.InfographicRenderer?.render === 'function') {
                    console.log('Renderer loaded successfully');
                    callback();
                } else {
                    rendererCheckCount++;
                    if (rendererCheckCount >= maxRendererChecks) {
                        console.error('Renderer failed to load after timeout');
                        container.innerHTML = \`
                            <div class="infographic-error">
                                <div class="error-icon">⚠️</div>
                                <div class="error-title">Loading Error</div>
                                <div class="error-message">Failed to load renderer script.</div>
                            </div>
                        \`;
                        return;
                    }
                    setTimeout(() => waitForRenderer(callback), 50);
                }
            }
            
            // Initialize splitter state
            function initializeSplitter() {
                const state = vscode.getState();
                if (state && typeof state.editorWidthPercent === 'number') {
                    // Restore saved width ratio
                    const percent = Math.max(0, Math.min(100, state.editorWidthPercent));
                    applyEditorWidth(percent);
                } else {
                    // Use default 50/50 split
                    applyEditorWidth(50);
                }
            }
            
            function applyEditorWidth(percent) {
                const containerWidth = mainContainer.offsetWidth;
                const splitterWidth = splitter.offsetWidth;
                const availableWidth = containerWidth - splitterWidth;
                const editorWidth = (availableWidth * percent) / 100;
                
                // Apply minimum width constraints
                const minWidth = 200;
                const maxEditorWidth = availableWidth - minWidth;
                const constrainedWidth = Math.max(minWidth, Math.min(editorWidth, maxEditorWidth));
                
                editorPane.style.flex = '0 0 ' + constrainedWidth + 'px';
            }
            
            function saveEditorWidth() {
                const containerWidth = mainContainer.offsetWidth;
                const splitterWidth = splitter.offsetWidth;
                const editorWidth = editorPane.offsetWidth;
                const availableWidth = containerWidth - splitterWidth;
                const percent = (editorWidth / availableWidth) * 100;
                
                vscode.setState({ editorWidthPercent: percent });
            }
            
            // Splitter drag handlers
            splitter.addEventListener('mousedown', function(e) {
                isDragging = true;
                startX = e.clientX;
                startEditorWidth = editorPane.offsetWidth;
                
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                
                const delta = e.clientX - startX;
                const newWidth = startEditorWidth + delta;
                
                const containerWidth = mainContainer.offsetWidth;
                const splitterWidth = splitter.offsetWidth;
                const availableWidth = containerWidth - splitterWidth;
                const minWidth = 200;
                
                // Apply constraints
                const constrainedWidth = Math.max(minWidth, Math.min(newWidth, availableWidth - minWidth));
                
                editorPane.style.flex = '0 0 ' + constrainedWidth + 'px';
                
                e.preventDefault();
            });
            
            document.addEventListener('mouseup', function(e) {
                if (!isDragging) return;
                
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                saveEditorWidth();
            });
            
            // Export functionality
            async function exportToSVG() {
                if (!currentInfographicInstance) {
                    vscode.postMessage({ 
                        type: 'error', 
                        message: 'No infographic to export. Please render content first.'
                    });
                    return;
                }
                
                try {
                    exportSvgBtn.disabled = true;
                    
                    // Call toDataURL with 'svg' type
                    const dataUrl = await currentInfographicInstance.toDataURL('svg');
                    
                    // Extract base64 from data URL
                    const base64Data = dataUrl.split(',')[1];
                    
                    vscode.postMessage({ 
                        type: 'exportSvg', 
                        svgData: base64Data
                    });
                } catch (error) {
                    console.error('[Export] SVG export error:', error);
                    vscode.postMessage({ 
                        type: 'error', 
                        message: \`Failed to export SVG: \${error.message || 'Unknown error'}\`
                    });
                } finally {
                    exportSvgBtn.disabled = false;
                }
            }
            
            async function exportToPNG() {
                if (!currentInfographicInstance) {
                    vscode.postMessage({ 
                        type: 'error', 
                        message: 'No infographic to export. Please render content first.'
                    });
                    return;
                }
                
                try {
                    exportPngBtn.disabled = true;
                    
                    // Call toDataURL with 'image/png' type and quality options
                    const dataUrl = await currentInfographicInstance.toDataURL('image/png', {
                        encoderOptions: 0.92
                    });
                    
                    // Extract base64 from data URL
                    const base64Data = dataUrl.split(',')[1];
                    
                    vscode.postMessage({ 
                        type: 'exportPng', 
                        pngData: base64Data
                    });
                } catch (error) {
                    console.error('[Export] PNG export error:', error);
                    vscode.postMessage({ 
                        type: 'error', 
                        message: \`Failed to export PNG: \${error.message || 'Unknown error'}\`
                    });
                } finally {
                    exportPngBtn.disabled = false;
                }
            }
            
            // Attach event listeners to export buttons
            exportSvgBtn.addEventListener('click', exportToSVG);
            exportPngBtn.addEventListener('click', exportToPNG);
            
            // Initialize splitter on load
            initializeSplitter();
            
            // Initial render after script loads
            waitForRenderer(() => {
                renderInfographic('${escapeForScript(content)}', {});
            });
            
            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'updateContent':
                        // Only update if content is different and user is not actively editing
                        if (editor.value !== message.content && document.activeElement !== editor) {
                            const cursorPosition = editor.selectionStart;
                            editor.value = message.content;
                            renderInfographic(message.content, {});
                            // Restore cursor position if editor was previously focused
                            if (cursorPosition !== undefined) {
                                editor.setSelectionRange(cursorPosition, cursorPosition);
                            }
                        }
                        break;
                    case 'updateConfig':
                        const currentSyntax = editor.value;
                        if (currentSyntax) {
                            renderInfographic(currentSyntax, message.config);
                        }
                        break;
                }
            });
            
            async function renderInfographic(syntax, config) {
                try {
                    container.innerHTML = '';
                    
                    if (!syntax || syntax.trim() === '') {
                        container.innerHTML = '<div class="loading">Empty content</div>';
                        currentInfographicInstance = null;
                        vscode.postMessage({ type: 'clearError' });
                        return;
                    }
                    
                    if (typeof window.InfographicRenderer?.render === 'function') {
                        const options = {
                            ...config,
                            svg: { style: { background: '#FFFFFF' } }
                        };
                        const instance = await window.InfographicRenderer.render(container, syntax, options);
                        // Store instance if rendering was successful and has toDataURL method
                        if (instance && typeof instance.toDataURL === 'function') {
                            currentInfographicInstance = instance;
                            console.log('[Editor] Infographic instance stored for export');
                        } else {
                            currentInfographicInstance = null;
                            console.warn('[Editor] Render returned invalid instance');
                        }
                        vscode.postMessage({ type: 'clearError' });
                    } else {
                        throw new Error('Renderer not loaded');
                    }
                    
                    vscode.postMessage({ type: 'ready' });
                } catch (error) {
                    console.error('Rendering error:', error);
                    currentInfographicInstance = null;
                    container.innerHTML = \`
                        <div class="infographic-error">
                            <div class="error-icon">⚠️</div>
                            <div class="error-title">Rendering Error</div>
                            <div class="error-message">\${error.message}</div>
                        </div>
                    \`;
                    vscode.postMessage({ 
                        type: 'error', 
                        message: error.message 
                    });
                }
            }
        })();
    </script>
</body>
</html>`;
}

/**
 * Get the URI for the editor renderer script bundle
 */
function getEditorRendererScriptUri(webview: vscode.Webview, context: vscode.ExtensionContext): vscode.Uri {
    const scriptUri = vscode.Uri.joinPath(context.extensionUri, 'dist', 'editorRenderer.bundle.js');
    return webview.asWebviewUri(scriptUri);
}

/**
 * Generate a nonce for CSP
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Escape string for use in script tag
 */
function escapeForScript(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
