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

                // Check if changes affect a broader range around our tracked block
                // This handles cases where lines are added/deleted near the block
                const expandedRange = new vscode.Range(
                    new vscode.Position(Math.max(0, sourceRange.start.line - 5), 0),
                    new vscode.Position(sourceRange.end.line + 10, 0)
                );
                
                const affectsRange = e.contentChanges.some(change =>
                    change.range.intersection(expandedRange) !== undefined
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
     * Recalculate the source range by finding the current block boundaries
     */
    private static async recalculateSourceRange(tracking: SyncTracking): Promise<vscode.Range | undefined> {
        try {
            const sourceDoc = await vscode.workspace.openTextDocument(tracking.sourceUri);
            const lines = sourceDoc.getText().split('\n');
            
            // Start searching from the stored range as a hint
            const hintLine = tracking.sourceRange.start.line;
            const searchStart = Math.max(0, hintLine - 10); // Look 10 lines before
            const searchEnd = Math.min(lines.length, hintLine + 50); // Look 50 lines after
            
            // Find ```infographic blocks in the search range
            const infographicBlockRegex = /^```infographic\s*$/i;
            
            for (let i = searchStart; i < searchEnd; i++) {
                const line = lines[i];
                
                if (infographicBlockRegex.test(line.trim())) {
                    const openingFenceLine = i;
                    let closingFenceLine = i + 1;
                    
                    // Find the closing fence
                    while (closingFenceLine < lines.length) {
                        if (lines[closingFenceLine].trim() === '```') {
                            break;
                        }
                        closingFenceLine++;
                    }
                    
                    // Check if we found a valid block
                    if (closingFenceLine < lines.length) {
                        // Content range excludes both fences
                        const contentRange = new vscode.Range(
                            new vscode.Position(openingFenceLine + 1, 0),
                            new vscode.Position(closingFenceLine, 0)
                        );
                        
                        // If this is close to our hint, it's likely the right block
                        if (Math.abs(openingFenceLine - hintLine) <= 10) {
                            console.log(`[SyncService] Recalculated range: ${openingFenceLine + 1}-${closingFenceLine}`);
                            return contentRange;
                        }
                    }
                }
            }
            
            // Block not found
            console.warn('[SyncService] Could not find infographic block near stored range');
            return undefined;
        } catch (error) {
            console.error('[SyncService] Error recalculating source range:', error);
            return undefined;
        }
    }

    /**
     * Synchronize buffer content to source markdown range
     */
    private static async syncBufferToSource(blockKey: string, newContent: string): Promise<void> {
        const tracking = this.trackingMap.get(blockKey);
        if (!tracking) return;

        try {
            tracking.isSyncing = true;
            
            // Recalculate the source range to handle dynamic line changes
            const updatedRange = await this.recalculateSourceRange(tracking);
            
            if (!updatedRange) {
                console.error('[SyncService] Cannot sync: block not found in source');
                vscode.window.showWarningMessage('Infographic block not found in source document. Sync disabled.');
                this.cleanup(blockKey);
                return;
            }
            
            // Update the stored range
            tracking.sourceRange = updatedRange;
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(tracking.sourceUri, updatedRange, newContent);

            const success = await vscode.workspace.applyEdit(edit);

            if (success) {
                tracking.lastSyncContent = newContent;
                console.log(`[SyncService] Synced buffer to source: ${newContent.substring(0, 50)}...`);
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
            // Recalculate the source range to handle dynamic line changes
            const updatedRange = await this.recalculateSourceRange(tracking);
            
            if (!updatedRange) {
                console.warn('[SyncService] Block not found during source change, cleaning up');
                this.cleanup(blockKey);
                return;
            }
            
            // Update the stored range
            tracking.sourceRange = updatedRange;
            
            // Open source document to get current content
            const sourceDoc = await vscode.workspace.openTextDocument(tracking.sourceUri);
            const sourceContent = sourceDoc.getText(updatedRange);

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
                console.log(`[SyncService] Synced source to buffer: ${newContent.substring(0, 50)}...`);
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
