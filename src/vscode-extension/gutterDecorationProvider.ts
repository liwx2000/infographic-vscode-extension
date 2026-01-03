import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Provides gutter decorations for infographic code blocks in markdown files
 * Adds a logo icon beside the ```infographic identifier
 */
export class InfographicGutterDecorationProvider {
    private decorationType: vscode.TextEditorDecorationType;
    private disposables: vscode.Disposable[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {
        // Create decoration type with logo icon
        const logoPath = vscode.Uri.file(
            path.join(context.extensionPath, 'doc', 'logo.svg')
        );

        this.decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: logoPath,
            gutterIconSize: 'contain'
        });

        // Register event listeners
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.updateDecorations(editor);
                }
            })
        );

        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                const editor = vscode.window.activeTextEditor;
                if (editor && event.document === editor.document) {
                    this.updateDecorations(editor);
                }
            })
        );

        // Initial decoration for active editor
        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }
    }

    /**
     * Update decorations for the given editor
     */
    private updateDecorations(editor: vscode.TextEditor): void {
        // Only apply to markdown files
        if (editor.document.languageId !== 'markdown') {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        const text = editor.document.getText();
        const lines = text.split('\n');

        // Regex to match infographic code block start
        const infographicBlockRegex = /^```infographic\s*$/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if this line starts an infographic code block
            if (infographicBlockRegex.test(line.trim())) {
                const range = new vscode.Range(
                    new vscode.Position(i, 0),
                    new vscode.Position(i, line.length)
                );

                decorations.push({ range });
            }
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.decorationType.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
