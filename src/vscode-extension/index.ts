import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithInfographic } from '../shared-md-infographic';
import { configSection } from './config';
import { injectInfographicConfig } from './themeing';

/**
 * Extension activation function
 * This is called when the extension is activated
 */
export function activate(ctx: vscode.ExtensionContext): {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt;
} {
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
