/**
 * Entry point for custom editor renderer bundle
 * This bundle is injected into webview to render infographic in custom editors
 */

import { InfographicOptions } from '@antv/infographic';
import { renderInfographicWithConfig } from '../shared-infographic/editorRenderer';

// Export as default for webpack library
export default {
    async render(container: HTMLElement, syntax: string, config: Partial<InfographicOptions>) {
        return await renderInfographicWithConfig(container, syntax, config);
    }
};
