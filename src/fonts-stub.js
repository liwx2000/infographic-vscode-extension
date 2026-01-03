// Stub for @antv/infographic/lib/renderer/fonts

const DEFAULT_FONT = 'Arial, sans-serif';

function getFontURLs() {
    return {};
}

function getWoff2BaseURL() {
    return '';
}

function loadFont() {
    return Promise.resolve();
}

function loadFonts() {
    return Promise.resolve();
}

function getFont() { 
    return null; 
}

function getFonts() { 
    return []; 
}

function registerFont(font) { 
    return { fontFamily: font?.fontFamily || 'Arial' }; 
}

function setDefaultFont() {}

function unregisterFont() { 
    return null; 
}

module.exports = {
    DEFAULT_FONT,
    getFontURLs,
    getWoff2BaseURL,
    loadFont,
    loadFonts,
    getFont,
    getFonts,
    registerFont,
    setDefaultFont,
    unregisterFont
};
