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
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
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
    </style>
</head>
<body>
    <div id="container">
        <div class="loading">Loading renderer...</div>
    </div>
    
    <script src="${scriptUri}" nonce="${nonce}" id="renderer-script"></script>
    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('container');
            
            let currentContent = '';
            let currentConfig = {
                width: 800,
                height: 600,
                padding: 20
            };
            
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
                            padding: message.padding || 20
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
                        vscode.postMessage({ type: 'clearError' });
                        return;
                    }
                    
                    if (typeof window.InfographicRenderer?.render === 'function') {
                        // Apply configuration to container
                        container.dataset.width = config.width;
                        container.dataset.height = config.height;
                        container.dataset.padding = JSON.stringify(config.padding);
                        
                        await window.InfographicRenderer.render(container, syntax);
                        vscode.postMessage({ type: 'clearError' });
                    } else {
                        throw new Error('Renderer not loaded');
                    }
                } catch (error) {
                    console.error('[Preview] Rendering error:', error);
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
