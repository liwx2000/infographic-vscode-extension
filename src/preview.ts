import { Infographic, ThemeConfig } from '@antv/infographic';

/**
 * Configuration interface for infographic rendering
 */
interface InfographicConfig {
  theme: string;
  width: string | number;
  height: string | number;
  padding: number | number[];
}

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
 * Load configuration from injected span element
 * Config is injected at document level by markdown-it plugin
 */
function loadConfig(): InfographicConfig {
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
      
      console.log('Loaded infographic configuration:', currentConfig);
      return currentConfig;
    } catch (e) {
      console.error('Failed to parse infographic configuration:', e);
    }
  }
  // No config element found or parsing failed, use defaults
  return { ...DEFAULT_CONFIG };
}

/**
 * Cache for infographic instances
 */
interface InfographicCache {
  instance: any;
  syntax: string;
  config: InfographicConfig; // Store config to detect changes
}

const infographicInstances = new Map<string, InfographicCache>();

/**
 * Decode base64 encoded syntax
 */
function decodeSyntax(encoded: string): string {
  try {
    return atob(encoded);
  } catch (e) {
    console.error('Failed to decode syntax:', e);
    return '';
  }
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
 * Render a single infographic in a container
 */
function renderInfographic(container: HTMLElement): void {
  const id = container.id;
  const encodedSyntax = container.getAttribute('data-syntax');

  if (!encodedSyntax) {
    displayError(container, 'No syntax data found');
    return;
  }

  const syntax = decodeSyntax(encodedSyntax);

  if (!syntax || syntax.trim() === '') {
    container.innerHTML = `
      <div class="infographic-placeholder">
        <div class="placeholder-icon">📊</div>
        <div class="placeholder-text">Add infographic syntax here</div>
      </div>
    `;
    return;
  }

  // Reload configuration before rendering to ensure we have the latest settings
  const currentConfig = loadConfig();

  // Check if we have a cached instance with the same syntax and config
  const cached = infographicInstances.get(id);
  const configChanged = cached && JSON.stringify(cached.config) !== JSON.stringify(currentConfig);
  
  if (cached && cached.syntax === syntax && !configChanged) {
    // Syntax and config haven't changed, no need to re-render
    return;
  }

  // Destroy old instance if exists
  if (cached && cached.instance) {
    try {
      cached.instance.destroy();
    } catch (e) {
      console.error('Error destroying old instance:', e);
    }
  }

  // Clear container
  container.innerHTML = '';
  container.classList.remove('error-state');

  const theme = currentConfig.theme;
  let themeConfig: ThemeConfig = LIGHT_THEME;
  if (theme === 'dark') {
    themeConfig = DARK_THEME;
  }

  try {
    // Create new infographic instance with configuration
    const infographic = new Infographic({
      container: container,
      width: currentConfig.width,
      height: currentConfig.height,
      padding: currentConfig.padding,
      themeConfig: themeConfig
    });

    // Render the infographic
    infographic.render(syntax);

    // Cache the instance with config
    infographicInstances.set(id, {
      instance: infographic,
      syntax: syntax,
      config: { ...currentConfig }
    });

  } catch (error) {
    console.error('Error rendering infographic:', error);
    displayError(
      container,
      'Failed to render infographic. Please check your syntax.',
      error as Error
    );
  }
}

/**
 * Initialize all infographic containers in the document
 */
function initializeInfographics(): void {
  const containers = document.querySelectorAll('.infographic-container');
  
  containers.forEach((container) => {
    if (container instanceof HTMLElement) {
      renderInfographic(container);
    }
  });
}

/**
 * Cleanup removed containers
 */
function cleanupRemovedContainers(): void {
  const currentIds = new Set(
    Array.from(document.querySelectorAll('.infographic-container'))
      .map(el => el.id)
  );

  // Remove instances for containers that no longer exist
  for (const [id, cached] of infographicInstances.entries()) {
    if (!currentIds.has(id)) {
      try {
        cached.instance.destroy();
      } catch (e) {
        console.error('Error destroying instance during cleanup:', e);
      }
      infographicInstances.delete(id);
    }
  }
}

/**
 * Observer for detecting DOM changes
 */
let observer: MutationObserver | null = null;

/**
 * Setup mutation observer to detect document updates
 */
function setupObserver(): void {
  // Cleanup old observer if exists
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    let needsUpdate = false;

    for (const mutation of mutations) {
      // Check if infographic containers were added or removed
      if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
        needsUpdate = true;
        break;
      }

      // Check if attributes changed on infographic containers
      if (mutation.type === 'attributes' && 
          mutation.target instanceof HTMLElement &&
          mutation.target.classList.contains('infographic-container')) {
        needsUpdate = true;
        break;
      }
    }

    if (needsUpdate) {
      // Debounce updates
      setTimeout(() => {
        cleanupRemovedContainers();
        initializeInfographics();
      }, 100);
    }
  });

  // Observe the entire document body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-syntax']
  });
}

/**
 * Main initialization
 */
(function() {
  'use strict';

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeInfographics();
      setupObserver();
    });
  } else {
    initializeInfographics();
    setupObserver();
  }

  // Re-initialize on window load (for late-loaded content)
  window.addEventListener('load', () => {
    initializeInfographics();
  });
})();
