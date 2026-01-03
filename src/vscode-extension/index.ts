import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithInfographic } from '../shared-md-infographic';
import { configSection } from './config';
import { injectInfographicConfig } from './themeing';
import { InfographicEditorProvider } from './customEditor';
import { InfographicCodeLensProvider } from './codeLensProvider';
import { InfographicGutterDecorationProvider } from './gutterDecorationProvider';
import { TempFileCache } from './cache/tempFileCache';
import { SyncService } from './services/syncService';
import { SaveHandler } from './handlers/saveHandler';

/**
 * Extension activation function
 * This is called when the extension is activated
 */
export function activate(ctx: vscode.ExtensionContext): {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt;
} {
    // Register custom text editor provider for .infographic files
    const customEditorProvider = new InfographicEditorProvider(ctx);
    ctx.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            InfographicEditorProvider.viewType,
            customEditorProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

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

    // Register cleanup on deactivation
    ctx.subscriptions.push({
        dispose: () => {
            SyncService.disposeAll();
            TempFileCache.clearTempUris(ctx);
        }
    });

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

                    // Create untitled document with infographic content (without displaying it)
                    const untitledDocument = await vscode.workspace.openTextDocument({
                        content: content,
                        language: 'infographic'
                    });

                    // Register in TempFileCache immediately
                    TempFileCache.addTempUri(ctx, untitledDocument.uri.toString());

                    // Open with custom editor (webview) using vscode.openWith command
                    // This ensures the custom editor is used instead of the native text editor
                    await vscode.commands.executeCommand(
                        'vscode.openWith',
                        untitledDocument.uri,
                        InfographicEditorProvider.viewType,
                        vscode.ViewColumn.Active
                    );

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
            // Check if infographic-related settings changed or theme changed
            if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
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
