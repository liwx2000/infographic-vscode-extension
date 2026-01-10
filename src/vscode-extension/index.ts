import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithInfographic } from '../shared-md-infographic';
import { configSection } from './config';
import { injectInfographicConfig } from './themeing';
import { InfographicCodeLensProvider } from './codeLensProvider';
import { InfographicGutterDecorationProvider } from './gutterDecorationProvider';
import { TempFileCache } from './cache/tempFileCache';
import { SyncService } from './services/syncService';
import { SaveHandler } from './handlers/saveHandler';
import { InfographicPreviewPanel } from './panels/previewPanel';
import { registerCompletionProvider } from './lsp/providers/infographicCompletionProvider';
import { PreviewPanelManager } from './services/previewPanelManager';

/**
 * Extension activation function
 * This is called when the extension is activated
 */
export function activate(ctx: vscode.ExtensionContext): {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt;
} {
    // Register preview panel manager for .infographic files
    const previewPanelManager = new PreviewPanelManager(ctx);
    ctx.subscriptions.push(previewPanelManager);

    // Register code lens provider for markdown files
    const codeLensProvider = new InfographicCodeLensProvider(ctx);
    ctx.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'markdown' },
            codeLensProvider
        )
    );

    // Register gutter decoration provider for markdown files
    const gutterDecorationProvider = new InfographicGutterDecorationProvider(ctx);
    ctx.subscriptions.push(gutterDecorationProvider);

    // Register save handler for temporary buffers
    const saveHandler = new SaveHandler(ctx);
    ctx.subscriptions.push(saveHandler.register());

    // Register LSP completion provider for Infographic syntax
    registerCompletionProvider(ctx);

    // Register cleanup on deactivation
    ctx.subscriptions.push({
        dispose: () => {
            SyncService.disposeAll();
            TempFileCache.clearTempUris(ctx);
        }
    });

    // Register command to toggle preview panel for .infographic files
    ctx.subscriptions.push(
        vscode.commands.registerCommand(
            'infographicMarkdown.togglePreview',
            () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor || editor.document.languageId !== 'infographic') {
                    vscode.window.showWarningMessage('No .infographic file is currently active');
                    return;
                }

                // Check if this is a temp file (untitled document from code block)
                const isTempFile = TempFileCache.hasTempUri(ctx, editor.document.uri.toString());
                
                if (isTempFile) {
                    // For temp files, use InfographicPreviewPanel (singleton)
                    InfographicPreviewPanel.createOrShow(editor.document, ctx);
                } else {
                    // For regular .infographic files, use PreviewPanelManager
                    previewPanelManager.togglePreview();
                }
            }
        )
    );

    // Register command to open editor for code block
    ctx.subscriptions.push(
        vscode.commands.registerCommand(
            'infographicMarkdown.editBlock',
            async (documentUri: vscode.Uri, range: vscode.Range) => {
                try {
                    // Extract content from the range
                    const document = await vscode.workspace.openTextDocument(documentUri);
                    const content = document.getText(range);

                    if (!content || content.trim() === '') {
                        vscode.window.showWarningMessage('No content to edit in the selected range');
                        return;
                    }

                    // Create untitled document with infographic content and language association
                    const untitledDocument = await vscode.workspace.openTextDocument({
                        content: content,
                        language: 'infographic'
                    });

                    // Register in TempFileCache immediately
                    TempFileCache.addTempUri(ctx, untitledDocument.uri.toString());

                    // Open document in standard text editor
                    await vscode.window.showTextDocument(
                        untitledDocument,
                        {
                            viewColumn: vscode.ViewColumn.Active,
                            preserveFocus: false,
                            preview: false
                        }
                    );

                    // Create or show preview panel beside the editor
                    InfographicPreviewPanel.createOrShow(untitledDocument, ctx);

                    // Set up synchronization
                    SyncService.setupSync(
                        untitledDocument.uri,
                        documentUri,
                        range,
                        content
                    );
                } catch (error) {
                    console.error('Error opening infographic editor:', error);
                    vscode.window.showErrorMessage(
                        `Failed to open infographic editor: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }
        )
    );

    // Listen for configuration changes and trigger markdown preview refresh
    ctx.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            // Check if infographic-related settings changed
            if (e.affectsConfiguration(configSection)) {
                // Force refresh all markdown previews by sending a command
                vscode.commands.executeCommand('markdown.preview.refresh');
            }
        })
    );

    // Listen for document changes to refresh code lenses
    ctx.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.languageId === 'markdown') {
                codeLensProvider.refresh();
            }
        })
    );

    return {
        extendMarkdownIt(md: MarkdownIt) {
            // Apply the shared markdown-it plugin for parsing
            md.use(extendMarkdownItWithInfographic);
            // Apply configuration injection
            md.use(injectInfographicConfig);
            return md;
        }
    };
}
