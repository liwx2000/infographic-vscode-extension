import * as vscode from 'vscode';

/**
 * Tracking information for a virtual document
 */
interface VirtualDocumentTracking {
    virtualDocumentUri: vscode.Uri;
    sourceDocumentUri: vscode.Uri;
    sourceRange: vscode.Range;
    blockKey: string;
    lastSyncContent: string;
    subscriptions: vscode.Disposable[];
    debounceTimer?: NodeJS.Timeout;
}

/**
 * Interactive editor for infographic code blocks
 * Opens a new tab using temporary files that trigger the CustomTextEditorProvider
 */
export class InteractiveEditorManager {
    private trackingMap: Map<string, VirtualDocumentTracking> = new Map();
    private tempDir: vscode.Uri | null = null;
    private readonly DEBOUNCE_DELAY = 500; // milliseconds

    constructor(private readonly context: vscode.ExtensionContext) {
        this.initializeTempDirectory();
    }

    /**
     * Initialize temporary directory for virtual documents
     */
    private async initializeTempDirectory(): Promise<void> {
        try {
            this.tempDir = this.context.globalStorageUri;
            // Ensure directory exists
            await vscode.workspace.fs.createDirectory(this.tempDir);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize temp directory: ${error}`);
        }
    }

    /**
     * Open interactive editor for a code block
     */
    public async openEditor(
        documentUri: vscode.Uri,
        range: vscode.Range,
        content: string,
        fileName: string,
        line: number
    ): Promise<void> {
        // Create unique key for this block
        const blockKey = `${documentUri.toString()}#${range.start.line}-${range.end.line + 1}`;

        // Check if virtual document already exists for this block
        const existing = this.trackingMap.get(blockKey);
        if (existing) {
            // Focus on existing tab
            const doc = await vscode.workspace.openTextDocument(existing.virtualDocumentUri);
            await vscode.window.showTextDocument(doc, { preview: false });
            return;
        }

        // Create temporary file
        if (!this.tempDir) {
            await this.initializeTempDirectory();
            if (!this.tempDir) {
                vscode.window.showErrorMessage('Failed to create temporary directory');
                return;
            }
        }

        const rangeStr = `${range.start.line}-${range.end.line + 1}`;
        const tempFileName = `${fileName}_${rangeStr}.infographic`;
        const tempFileUri = vscode.Uri.joinPath(this.tempDir, tempFileName);

        try {
            // Write content to temporary file
            await vscode.workspace.fs.writeFile(
                tempFileUri,
                Buffer.from(content, 'utf8')
            );

            // Open the temporary file with the custom editor provider
            await vscode.commands.executeCommand(
                'vscode.openWith',
                tempFileUri,
                'infographicMarkdown.editor',
                vscode.ViewColumn.Active
            );

            // Set up tracking and synchronization
            this.setupTracking(tempFileUri, documentUri, range, blockKey, content);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open infographic editor: ${error}`);
        }
    }

    /**
     * Set up tracking and synchronization for a virtual document
     */
    private setupTracking(
        virtualDocumentUri: vscode.Uri,
        sourceDocumentUri: vscode.Uri,
        sourceRange: vscode.Range,
        blockKey: string,
        initialContent: string
    ): void {
        const subscriptions: vscode.Disposable[] = [];

        // Listen for changes to the virtual document
        const virtualDocChangeSubscription = vscode.workspace.onDidChangeTextDocument(async (e) => {
            if (e.document.uri.toString() === virtualDocumentUri.toString()) {
                const tracking = this.trackingMap.get(blockKey);
                if (!tracking) return;

                const newContent = e.document.getText();
                if (newContent === tracking.lastSyncContent) {
                    return; // No actual change
                }

                // Debounce the sync to avoid excessive updates
                if (tracking.debounceTimer) {
                    clearTimeout(tracking.debounceTimer);
                }

                tracking.debounceTimer = setTimeout(async () => {
                    await this.syncToSourceDocument(blockKey, newContent);
                }, this.DEBOUNCE_DELAY);
            }
        });

        // Listen for changes to the source markdown document
        const sourceDocChangeSubscription = vscode.workspace.onDidChangeTextDocument(async (e) => {
            if (e.document.uri.toString() === sourceDocumentUri.toString()) {
                const tracking = this.trackingMap.get(blockKey);
                if (!tracking) return;

                // Check if changes affect our range
                const affectsRange = e.contentChanges.some(change =>
                    change.range.intersection(sourceRange) !== undefined
                );

                if (affectsRange) {
                    const sourceContent = e.document.getText(sourceRange);
                    const virtualDoc = await vscode.workspace.openTextDocument(virtualDocumentUri);
                    const virtualContent = virtualDoc.getText();

                    // Check if contents differ
                    if (sourceContent !== virtualContent) {
                        const choice = await vscode.window.showWarningMessage(
                            'The source document has been modified. Your changes may conflict.',
                            'Reload from Source', 'Keep Editing'
                        );

                        if (choice === 'Reload from Source') {
                            await this.updateVirtualDocument(virtualDocumentUri, sourceContent, blockKey);
                        }
                    }
                }
            }
        });

        // Listen for document close events
        const closeSubscription = vscode.workspace.onDidCloseTextDocument((doc) => {
            if (doc.uri.toString() === virtualDocumentUri.toString()) {
                this.cleanup(blockKey);
            }
        });

        subscriptions.push(
            virtualDocChangeSubscription,
            sourceDocChangeSubscription,
            closeSubscription
        );

        // Store tracking information
        this.trackingMap.set(blockKey, {
            virtualDocumentUri,
            sourceDocumentUri,
            sourceRange,
            blockKey,
            lastSyncContent: initialContent,
            subscriptions
        });
    }

    /**
     * Synchronize changes from virtual document to source markdown
     */
    private async syncToSourceDocument(blockKey: string, newContent: string): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        try {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(tracking.sourceDocumentUri, tracking.sourceRange, newContent);

            const success = await vscode.workspace.applyEdit(edit);

            if (success) {
                tracking.lastSyncContent = newContent;
            } else {
                vscode.window.showErrorMessage('Failed to apply changes to source document');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to sync to source document: ${error}`);
        }
    }

