import { Infographic, ThemeConfig } from '@antv/infographic';

/**
 * Configuration interface for infographic rendering
 */
export interface InfographicConfig {
    theme: string;
    width: string | number;
    height: string | number;
    padding: number | number[];
}

/**
 * Theme configuration constants
 */
const DARK_THEME: ThemeConfig = {
    colorBg: '#1F1F1F',
    colorPrimary: '#61DDAA'
};

const LIGHT_THEME: ThemeConfig = {
    colorBg: '#FFFFFF',
    colorPrimary: '#FF356A'
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: InfographicConfig = {
    theme: 'light',
    width: '100%',
    height: '100%',
    padding: 0
};

/**
 * Module-level cached configuration.
 * Loaded once during initialization to avoid repeated DOM queries.
 */
let cachedConfig: InfographicConfig | null = null;

/**
 * Load configuration from injected span element.
 * Config is injected at document level by the extension.
 * Results are cached to avoid repeated DOM queries.
 */
export function loadInfographicConfig(): InfographicConfig {
    const configElement = document.getElementById('infographicMarkdown');
    if (configElement) {
        try {
            const theme = configElement.getAttribute('data-theme');
            const width = configElement.getAttribute('data-width');
            const height = configElement.getAttribute('data-height');
            const paddingStr = configElement.getAttribute('data-padding');

            const currentConfig: InfographicConfig = {
                theme: theme || DEFAULT_CONFIG.theme,
                width: width || DEFAULT_CONFIG.width,
                height: height || DEFAULT_CONFIG.height,
                padding: paddingStr ? JSON.parse(paddingStr) : DEFAULT_CONFIG.padding
            };

            // Cache the loaded configuration
            cachedConfig = currentConfig;
            return currentConfig;
        } catch (e) {
            console.error('Failed to parse infographic configuration:', e);
        }
    }
    // No config element found or parsing failed, use defaults
    const defaultConfig = { ...DEFAULT_CONFIG };
    cachedConfig = defaultConfig;
    return defaultConfig;
}

/**
 * Get theme configuration object for given theme name
 */
export function getThemeConfig(theme: string): ThemeConfig {
    return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

/**
 * Get cached configuration. Returns null if config hasn't been loaded yet.
 * This is used by rendering functions to access pre-loaded configuration.
 */
function getCachedConfig(): InfographicConfig {
    if (!cachedConfig) {
        console.warn('Configuration not loaded yet. Loading now...');
        return loadInfographicConfig();
    }
    return cachedConfig;
}

/**
 * Create error display in container
 */
function displayError(container: HTMLElement, message: string, error?: Error): void {
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
 * Render a single infographic element
 */
function renderInfographicElement(
    infographicContainer: HTMLElement,
    writeOut: (infographicContainer: HTMLElement, content: string) => void
): {
    containerId: string;
    p: Promise<void>;
} {
    const containerId = `infographic-container-${crypto.randomUUID()}`;
    const syntax = infographicContainer.dataset.syntax;

    infographicContainer.id = containerId;

    if (!syntax) {
        displayError(infographicContainer, 'No syntax data found');
        return {
            containerId,
            p: Promise.resolve()
        };
    }

    if (!syntax || syntax.trim() === '') {
        infographicContainer.innerHTML = '';
        return {
            containerId,
            p: Promise.resolve()
        };
    }

    return {
        containerId,
        p: (async () => {
            try {
                // Get cached configuration (loaded during initialization)
                const config = getCachedConfig();
                const themeConfig = getThemeConfig(config.theme);

                // Clear container
                infographicContainer.innerHTML = '';
                infographicContainer.classList.remove('error-state');

                // Create new infographic instance with configuration
                const infographic = new Infographic({
                    container: infographicContainer,
                    width: config.width,
                    height: config.height,
                    padding: config.padding,
                    themeConfig: themeConfig
                });

                // Render the infographic
                infographic.render(syntax);

                // Note: We don't cache instances in this shared module
                // The preview script can handle caching if needed
            } catch (error) {
                console.error('Error rendering infographic:', error);
                displayError(
                    infographicContainer,
                    'Failed to render infographic. Please check your syntax.',
                    error as Error
                );
            }
        })()
    };
}

/**
 * Finds and renders all infographic containers in root element.
 * Similar to renderMermaidBlocksInElement in vscode-markdown-mermaid.
 * 
 * @param root - Root element to search for infographic containers
 * @param writeOut - Callback to write rendered content to container
 */
export async function renderInfographicBlocksInElement(
    root: HTMLElement,
    writeOut: (infographicContainer: HTMLElement, content: string) => void
): Promise<void> {
    // Delete existing infographic outputs
    const svgElements = Array.from(root.querySelectorAll('.infographic > svg'));
    for (const el of svgElements) {
        el.remove();
    }

    // We need to generate all the container ids sync, but then do the actual rendering async
    const renderPromises: Array<Promise<void>> = [];
    const infographicContainers = Array.from(root.querySelectorAll<HTMLElement>('.infographic'));
    for (const infographicContainer of infographicContainers) {
        renderPromises.push(renderInfographicElement(infographicContainer, writeOut).p);
    }

    for (const p of renderPromises) {
        await p;
    }
}
