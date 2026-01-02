import * as vscode from 'vscode';
import { configSection } from './config';
import { getCustomEditorWebviewContent } from './webviewContent';

/**
 * Custom text editor provider for .infographic files
 * Provides a split view with text editing and live preview
 */
export class InfographicEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'infographicMarkdown.editor';
    
    constructor(
        private readonly context: vscode.ExtensionContext
    ) {}

    /**
     * Called when a custom editor is opened
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.context.extensionUri,
                vscode.Uri.joinPath(this.context.extensionUri, 'dist')
            ]
        };

        // Set webview content
        this.updateWebview(document, webviewPanel.webview);

        // Listen for document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(document, webviewPanel.webview);
            }
        });

        // Listen for configuration changes
        const changeConfigSubscription = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
                this.updateWebviewConfig(webviewPanel.webview);
            }
        });

        // Listen for messages from webview
        webviewPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.type) {
                    case 'ready':
                        // Webview is ready, can send initial content if needed
                        break;
                    case 'error':
                        vscode.window.showErrorMessage(`Infographic rendering error: ${message.message}`);
                        break;
                    case 'edit':
                        // Update document with edited content
                        const edit = new vscode.WorkspaceEdit();
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(document.getText().length)
                        );
                        edit.replace(document.uri, fullRange, message.content);
                        await vscode.workspace.applyEdit(edit);
                        break;
                }
            }
        );

        // Clean up subscriptions when panel is closed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            changeConfigSubscription.dispose();
        });
    }

    /**
     * Update the webview content
     */
    private updateWebview(document: vscode.TextDocument, webview: vscode.Webview): void {
        const config = this.getConfiguration();
        const content = document.getText();
        webview.html = getCustomEditorWebviewContent(webview, content, config, this.context);
    }

    /**
     * Update only the configuration in the webview (without full HTML reload)
     */
    private updateWebviewConfig(webview: vscode.Webview): void {
        const config = this.getConfiguration();
        webview.postMessage({
            type: 'updateConfig',
            config: config
        });
    }

    /**
     * Get current configuration from settings
     */
    private getConfiguration(): {
        theme: string;
        width: string | number;
        height: string | number;
        padding: number | number[];
    } {
        const config = vscode.workspace.getConfiguration(configSection);
        
        const themeSetting = config.get<'auto' | 'light' | 'dark'>('theme', 'auto');
        const theme = this.resolveTheme(themeSetting);
        const width = config.get<string | number>('width', '100%');
        const height = config.get<string | number>('height', '100%');
        const padding = config.get<number | number[]>('padding', 0);

        return { theme, width, height, padding };
    }

    /**
     * Resolve theme setting to actual theme value
     */
    private resolveTheme(themeSetting: 'auto' | 'light' | 'dark'): 'light' | 'dark' {
        if (themeSetting === 'auto') {
            const currentTheme = vscode.window.activeColorTheme;
            return currentTheme.kind === vscode.ColorThemeKind.Light ||
                   currentTheme.kind === vscode.ColorThemeKind.HighContrastLight
                ? 'light'
                : 'dark';
        }
        return themeSetting;
    }
}
