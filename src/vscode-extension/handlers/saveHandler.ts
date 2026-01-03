import * as vscode from 'vscode';
import * as path from 'path';
import { TempFileCache } from '../cache/tempFileCache';
import { SyncService } from '../services/syncService';

/**
 * Handler for save operations on temporary infographic buffers
 * Prompts for folder selection and saves as standalone .infographic file
 */
export class SaveHandler {
    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Register save handler for document save events
     */
    register(): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];

        // Intercept save for temp files (but NOT untitled documents)
        const saveHandler = vscode.workspace.onWillSaveTextDocument(async (event) => {
            const document = event.document;
            const uri = document.uri.toString();

            // Check if this is a temporary buffer
            if (!TempFileCache.hasTempUri(this.context, uri)) {
                return; // Let VSCode handle normal saves
            }

            // For untitled documents, let VSCode handle the native save-as dialog
            // We'll cleanup in onDidCloseTextDocument or via custom save-as command
            if (document.uri.scheme === 'untitled') {
                return; // Let VSCode handle untitled document save-as
            }

            // Get tracking information to determine if this has a markdown source
            const tracking = SyncService.getTrackingByBufferUri(document.uri);
            
            if (tracking) {
                // This is a temporary buffer with markdown source - sync to markdown
                event.waitUntil(
                    this.handleTemporaryBufferSave(document)
                );
            }
        });

        disposables.push(saveHandler);
        
        // Register a command for explicit "Save As" functionality
        const saveAsCommand = vscode.commands.registerCommand(
            'infographicMarkdown.saveAs',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                        
                const document = editor.document;
                const uri = document.uri.toString();
                        
                // Handle different scenarios
                if (TempFileCache.hasTempUri(this.context, uri)) {
                    // This is a temp buffer - save as standalone file
                    await this.handleTemporaryBufferSaveAs(document);
                } else if (document.isUntitled) {
                    // This is an untitled document - show save as dialog
                    await this.handleUntitledDocumentSaveAs(document);
                } else {
                    // Regular file - use VSCode's built-in save as
                    await vscode.commands.executeCommand('workbench.action.files.saveAs');
                }
            });

        disposables.push(saveAsCommand);

        return vscode.Disposable.from(...disposables);
    }

    /**
     * Handle normal save operation for temporary buffer - sync to markdown
     */
    private async handleTemporaryBufferSave(document: vscode.TextDocument): Promise<void> {
        try {
            // Get tracking information
            const tracking = SyncService.getTrackingByBufferUri(document.uri);
            
            if (!tracking) {
                console.error('No tracking information found for temp file');
                return;
            }

            // Sync content back to markdown source
            const content = document.getText();
            const edit = new vscode.WorkspaceEdit();
            edit.replace(tracking.sourceUri, tracking.sourceRange, content);
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                // Save the source markdown file
                const sourceDoc = await vscode.workspace.openTextDocument(tracking.sourceUri);
                await sourceDoc.save();
                
                // Update last sync content
                tracking.lastSyncContent = content;
                
                // Don't write the temp file here - let VSCode's normal save flow handle it
                // This allows the file to be properly marked as saved by VSCode
            } else {
                vscode.window.showErrorMessage('Failed to sync changes to markdown source');
            }
        } catch (error) {
            console.error('Save error:', error);
            vscode.window.showErrorMessage(
                `Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Handle "Save As" operation for temporary buffer
     */
    private async handleTemporaryBufferSaveAs(document: vscode.TextDocument): Promise<void> {
        try {
            // Get tracking information to derive filename
            const tracking = SyncService.getTrackingByBufferUri(document.uri);
            
            // Show save dialog instead of folder selection
            const saveUri = await this.showSaveAsDialog(document, tracking);
            
            if (!saveUri) {
                // User cancelled
                return;
            }

            // Write content to file
            const content = document.getText();
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

            // Remove from TempFileCache
            TempFileCache.removeTempUri(this.context, document.uri.toString());

            // Show success message
            vscode.window.showInformationMessage(
                `Infographic saved to: ${path.basename(saveUri.fsPath)}`
            );

            // Note: Buffer remains open as per design requirements
        } catch (error) {
            console.error('Save error:', error);
            vscode.window.showErrorMessage(
                `Failed to save infographic: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Handle save operation for untitled document
     * Shows save-as dialog and saves to chosen location
     */
    private async handleUntitledDocumentSaveAs(document: vscode.TextDocument): Promise<void> {
        try {
            // Show save dialog
            const saveUri = await this.showSaveAsDialog(document, null);
            
            if (!saveUri) {
                // User cancelled - document remains dirty and open
                return;
            }

            // Write content to file
            const content = document.getText();
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

            // Success message
            vscode.window.showInformationMessage(
                `Infographic saved to: ${path.basename(saveUri.fsPath)}`
            );
        } catch (error) {
            console.error('Save error:', error);
            vscode.window.showErrorMessage(
                `Failed to save infographic: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Show save-as dialog with appropriate defaults
     */
    private async showSaveAsDialog(
        document: vscode.TextDocument, 
        tracking: any
    ): Promise<vscode.Uri | undefined> {
        // Generate default filename
        const defaultFilename = this.generateFilename(tracking);
        
        // Determine default directory
        let defaultUri: vscode.Uri | undefined;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (tracking && tracking.sourceUri) {
            // Use the directory of the source markdown file
            const sourceDir = vscode.Uri.joinPath(tracking.sourceUri, '..');
            defaultUri = vscode.Uri.joinPath(sourceDir, defaultFilename);
        } else if (workspaceFolders && workspaceFolders.length > 0) {
            // Use workspace root
            defaultUri = vscode.Uri.joinPath(workspaceFolders[0].uri, defaultFilename);
        } else if (document.uri.scheme === 'file') {
            // Use document's directory if available
            const docDir = vscode.Uri.joinPath(document.uri, '..');
            defaultUri = vscode.Uri.joinPath(docDir, defaultFilename);
        }

        // Show save dialog
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: defaultUri,
            filters: {
                'Infographic': ['infographic']
            },
            title: 'Save Infographic',
            saveLabel: 'Save'
        });

        return saveUri;
    }

    /**
     * Generate filename for saved infographic
     * Pattern: {originalFileName}_{startLine}-{endLine}.infographic
     */
    private generateFilename(tracking: any): string {
        if (tracking && tracking.sourceUri && tracking.sourceRange) {
            const sourceFileName = path.basename(tracking.sourceUri.fsPath, path.extname(tracking.sourceUri.fsPath));
            const startLine = tracking.sourceRange.start.line;
            const endLine = tracking.sourceRange.end.line;
            return `${sourceFileName}_${startLine}-${endLine}.infographic`;
        }
        
        // Fallback filename if tracking info not available
        const timestamp = new Date().getTime();
        return `infographic_${timestamp}.infographic`;
    }
}
