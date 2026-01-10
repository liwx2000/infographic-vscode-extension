import * as vscode from 'vscode';

/**
 * Generate HTML content for the infographic preview webview
 * Displays only the preview without the text editor
 */
export function getPreviewHTML(
    webview: vscode.Webview,
    context: vscode.ExtensionContext,
    content: string
): string {
    const nonce = getNonce();
    const scriptUri = getRendererScriptUri(webview, context);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
        style-src ${webview.cspSource} 'unsafe-inline'; 
        script-src 'nonce-${nonce}' ${webview.cspSource}; 
        img-src ${webview.cspSource} https: data:;">
    <title>Infographic Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            overflow: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        #container {
            width: 100%;
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
            margin: 20px;
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
            white-space: pre-wrap;
            word-break: break-word;
        }
        /* Sidebar Styles */
        .export-sidebar {
            position: fixed;
            top: 20px;
            right: 20px;
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

    <div id="container">
        <div class="loading">Loading renderer...</div>
    </div>
    
    <script src="${scriptUri}" nonce="${nonce}" id="renderer-script"></script>
    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('container');
            const exportSvgBtn = document.getElementById('export-svg-btn');
            const exportPngBtn = document.getElementById('export-png-btn');
            
            let currentContent = '';
            let currentConfig = {
                width: 800,
                height: 600,
                padding: 0
            };
            let currentInfographicInstance = null;
            
            // Wait for the renderer script to load
            let rendererCheckCount = 0;
            const maxRendererChecks = 100;
            
            function waitForRenderer(callback) {
                if (typeof window.InfographicRenderer?.render === 'function') {
                    console.log('[Preview] Renderer loaded successfully');
                    callback();
                } else {
                    rendererCheckCount++;
                    if (rendererCheckCount >= maxRendererChecks) {
                        console.error('[Preview] Renderer failed to load after timeout');
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
            
            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'update':
                        currentContent = message.content || '';
                        currentConfig = {
                            width: message.width || 800,
                            height: message.height || 600,
                            padding: message.padding || 0
                        };
                        renderInfographic(currentContent, currentConfig);
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
                        // Apply configuration to container
                        const options = {
                            ...config,
                            svg: { style: { background: '#FFFFFF' } }
                        };
                        
                        const instance = await window.InfographicRenderer.render(container, syntax, options);
                        // Only store instance if rendering was successful
                        if (instance && typeof instance.toDataURL === 'function') {
                            currentInfographicInstance = instance;
                            console.log('[Preview] Infographic instance stored for export');
                        } else {
                            currentInfographicInstance = null;
                            console.warn('[Preview] Render returned invalid instance');
                        }
                        vscode.postMessage({ type: 'clearError' });
                    } else {
                        throw new Error('Renderer not loaded');
                    }
                } catch (error) {
                    console.error('[Preview] Rendering error:', error);
                    currentInfographicInstance = null;
                    container.innerHTML = \`
                        <div class="infographic-error">
                            <div class="error-icon">⚠️</div>
                            <div class="error-title">Rendering Error</div>
                            <div class="error-message">\${error.message || 'Unknown error occurred'}</div>
                        </div>
                    \`;
                    vscode.postMessage({ 
                        type: 'error', 
                        message: error.message || 'Unknown error occurred'
                    });
                }
            }
            
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
                        svgBase64: base64Data
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
                        pngBase64: base64Data
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
            
            // Initial render after script loads
            waitForRenderer(() => {
                currentContent = '${escapeForScript(content)}';
                renderInfographic(currentContent, currentConfig);
            });
        })();
    </script>
</body>
</html>`;
}

/**
 * Get the URI for the renderer script bundle
 */
function getRendererScriptUri(webview: vscode.Webview, context: vscode.ExtensionContext): vscode.Uri {
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
