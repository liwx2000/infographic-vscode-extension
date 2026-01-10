import { Infographic, InfographicOptions } from '@antv/infographic';

/**
 * Render infographic syntax directly in a container with provided configuration.
 * This is used by custom editors and interactive editors where config comes from extension settings,
 * not from injected DOM elements.
 * Returns the Infographic instance for export operations.
 */
export async function renderInfographicWithConfig(
    container: HTMLElement,
    syntax: string,
    config: Partial<InfographicOptions>
): Promise<Infographic | null> {
    try {      
        // Clear container
        container.innerHTML = '';
        container.classList.remove('error-state');

        if (!syntax || syntax.trim() === '') {
            return null;
        }

        // Create new infographic instance with configuration
        const infographic = new Infographic({
            container: container,
            ...config
        });

        // Render the infographic
        infographic.render(syntax);
        
        // Return the instance for export operations
        return infographic;
    } catch (error) {
        console.error('Error rendering infographic:', error);
        displayEditorError(container, 'Failed to render infographic. Please check your syntax.', error as Error);
        // Don't throw - just display the error
        return null;
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
