/**
 * Stub for measury module
 * This provides fallback implementations for browser context
 * where canvas-based measurement is available
 */

// Export functions that measury would export
export function measureText(text, options) {
  // In browser context, we can use canvas for text measurement
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      const fontSize = options.fontSize || 14;
      const fontFamily = options.fontFamily || 'sans-serif';
      const fontWeight = options.fontWeight || 'normal';
      context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = context.measureText(text);
      return {
        width: metrics.width,
        height: fontSize * (options.lineHeight || 1.2)
      };
    }
  }
  
  // Fallback: estimate based on character count
  const fontSize = options.fontSize || 14;
  return {
    width: text.length * fontSize * 0.6,
    height: fontSize * (options.lineHeight || 1.2)
  };
}

export function registerFont() {
  // No-op in browser context
  return true;
}

// Default export for default import
export default {
  measureText,
  registerFont
};
