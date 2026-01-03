import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

/**
 * Service for infographic export operations
 */
export class InfographicService {
    /**
     * Export infographic as SVG
     */
    static async exportAsSvg(document: vscode.TextDocument, svgData: string): Promise<void> {
        try {
            const defaultUri = this.getDefaultExportUri(document, 'svg');
            
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: defaultUri,
                filters: {
                    'SVG Image': ['svg']
                },
                title: 'Export Infographic as SVG'
            });
            
            if (saveUri) {
                const svgBuffer = Buffer.from(svgData, 'base64');
                await vscode.workspace.fs.writeFile(saveUri, svgBuffer);
                vscode.window.showInformationMessage(`Infographic exported to ${saveUri.fsPath}`);
            }
        } catch (error) {
            console.error('Error in SVG export:', error);
            vscode.window.showErrorMessage(
                `Failed to export infographic as SVG. Please ensure the content is valid and try again.`
            );
        }
    }

    /**
     * Export infographic as PNG
     */
    static async exportAsPng(document: vscode.TextDocument, pngData: string): Promise<void> {
        try {
            const defaultUri = this.getDefaultExportUri(document, 'png');
            
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: defaultUri,
                filters: {
                    'PNG Image': ['png']
                },
                title: 'Export Infographic as PNG'
            });
            
            if (saveUri) {
                const pngBuffer = Buffer.from(pngData, 'base64');
                await vscode.workspace.fs.writeFile(saveUri, pngBuffer);
                vscode.window.showInformationMessage(`Infographic exported to ${saveUri.fsPath}`);
            }
        } catch (error) {
            console.error('Error in PNG export:', error);
            vscode.window.showErrorMessage(
                `Failed to export infographic as PNG. Please ensure the content is valid and try again.`
            );
        }
    }

    /**
     * Generate default export URI based on document name
     */
    private static getDefaultExportUri(document: vscode.TextDocument, format: 'svg' | 'png'): vscode.Uri {
        const documentUri = document.uri;
        
        // If document has a valid file path, use its directory
        if (documentUri.scheme === 'file' && documentUri.fsPath) {
            const docDir = path.dirname(documentUri.fsPath);
            const docName = path.basename(documentUri.fsPath, path.extname(documentUri.fsPath));
            const fileName = `${docName}.${format}`;
            return vscode.Uri.file(path.join(docDir, fileName));
        }
        
        // For untitled or temp files, use home directory
        const fileName = `infographic.${format}`;
        return vscode.Uri.file(path.join(os.homedir(), fileName));
    }
}
