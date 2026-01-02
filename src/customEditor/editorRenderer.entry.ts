/**
 * Entry point for custom editor renderer bundle
 * This bundle is injected into webview to render infographic in custom editors
 */

import { renderInfographicWithConfig, parseConfigFromAttributes } from '../shared-infographic/editorRenderer';

// Export as default for webpack library
export default {
    async render(container: HTMLElement, syntax: string) {
        const config = parseConfigFromAttributes(container);
        await renderInfographicWithConfig(container, syntax, config);
    }
};
