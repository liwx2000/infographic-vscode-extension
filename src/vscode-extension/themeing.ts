import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { configSection } from './config';

/**
 * Detect current VSCode theme kind (light or dark)
 */
function detectThemeKind(): 'light' | 'dark' {
    const currentTheme = vscode.window.activeColorTheme;
    // ColorThemeKind: 1 = Light, 2 = Dark, 3 = HighContrast, 4 = HighContrastLight
    return currentTheme.kind === vscode.ColorThemeKind.Light ||
        currentTheme.kind === vscode.ColorThemeKind.HighContrastLight
        ? 'light'
        : 'dark';
}

/**
 * Resolve theme setting to actual theme value
 */
function resolveTheme(themeSetting: 'auto' | 'light' | 'dark'): 'light' | 'dark' {
    if (themeSetting === 'auto') {
        return detectThemeKind();
    }
    return themeSetting;
}

/**
 * Validate padding value
 */
function validatePadding(value: any, defaultValue: number | number[]): number | number[] {
    if (typeof value === 'number' && value >= 0) {
        return value;
    }
    if (Array.isArray(value) && value.length === 4 && value.every(v => typeof v === 'number' && v >= 0)) {
        return value;
    }
    return defaultValue;
}

/**
 * Inject infographic configuration into rendered output.
 * This approach ensures config is always fresh on each render.
 * Similar to vscode-markdown-mermaid implementation.
 */
export function injectInfographicConfig(md: MarkdownIt): MarkdownIt {
    const render = md.renderer.render;
    md.renderer.render = function (...args) {
        const config = vscode.workspace.getConfiguration(configSection);

        const themeSetting = config.get<'auto' | 'light' | 'dark'>('theme', 'auto');
        const resolvedTheme = resolveTheme(themeSetting);
        const width = config.get<string | number>('width', '100%');
        const height = config.get<string | number>('height', '100%');
        const padding = validatePadding(config.get<number | number[]>('padding', 0), 0);

        return `<span id="${configSection}" aria-hidden="true"
                    data-theme="${resolvedTheme}"
                    data-width="${width}"
                    data-height="${height}"
                    data-padding="${JSON.stringify(padding).replace(/"/g, '&quot;')}"></span>
                ${render.apply(md.renderer, args)}`;
    };
    return md;
}
