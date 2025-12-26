import { Infographic } from '@antv/infographic';

/**
 * Cache for infographic instances
 */
interface InfographicCache {
  instance: any;
  syntax: string;
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

  // Check if we have a cached instance with the same syntax
  const cached = infographicInstances.get(id);
  if (cached && cached.syntax === syntax) {
    // Syntax hasn't changed, no need to re-render
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

  try {
    // Create new infographic instance
    const infographic = new Infographic({
      container: container,
      width: '100%',
      height: '100%',
    });

    // Render the infographic
    infographic.render(syntax);

    // Cache the instance
    infographicInstances.set(id, {
      instance: infographic,
      syntax: syntax
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
