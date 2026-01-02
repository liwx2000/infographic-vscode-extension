import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithInfographic } from '../shared-md-infographic';
import { configSection } from './config';
import { injectInfographicConfig } from './themeing';
import { InfographicEditorProvider } from './customEditor';
import { InfographicCodeLensProvider } from './codeLensProvider';
import { InteractiveEditorManager } from './interactiveEditor';

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

    // Create interactive editor manager
    const interactiveEditorManager = new InteractiveEditorManager(ctx);
    
    // Register cleanup on deactivation
    ctx.subscriptions.push({
        dispose: () => {
            interactiveEditorManager.dispose();
        }
    });

    // Register command to open interactive editor
    ctx.subscriptions.push(
        vscode.commands.registerCommand(
            'infographicMarkdown.editBlock',
            async (
                documentUri: vscode.Uri,
                range: vscode.Range,
                content: string,
                fileName: string,
                line: number
            ) => {
                await interactiveEditorManager.openEditor(
                    documentUri,
                    range,
                    content,
                    fileName,
                    line
                );
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
