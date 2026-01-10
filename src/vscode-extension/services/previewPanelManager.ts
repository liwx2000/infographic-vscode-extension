import * as vscode from 'vscode';
import { configSection } from '../config';
import { getPreviewWebviewHTML } from '../templates/previewTemplate';
import { MessageTypes, handleErrorMessage, handleExportMessage } from '../handlers/messageHandler';

/**
 * Manages preview webview panels for .infographic files
 * Each document gets its own preview panel with synchronized content
 */
export class PreviewPanelManager {
    private panels: Map<string, PreviewPanel> = new Map();
    private disposables: vscode.Disposable[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {
        // Listen for active editor changes to auto-show preview
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor && editor.document.languageId === 'infographic') {
                    this.showPreview(editor.document);
                }
            })
        );

        // Listen for document changes to update preview
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document.languageId === 'infographic') {
                    this.updatePreview(event.document);
                }
            })
        );

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(configSection)) {
                    this.updateAllPreviewConfigs();
                }
            })
        );

        // Listen for document close to cleanup panels
        this.disposables.push(
            vscode.workspace.onDidCloseTextDocument(document => {
                if (document.languageId === 'infographic') {
                    this.disposePanel(document.uri.toString());
                }
            })
        );

        // If extension is activated while an .infographic file is already active,
        // show its preview immediately
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.languageId === 'infographic') {
            this.showPreview(activeEditor.document);
        }
    }

    /**
     * Show or create preview panel for a document
     */
    public showPreview(document: vscode.TextDocument): void {
        const key = document.uri.toString();
        let previewPanel = this.panels.get(key);

        if (previewPanel) {
            // Reveal existing panel
            previewPanel.reveal();
        } else {
            // Create new panel
            previewPanel = this.createPanel(document);
            this.panels.set(key, previewPanel);
        }

        // Update content
        previewPanel.updateContent(document.getText());
    }

    /**
     * Toggle preview visibility for current document
     */
    public togglePreview(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'infographic') {
            vscode.window.showWarningMessage('No .infographic file is currently active');
            return;
        }

        const key = editor.document.uri.toString();
        const panel = this.panels.get(key);

        if (panel && panel.isVisible()) {
            panel.hide();
        } else {
            this.showPreview(editor.document);
        }
    }

    /**
     * Update preview content for a document (debounced)
     */
    private updatePreview(document: vscode.TextDocument): void {
        const key = document.uri.toString();
        const panel = this.panels.get(key);

        if (panel) {
            panel.updateContentDebounced(document.getText());
        }
    }

    /**
     * Update configuration for all active previews
     */
    private updateAllPreviewConfigs(): void {
        const config = this.getConfiguration();
        for (const panel of this.panels.values()) {
            panel.updateConfig(config);
        }
    }

    /**
     * Create a new preview panel for a document
     */
    private createPanel(document: vscode.TextDocument): PreviewPanel {
        const panel = new PreviewPanel(
            document,
            this.context,
            this.getConfiguration(),
            () => this.disposePanel(document.uri.toString())
        );
        return panel;
    }

    /**
     * Dispose a specific panel
     */
    private disposePanel(key: string): void {
        const panel = this.panels.get(key);
        if (panel) {
            panel.dispose();
            this.panels.delete(key);
        }
    }

    /**
     * Get current configuration
     */
    private getConfiguration() {
        const config = vscode.workspace.getConfiguration(configSection);
        return {
            width: config.get<string | number>('width', '100%'),
            height: config.get<string | number>('height', '100%'),
            padding: config.get<number | number[]>('padding', 0)
        };
    }

    /**
     * Dispose all panels and cleanup
     */
    public dispose(): void {
        for (const panel of this.panels.values()) {
            panel.dispose();
        }
        this.panels.clear();
        
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}

/**
 * Individual preview panel for a document
 */
class PreviewPanel {
    private panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private debounceTimer: NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_DELAY = 500;

    constructor(
        private readonly document: vscode.TextDocument,
        private readonly context: vscode.ExtensionContext,
        private config: { width: string | number; height: string | number; padding: number | number[] },
        private readonly onDispose: () => void
    ) {
        // Create webview panel
        this.panel = vscode.window.createWebviewPanel(
            'infographicPreview',
            `Preview: ${this.getDocumentName()}`,
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
            {
                enableScripts: true,
                localResourceRoots: [
                    context.extensionUri,
                    vscode.Uri.joinPath(context.extensionUri, 'dist')
                ],
                retainContextWhenHidden: true
            }
        );

        // Set initial HTML
        this.panel.webview.html = getPreviewWebviewHTML(
            this.panel.webview,
            document.getText(),
            this.config,
            context
        );

        // Handle messages from webview
        this.disposables.push(
            this.panel.webview.onDidReceiveMessage(async message => {
                switch (message.type) {
                    case MessageTypes.ERROR:
                        handleErrorMessage(message.message);
                        break;
                    case MessageTypes.EXPORT_SVG:
                        await handleExportMessage(MessageTypes.EXPORT_SVG, message.svgData, this.document);
                        break;
                    case MessageTypes.EXPORT_PNG:
                        await handleExportMessage(MessageTypes.EXPORT_PNG, message.pngData, this.document);
                        break;
                }
            })
        );

        // Handle panel disposal
        this.disposables.push(
            this.panel.onDidDispose(() => {
                this.dispose();
            })
        );
    }

    /**
     * Get document display name
     */
    private getDocumentName(): string {
        const fileName = this.document.uri.path.split('/').pop() || 'Untitled';
        return fileName;
    }

    /**
     * Update preview content immediately
     */
    public updateContent(content: string): void {
        this.panel.webview.postMessage({
            type: 'updateContent',
            content: content
        });
    }

    /**
     * Update preview content with debouncing
     */
    public updateContentDebounced(content: string): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.updateContent(content);
            this.debounceTimer = null;
        }, this.DEBOUNCE_DELAY);
    }

    /**
     * Update preview configuration
     */
    public updateConfig(config: { width: string | number; height: string | number; padding: number | number[] }): void {
        this.config = config;
        this.panel.webview.postMessage({
            type: 'updateConfig',
            config: config
        });
    }

    /**
     * Reveal the panel
     */
    public reveal(): void {
        this.panel.reveal(vscode.ViewColumn.Beside, true);
    }

    /**
     * Hide the panel
     */
    public hide(): void {
        // VSCode doesn't have a direct hide method, so we dispose instead
        // Users can close the panel manually
    }

    /**
     * Check if panel is visible
     */
    public isVisible(): boolean {
        return this.panel.visible;
    }

    /**
     * Dispose the panel
     */
    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];

        this.panel.dispose();
        this.onDispose();
    }
}
