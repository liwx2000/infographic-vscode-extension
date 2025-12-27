import * as vscode from 'vscode';

/**
 * Configuration interface for infographic settings
 */
export interface InfographicConfig {
  theme: 'auto' | 'light' | 'dark';
  width: string | number;
  height: string | number;
  padding: number | number[];
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: InfographicConfig = {
  theme: 'auto',
  width: '100%',
  height: '100%',
  padding: 0
};

/**
 * Validate padding value
 * Can be a single number or an array of 4 numbers
 */
function validatePadding(value: any, defaultValue: number | number[]): number | number[] {
  if (typeof value === 'number' && value >= 0) {
    return value;
  }
  if (Array.isArray(value) && value.length === 4 && value.every(v => typeof v === 'number' && v >= 0)) {
    return value;
  }
  console.warn(`Invalid padding value: ${JSON.stringify(value)}. Using default: ${defaultValue}`);
  return defaultValue;
}

/**
 * Detect current VSCode theme kind (light or dark)
 */
export function detectThemeKind(): 'light' | 'dark' {
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
export function resolveTheme(themeSetting: 'auto' | 'light' | 'dark'): 'light' | 'dark' {
  if (themeSetting === 'auto') {
    return detectThemeKind();
  }
  return themeSetting;
}

/**
 * Read and validate configuration from VSCode settings
 */
export function getConfig(): InfographicConfig {
  const config = vscode.workspace.getConfiguration('infographicMarkdown');
  
  const theme = config.get<'auto' | 'light' | 'dark'>('theme', DEFAULT_CONFIG.theme);
  const width = config.get<string | number>('width', DEFAULT_CONFIG.width);
  const height = config.get<string | number>('height', DEFAULT_CONFIG.height);
  const padding = validatePadding(
    config.get<number | number[]>('padding', DEFAULT_CONFIG.padding),
    DEFAULT_CONFIG.padding
  );

  return {
    theme,
    width,
    height,
    padding
  };
}

/**
 * Get configuration with resolved theme (auto -> light/dark)
 */
export function getResolvedConfig(): InfographicConfig & { resolvedTheme: 'light' | 'dark' } {
  const config = getConfig();
  return {
    ...config,
    resolvedTheme: resolveTheme(config.theme)
  };
}
