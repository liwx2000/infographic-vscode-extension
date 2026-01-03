import * as vscode from 'vscode';
import { InfographicService } from '../services/infographicService';

/**
 * Message types for webview communication
 */
export const MessageTypes = {
    READY: 'ready',
    ERROR: 'error',
    EDIT: 'edit',
    UPDATE_CONTENT: 'updateContent',
    UPDATE_CONFIG: 'updateConfig',
    EXPORT_SVG: 'exportSvg',
    EXPORT_PNG: 'exportPng'
} as const;

/**
 * Handle edit message from webview
 */
export async function handleEditMessage(
    document: vscode.TextDocument,
    content: string,
    isUpdatingFromWebview: { value: boolean }
): Promise<void> {
    try {
        isUpdatingFromWebview.value = true;
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, content);
        await vscode.workspace.applyEdit(edit);
    } catch (error) {
        console.error('Error applying edit:', error);
        vscode.window.showErrorMessage(`Failed to apply changes: ${error}`);
    }
}

/**
 * Handle error message from webview
 */
export function handleErrorMessage(
    message: string,
    diagnosticCollection: vscode.DiagnosticCollection
): void {
    vscode.window.showErrorMessage(`Infographic rendering error: ${message}`);
}

/**
 * Handle export message from webview
 */
export async function handleExportMessage(
    type: string,
    data: string,
    document: vscode.TextDocument
): Promise<void> {
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting ${type === MessageTypes.EXPORT_SVG ? 'SVG' : 'PNG'}...`,
            cancellable: false
        }, async () => {
            if (type === MessageTypes.EXPORT_SVG) {
                await InfographicService.exportAsSvg(document, data);
            } else if (type === MessageTypes.EXPORT_PNG) {
                await InfographicService.exportAsPng(document, data);
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        vscode.window.showErrorMessage(`Export failed: ${error}`);
    }
}
