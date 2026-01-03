import * as vscode from "vscode";

/**
 * Manages temporary infographic files created from markdown code blocks
 * Uses VSCode's globalState for persistent tracking across extension sessions
 */
export class TempFileCache {
    private static cacheKey = "infographicTempFileURIs";

    /**
     * Retrieve all tracked temporary file URIs
     */
    static getAllTempUris(context: vscode.ExtensionContext): string[] {
        return context.globalState.get<string[]>(this.cacheKey, []);
    }

    /**
     * Add a URI to the temporary files list
     */
    static addTempUri(context: vscode.ExtensionContext, uri: string): void {
        const uris = this.getAllTempUris(context);
        if (!uris.includes(uri)) {
            uris.push(uri);
            context.globalState.update(this.cacheKey, uris);
        }
    }

    /**
     * Remove a URI from the temporary files list
     */
    static removeTempUri(context: vscode.ExtensionContext, uri: string): void {
        let uris = this.getAllTempUris(context);
        uris = uris.filter((existingUri) => existingUri !== uri);
        context.globalState.update(this.cacheKey, uris);
    }

    /**
     * Check if a URI is tracked as a temporary file
     */
    static hasTempUri(context: vscode.ExtensionContext, uri: string): boolean {
        return this.getAllTempUris(context).includes(uri);
    }

    /**
     * Clear all temporary file URIs (called on extension deactivation)
     */
    static clearTempUris(context: vscode.ExtensionContext): void {
        context.globalState.update(this.cacheKey, []);
    }
}
