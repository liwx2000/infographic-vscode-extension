import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { infographicPlugin } from './markdown-it-plugin';
import { getResolvedConfig } from './config';

/**
 * Extension activation function
 * This is called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): {
  extendMarkdownIt(md: MarkdownIt): MarkdownIt;
} {
  // Listen for configuration changes and trigger markdown preview refresh
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      // Check if infographic-related settings changed
      if (e.affectsConfiguration('infographicMarkdown')) {
        // Force refresh all markdown previews by sending a command
        vscode.commands.executeCommand('markdown.preview.refresh');
      }
    })
  );

  return {
    extendMarkdownIt(md: MarkdownIt) {
      // Register the infographic plugin with markdown-it
      // Pass a function that fetches config dynamically on each render
      // This ensures configuration changes are always reflected
      return md.use(infographicPlugin, { 
        getConfig: () => getResolvedConfig()
      });
    }
  };
}

/**
 * Extension deactivation function
 */
export function deactivate(): void {
  // Cleanup if needed
}
