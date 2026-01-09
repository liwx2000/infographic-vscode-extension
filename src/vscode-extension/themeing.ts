import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { configSection } from './config';



/**
 * Inject infographic configuration into rendered output.
 * This approach ensures config is always fresh on each render.
 * Similar to vscode-markdown-mermaid implementation.
 */
export function injectInfographicConfig(md: MarkdownIt): MarkdownIt {
    const render = md.renderer.render;
    md.renderer.render = function (...args) {
        const config = vscode.workspace.getConfiguration(configSection);

        const width = config.get<string | number>('width', '100%');
        const height = config.get<string | number>('height', '100%');
        const padding = config.get<number | number[]>('padding', 0);

        return `<span id="${configSection}" aria-hidden="true"
                    data-width="${width}"
                    data-height="${height}"
                    data-padding="${JSON.stringify(padding).replace(/"/g, '&quot;')}"></span>
                ${render.apply(md.renderer, args)}`;
    };
    return md;
}
