import { Infographic, ThemeConfig } from '@antv/infographic';
import { InfographicConfig, getThemeConfig } from './index';

/**
 * Render infographic syntax directly in a container with provided configuration.
 * This is used by custom editors and interactive editors where config comes from extension settings,
 * not from injected DOM elements.
 */
export async function renderInfographicWithConfig(
    container: HTMLElement,
    syntax: string,
    config: InfographicConfig
): Promise<void> {
    try {      
        // Clear container
        container.innerHTML = '';
        container.classList.remove('error-state');

        if (!syntax || syntax.trim() === '') {
            return;
        }

        // Get theme configuration
        const themeConfig = getThemeConfig(config.theme);

        // Create new infographic instance with configuration
        const infographic = new Infographic({
            container: container,
            width: config.width,
            height: config.height,
            padding: config.padding,
            themeConfig: themeConfig
        });

        // Render the infographic
        infographic.render(syntax);
    } catch (error) {
        console.error('Error rendering infographic:', error);
        displayEditorError(container, 'Failed to render infographic. Please check your syntax.', error as Error);
        // Don't throw - just display the error
    }
}

/**
 * Create error display in container for editor contexts
 */
function displayEditorError(container: HTMLElement, message: string, error?: Error): void {
    container.innerHTML = `
        <div class="infographic-error">
            <div class="error-icon">⚠️</div>
            <div class="error-title">Infographic Rendering Error</div>
            <div class="error-message">${message}</div>
            ${error ? `<div class="error-details">${error.message}</div>` : ''}
        </div>
    `;
    container.classList.add('error-state');
}

/**
 * Parse configuration from data attributes (for webview contexts)
 */
export function parseConfigFromAttributes(element: HTMLElement): InfographicConfig {
    const theme = element.dataset.theme || 'light';
    const width = element.dataset.width || '100%';
    const height = element.dataset.height || '100%';
    const paddingStr = element.dataset.padding;

    let padding: number | number[] = 0;
    if (paddingStr) {
        try {
            padding = JSON.parse(paddingStr);
        } catch (e) {
            console.warn('Failed to parse padding, using default:', e);
        }
    }

    return { theme, width, height, padding };
}
