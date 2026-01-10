import * as vscode from 'vscode';
import { debounce } from '../utils/debounce';

/**
 * Tracking information for synchronized temporary buffers
 */
export interface SyncTracking {
    bufferUri: vscode.Uri;
    sourceUri: vscode.Uri;
    sourceRange: vscode.Range;
    blockKey: string;
    lastSyncContent: string;
    disposables: vscode.Disposable[];
    isSyncing: boolean;  // Flag to prevent circular sync
}

/**
 * Service for synchronizing temporary infographic buffers with source markdown files
 */
export class SyncService {
    private static trackingMap: Map<string, SyncTracking> = new Map();
    private static readonly DEBOUNCE_DELAY = 500;

    /**
     * Set up bidirectional synchronization for a temporary buffer
     */
    static setupSync(
        bufferUri: vscode.Uri,
        sourceUri: vscode.Uri,
        sourceRange: vscode.Range,
        initialContent: string
    ): void {
        const blockKey = `${sourceUri.toString()}#${sourceRange.start.line}-${sourceRange.end.line}`;
        
        // Check if already tracking this block
        if (this.trackingMap.has(blockKey)) {
            return;
        }

        const disposables: vscode.Disposable[] = [];

        // Create debounced sync function for buffer to source
        const debouncedSyncToSource = debounce(async (newContent: string) => {
            await this.syncBufferToSource(blockKey, newContent);
        }, this.DEBOUNCE_DELAY);

        // Listen for changes to the buffer document
        const bufferChangeSubscription = vscode.workspace.onDidChangeTextDocument(async (e) => {
            if (e.document.uri.toString() === bufferUri.toString()) {
                const tracking = this.trackingMap.get(blockKey);
                if (!tracking || tracking.isSyncing) return;

                const newContent = e.document.getText();
                if (newContent === tracking.lastSyncContent) {
                    return; // No actual change
                }

                // Use debounced sync to sync changes back to markdown
                debouncedSyncToSource(newContent);
            }
        });

        // Listen for changes to the source markdown document
        const sourceChangeSubscription = vscode.workspace.onDidChangeTextDocument(async (e) => {
            if (e.document.uri.toString() === sourceUri.toString()) {
                const tracking = this.trackingMap.get(blockKey);
                if (!tracking || tracking.isSyncing) return;

                // Check if changes affect our range
                const affectsRange = e.contentChanges.some(change =>
                    change.range.intersection(sourceRange) !== undefined
                );

                if (affectsRange) {
                    await this.handleSourceChange(blockKey);
                }
            }
        });

        // Listen for buffer document close events
        const closeSubscription = vscode.workspace.onDidCloseTextDocument((doc) => {
            if (doc.uri.toString() === bufferUri.toString()) {
                this.cleanup(blockKey);
            }
        });

        disposables.push(
            bufferChangeSubscription,
            sourceChangeSubscription,
            closeSubscription
        );

        // Store tracking information
        this.trackingMap.set(blockKey, {
            bufferUri,
            sourceUri,
            sourceRange,
            blockKey,
            lastSyncContent: initialContent,
            disposables,
            isSyncing: false
        });
    }

    /**
     * Synchronize buffer content to source markdown range
     */
    private static async syncBufferToSource(blockKey: string, newContent: string): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        try {
            tracking.isSyncing = true;
            const edit = new vscode.WorkspaceEdit();
            edit.replace(tracking.sourceUri, tracking.sourceRange, newContent);

            const success = await vscode.workspace.applyEdit(edit);

            if (success) {
                tracking.lastSyncContent = newContent;
            } else {
                vscode.window.showErrorMessage('Failed to sync changes to markdown source');
            }
        } catch (error) {
            console.error('Sync error:', error);
            vscode.window.showErrorMessage(`Failed to sync to source: ${error}`);
        } finally {
            tracking.isSyncing = false;
        }
    }

    /**
     * Handle changes to source markdown document
     */
    private static async handleSourceChange(blockKey: string): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        try {
            // Open source document to get current content
            const sourceDoc = await vscode.workspace.openTextDocument(tracking.sourceUri);
            const sourceContent = sourceDoc.getText(tracking.sourceRange);

            // Open buffer document to get current content
            const bufferDoc = await vscode.workspace.openTextDocument(tracking.bufferUri);
            const bufferContent = bufferDoc.getText();

            // Check if contents differ
            if (sourceContent !== bufferContent) {
                // Auto-sync without notification for seamless two-way sync
                await this.syncSourceToBuffer(blockKey, sourceContent);
            }
        } catch (error) {
            console.error('Source change handling error:', error);
        }
    }

    /**
     * Synchronize source content to buffer
     */
    private static async syncSourceToBuffer(blockKey: string, newContent: string): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        try {
            tracking.isSyncing = true;
            const edit = new vscode.WorkspaceEdit();
            const bufferDoc = await vscode.workspace.openTextDocument(tracking.bufferUri);
            const fullRange = new vscode.Range(
                bufferDoc.positionAt(0),
                bufferDoc.positionAt(bufferDoc.getText().length)
            );
            edit.replace(tracking.bufferUri, fullRange, newContent);

            const success = await vscode.workspace.applyEdit(edit);

            if (success) {
                tracking.lastSyncContent = newContent;
            } else {
                vscode.window.showErrorMessage('Failed to reload content from source');
            }
        } catch (error) {
            console.error('Source to buffer sync error:', error);
            vscode.window.showErrorMessage(`Failed to reload from source: ${error}`);
        } finally {
            tracking.isSyncing = false;
        }
    }

    /**
     * Clean up tracking and dispose listeners for a block
     */
    static cleanup(blockKey: string): void {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        // Dispose all subscriptions
        tracking.disposables.forEach(disposable => disposable.dispose());

        // Remove from tracking map
        this.trackingMap.delete(blockKey);
    }

    /**
     * Clean up all tracked synchronizations (called on extension deactivate)
     */
    static disposeAll(): void {
        const keys = Array.from(this.trackingMap.keys());
        for (const key of keys) {
            this.cleanup(key);
        }
    }

    /**
     * Check if a buffer URI is being tracked for synchronization
     */
    static isTracked(bufferUri: vscode.Uri): boolean {
        for (const tracking of this.trackingMap.values()) {
            if (tracking.bufferUri.toString() === bufferUri.toString()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get tracking information for a buffer URI
     */
    static getTrackingByBufferUri(bufferUri: vscode.Uri): SyncTracking | undefined {
        for (const tracking of this.trackingMap.values()) {
            if (tracking.bufferUri.toString() === bufferUri.toString()) {
                return tracking;
            }
        }
        return undefined;
    }

    /**
     * Cleanup tracking by buffer URI
     */
    static cleanupByBufferUri(bufferUri: vscode.Uri): void {
        const tracking = this.getTrackingByBufferUri(bufferUri);
        if (tracking) {
            this.cleanup(tracking.blockKey);
        }
    }
}
