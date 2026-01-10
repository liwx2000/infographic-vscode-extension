import * as vscode from 'vscode';
import { configSection } from './config';
import { getEditorWebviewHTML } from './templates/editorTemplate';
import { MessageTypes, handleEditMessage, handleErrorMessage, handleExportMessage } from './handlers/messageHandler';

/**
 * Custom text editor provider for .infographic files
 * Provides a split view with text editing and live preview
 */
export class InfographicEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'infographicMarkdown.editor';
    private isUpdatingFromWebview = false;
    
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
                // If the change came from webview, just update content without full reload
                if (this.isUpdatingFromWebview) {
                    this.isUpdatingFromWebview = false;
                    // Don't update webview - the change originated from there
                    return;
                }
                // External change - update content via message to preserve focus
                webviewPanel.webview.postMessage({
                    type: 'updateContent',
                    content: document.getText()
                });
            }
        });

        // Listen for configuration changes
        const changeConfigSubscription = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(configSection)) {
                this.updateWebviewConfig(webviewPanel.webview);
            }
        });

        // Listen for messages from webview
        webviewPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.type) {
                    case MessageTypes.READY:
                        // Webview is ready, can send initial content if needed
                        break;
                    case MessageTypes.ERROR:
                        handleErrorMessage(message.message);
                        break;
                    case MessageTypes.CLEAR_ERROR:
                        // Clear any previous error messages - no action needed in extension
                        break;
                    case MessageTypes.EDIT:
                        // Update document with edited content
                        await handleEditMessage(document, message.content, { value: this.isUpdatingFromWebview });
                        this.isUpdatingFromWebview = true;
                        break;
                    case MessageTypes.EXPORT_SVG:
                        await handleExportMessage(MessageTypes.EXPORT_SVG, message.svgData, document);
                        break;
                    case MessageTypes.EXPORT_PNG:
                        await handleExportMessage(MessageTypes.EXPORT_PNG, message.pngData, document);
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
        webview.html = getEditorWebviewHTML(webview, content, config, this.context);
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
        width: string | number;
        height: string | number;
        padding: number | number[];
    } {
        const config = vscode.workspace.getConfiguration(configSection);
        
        const width = config.get<string | number>('width', '100%');
        const height = config.get<string | number>('height', '100%');
        const padding = config.get<number | number[]>('padding', 0);

        return { width, height, padding };
    }

}
