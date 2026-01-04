import * as vscode from 'vscode';
import { debounce } from '../utils/debounce';
import { getPreviewHTML } from '../templates/previewTemplate';

/**
 * Panel for displaying infographic preview beside the text editor
 * Singleton pattern - only one preview panel exists at a time
 */
export class InfographicPreviewPanel {
    private static currentPanel: InfographicPreviewPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private document: vscode.TextDocument;
    private readonly disposables: vscode.Disposable[] = [];
    private isFileChange = false;
    private readonly context: vscode.ExtensionContext;

    private constructor(
        panel: vscode.WebviewPanel,
        document: vscode.TextDocument,
        context: vscode.ExtensionContext
    ) {
        this.panel = panel;
        this.document = document;
        this.context = context;

        this.update();
        this.setupListeners();
    }

    /**
     * Create or show the preview panel
     */
    public static createOrShow(
        document: vscode.TextDocument,
        context: vscode.ExtensionContext
    ): void {
        // If panel already exists, just reveal it
        if (InfographicPreviewPanel.currentPanel) {
            InfographicPreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
            // Update to track new document if different
            if (InfographicPreviewPanel.currentPanel.document.uri.toString() !== document.uri.toString()) {
                InfographicPreviewPanel.currentPanel.document = document;
                InfographicPreviewPanel.currentPanel.isFileChange = true;
                InfographicPreviewPanel.currentPanel.update();
            }
            return;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            'infographicPreview',
            'Infographic Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'dist')
                ]
            }
        );

        InfographicPreviewPanel.currentPanel = new InfographicPreviewPanel(panel, document, context);
    }

    /**
     * Update the preview content
     */
    private update(): void {
        const content = this.document.getText() || ' ';

        // Get configuration
        const config = vscode.workspace.getConfiguration('infographicMarkdown');
        const themeConfig = config.get<string>('theme', 'auto');
        const width = config.get<number>('width', 800);
        const height = config.get<number>('height', 600);
        const padding = config.get<number>('padding', 20);

        // Resolve theme based on configuration
        const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
        let currentTheme: string;
        if (themeConfig === 'auto') {
            currentTheme = isDarkTheme ? 'dark' : 'light';
        } else {
            currentTheme = themeConfig;
        }

        // Update or set webview HTML
        if (!this.panel.webview.html) {
            this.panel.webview.html = getPreviewHTML(
                this.panel.webview,
                this.context,
                content,
                currentTheme
            );
        }

        // Send update message to webview
        this.panel.webview.postMessage({
            type: 'update',
            content: content,
            currentTheme: currentTheme,
            isFileChange: this.isFileChange,
            width: width,
            height: height,
            padding: padding
        });

        this.isFileChange = false;
    }

    /**
     * Setup event listeners
     */
    private setupListeners(): void {
        // Debounced update for document changes
        const debouncedUpdate = debounce(() => this.update(), 300);

        // Listen for document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                if (event.document === this.document) {
                    debouncedUpdate();
                }
            })
        );

        // Listen for active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor?.document?.languageId === 'infographic') {
                    if (editor.document.uri.toString() !== this.document?.uri.toString()) {
                        this.document = editor.document;
                        this.isFileChange = true;
                        debouncedUpdate();
                    }
                }
            })
        );

        // Listen for theme changes
        this.disposables.push(
            vscode.window.onDidChangeActiveColorTheme(() => {
                this.update();
            })
        );

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('infographicMarkdown')) {
                    this.update();
                }
            })
        );

        // Listen for messages from webview
        this.disposables.push(
            this.panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.type) {
                    case 'error':
                        if (message.message) {
                            vscode.window.showErrorMessage(`Infographic rendering error: ${message.message}`);
                        }
                        break;
                    case 'clearError':
                        // Clear any previous error messages
                        break;
                    case 'exportPng':
                        if (message.pngBase64) {
                            await this.handleExportPng(message.pngBase64);
                        }
                        break;
                    case 'exportSvg':
                        if (message.svgBase64) {
                            await this.handleExportSvg(message.svgBase64);
                        }
                        break;
                }
            })
        );

        // Cleanup on panel disposal
        this.disposables.push(
            this.panel.onDidDispose(() => this.dispose())
        );
    }

    /**
     * Handle PNG export
     */
    private async handleExportPng(pngBase64: string): Promise<void> {
        try {
            const uri = await vscode.window.showSaveDialog({
                filters: { 'PNG Images': ['png'] },
                defaultUri: vscode.Uri.file('infographic.png')
            });

            if (uri) {
                const buffer = Buffer.from(pngBase64.split(',')[1], 'base64');
                await vscode.workspace.fs.writeFile(uri, buffer);
                vscode.window.showInformationMessage('PNG exported successfully!');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export PNG: ${error}`);
        }
    }

    /**
     * Handle SVG export
     */
    private async handleExportSvg(svgBase64: string): Promise<void> {
        try {
            const uri = await vscode.window.showSaveDialog({
                filters: { 'SVG Images': ['svg'] },
                defaultUri: vscode.Uri.file('infographic.svg')
            });

            if (uri) {
                const buffer = Buffer.from(svgBase64.split(',')[1], 'base64');
                await vscode.workspace.fs.writeFile(uri, buffer);
                vscode.window.showInformationMessage('SVG exported successfully!');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export SVG: ${error}`);
        }
    }

    /**
     * Dispose of the panel and cleanup resources
     */
    public dispose(): void {
        InfographicPreviewPanel.currentPanel = undefined;

        // Dispose of all subscriptions
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        // Dispose the panel
        this.panel.dispose();
    }
}