    /**
     * Update virtual document content
     */
    private async updateVirtualDocument(
        virtualDocumentUri: vscode.Uri,
        newContent: string,
        blockKey: string
    ): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        try {
            const edit = new vscode.WorkspaceEdit();
            const doc = await vscode.workspace.openTextDocument(virtualDocumentUri);
            const fullRange = new vscode.Range(
                doc.positionAt(0),
                doc.positionAt(doc.getText().length)
            );
            edit.replace(virtualDocumentUri, fullRange, newContent);

            const success = await vscode.workspace.applyEdit(edit);

            if (success) {
                tracking.lastSyncContent = newContent;
            } else {
                vscode.window.showErrorMessage('Failed to update virtual document');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update virtual document: ${error}`);
        }
    }

    /**
     * Clean up tracking and delete temporary file
     */
    private async cleanup(blockKey: string): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        // Clear debounce timer
        if (tracking.debounceTimer) {
            clearTimeout(tracking.debounceTimer);
        }

        // Dispose all subscriptions
        tracking.subscriptions.forEach(sub => sub.dispose());

        // Delete temporary file
        try {
            await vscode.workspace.fs.delete(tracking.virtualDocumentUri);
        } catch (error) {
            // Ignore errors during cleanup
        }

        // Remove from tracking map
        this.trackingMap.delete(blockKey);
    }

    /**
     * Clean up all tracked documents (called on extension deactivate)
     */
    public async dispose(): Promise<void> {
        const keys = Array.from(this.trackingMap.keys());
        for (const key of keys) {
            await this.cleanup(key);
        }
    }
}
