// Stub for measury module to avoid build errors in browser context

function measureText(text, options) {
    const { fontSize = 14, lineHeight = 1.4 } = options;
    const charWidth = fontSize * 0.6;
    const width = text.length * charWidth;
    const height = fontSize * lineHeight;
    return { width, height };
}

function registerFont() {
    return {};
}

module.exports = {
    measureText,
    registerFont
};
