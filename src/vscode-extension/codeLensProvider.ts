import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Code lens provider for infographic code blocks in markdown files
 * Adds an "Edit" button in the gutter next to infographic code blocks
 */
export class InfographicCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Provide code lenses for the document
     */
    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Regex to match infographic code block start
        const infographicBlockRegex = /^```infographic\s*$/i;

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            
            // Check if this line starts an infographic code block
            if (infographicBlockRegex.test(line.trim())) {
                const startLine = i;
                let endLine = i + 1;
                let blockContent = '';

                // Find the end of the code block
                while (endLine < lines.length) {
                    if (lines[endLine].trim() === '```') {
                        break;
                    }
                    blockContent += lines[endLine] + '\n';
                    endLine++;
                }

                // Only add code lens if there's actual content
                if (blockContent.trim().length > 0) {
                    const range = new vscode.Range(
                        new vscode.Position(startLine, 0),
                        new vscode.Position(startLine, line.length)
                    );

                    const codeLens = new vscode.CodeLens(range, {
                        title: '$(edit) Edit Infographic',
                        tooltip: 'Edit Infographic Block',
                        command: 'infographicMarkdown.editBlock',
                        arguments: [
                            document.uri,
                            new vscode.Range(
                                new vscode.Position(startLine + 1, 0),
                                new vscode.Position(endLine, 0)
                            ),
                            blockContent,
                            path.basename(document.fileName),
                            startLine + 1
                        ]
                    });

                    codeLenses.push(codeLens);
                }

                // Move past this code block
                i = endLine + 1;
            } else {
                i++;
            }
        }

        return codeLenses;
    }

    /**
     * Refresh code lenses (called when document changes)
     */
    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }
}
