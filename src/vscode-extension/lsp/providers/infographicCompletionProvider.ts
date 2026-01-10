import * as vscode from 'vscode';
import { analyzeContext, AnalysisContext } from '../parser/contextAnalyzer';
import { 
  BLOCK_KEYWORDS, 
  DESIGN_KEYWORDS, 
  DATA_KEYWORDS, 
  THEME_KEYWORDS,
  ALIGNMENT_VALUES,
  BOOLEAN_VALUES,
  STYLIZE_VALUES
} from '../schema/keywords';
import { BUILTIN_TEMPLATES } from '../schema/templates';
import { BUILTIN_STRUCTURES } from '../schema/structures';
import { BUILTIN_THEMES, BUILTIN_ITEM_DESIGNS, BUILTIN_TITLE_DESIGNS } from '../schema/themes';

/**
 * Completion provider for Infographic syntax
 */
export class InfographicCompletionProvider implements vscode.CompletionItemProvider {
  
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    
    // Check if document is infographic or markdown with infographic blocks
    const isInfographic = document.languageId === 'infographic';
    const isMarkdown = document.languageId === 'markdown';
    
    if (!isInfographic && !isMarkdown) {
      return [];
    }

    // Suppress automatic completions - only allow manual invocation
    // This prevents unwanted auto-insertion when typing
    if (context.triggerKind !== vscode.CompletionTriggerKind.Invoke) {
      return [];
    }

    // Analyze context
    const analysisContext = analyzeContext(document, position);

    // Generate suggestions based on context
    return this.getSuggestionsForContext(analysisContext);
  }

  private getSuggestionsForContext(context: AnalysisContext): vscode.CompletionItem[] {
    switch (context.type) {
      case 'entry':
        return this.getEntrySuggestions();
      case 'block':
        return this.getBlockSuggestions();
      case 'design-property':
        return this.getDesignPropertySuggestions();
      case 'data-property':
        return this.getDataPropertySuggestions();
      case 'theme-property':
        return this.getThemePropertySuggestions();
      case 'item-property':
        return this.getItemPropertySuggestions();
      case 'value':
        return this.getValueSuggestions(context);
      default:
        return [];
    }
  }

  private getEntrySuggestions(): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    // Add infographic keyword
    const infographicItem = new vscode.CompletionItem('infographic', vscode.CompletionItemKind.Keyword);
    infographicItem.insertText = 'infographic ';
    infographicItem.documentation = new vscode.MarkdownString(
      'Entry keyword for Infographic document\n\n```infographic\ninfographic template-name\n```'
    );
    suggestions.push(infographicItem);

    // Add template suggestions
    for (const template of BUILTIN_TEMPLATES) {
      const item = new vscode.CompletionItem(template.name, vscode.CompletionItemKind.Value);
      item.insertText = `infographic ${template.name}`;
      item.documentation = new vscode.MarkdownString(
        `**${template.name}**

${template.description}

Category: ${template.category}`
      );
      suggestions.push(item);
    }

    return suggestions;
  }

  private getBlockSuggestions(): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    for (const [key, block] of Object.entries(BLOCK_KEYWORDS)) {
      const item = new vscode.CompletionItem(block.keyword, vscode.CompletionItemKind.Keyword);
      item.insertText = block.keyword;
      item.documentation = new vscode.MarkdownString(
        `**${block.keyword}**

${block.description}

\`\`\`infographic
${block.usage}
\`\`\``
      );
      suggestions.push(item);
    }

    return suggestions;
  }

  private getDesignPropertySuggestions(): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    for (const [key, property] of Object.entries(DESIGN_KEYWORDS)) {
      const item = new vscode.CompletionItem(property.keyword, vscode.CompletionItemKind.Property);
      item.insertText = `${property.keyword} `;
      item.documentation = new vscode.MarkdownString(
        `**${property.keyword}**

${property.description}

Expected value type: \`${property.valueType}\``
      );
      suggestions.push(item);
    }

    return suggestions;
  }

  private getDataPropertySuggestions(): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    for (const [key, property] of Object.entries(DATA_KEYWORDS)) {
      const item = new vscode.CompletionItem(property.keyword, vscode.CompletionItemKind.Property);
      item.insertText = `${property.keyword} `;
      item.documentation = new vscode.MarkdownString(
        `**${property.keyword}**

${property.description}

Value type: \`${property.valueType}\``
      );
      suggestions.push(item);
    }

    return suggestions;
  }

  private getThemePropertySuggestions(): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    // Add theme name suggestions
    for (const theme of BUILTIN_THEMES) {
      const item = new vscode.CompletionItem(theme.name, vscode.CompletionItemKind.Value);
      item.insertText = theme.name;
      item.documentation = new vscode.MarkdownString(
        `**${theme.name}**\n\n${theme.description}`
      );
      suggestions.push(item);
    }

    // Add theme property suggestions
    for (const [key, property] of Object.entries(THEME_KEYWORDS)) {
      const item = new vscode.CompletionItem(property.keyword, vscode.CompletionItemKind.Property);
      item.insertText = `${property.keyword} `;
      item.documentation = new vscode.MarkdownString(
        `**${property.keyword}**

${property.description}

Value type: \`${property.valueType}\``
      );
      suggestions.push(item);
    }

    return suggestions;
  }

  private getItemPropertySuggestions(): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    // Add dash for new item
    const dashItem = new vscode.CompletionItem('-', vscode.CompletionItemKind.Snippet);
    dashItem.insertText = '- ';
    dashItem.documentation = new vscode.MarkdownString('Start a new list item');
    suggestions.push(dashItem);

    // Add item properties
    const itemProps = ['label', 'value', 'desc', 'icon', 'illus', 'children'];
    for (const prop of itemProps) {
      const propInfo = DATA_KEYWORDS[prop as keyof typeof DATA_KEYWORDS];
      if (propInfo) {
        const item = new vscode.CompletionItem(propInfo.keyword, vscode.CompletionItemKind.Property);
        item.insertText = `${propInfo.keyword} `;
        item.documentation = new vscode.MarkdownString(
          `**${propInfo.keyword}**

${propInfo.description}

Value type: \`${propInfo.valueType}\``
        );
        suggestions.push(item);
      }
    }

    return suggestions;
  }

  private getValueSuggestions(context: AnalysisContext): vscode.CompletionItem[] {
    const suggestions: vscode.CompletionItem[] = [];

    if (!context.propertyName) {
      return suggestions;
    }

    switch (context.propertyName) {
      case 'structure':
        for (const structure of BUILTIN_STRUCTURES) {
          const item = new vscode.CompletionItem(structure.name, vscode.CompletionItemKind.Value);
          item.insertText = structure.name;
          item.documentation = new vscode.MarkdownString(
            `**${structure.name}**

${structure.description}

Layout type: ${structure.layoutType}`
          );
          suggestions.push(item);
        }
        break;

      case 'item':
        for (const design of BUILTIN_ITEM_DESIGNS) {
          const item = new vscode.CompletionItem(design.name, vscode.CompletionItemKind.Value);
          item.insertText = design.name;
          item.documentation = new vscode.MarkdownString(
            `**${design.name}**\n\n${design.description}`
          );
          suggestions.push(item);
        }
        break;

      case 'title':
        for (const design of BUILTIN_TITLE_DESIGNS) {
          const item = new vscode.CompletionItem(design.name, vscode.CompletionItemKind.Value);
          item.insertText = design.name;
          item.documentation = new vscode.MarkdownString(
            `**${design.name}**\n\n${design.description}`
          );
          suggestions.push(item);
        }
        break;

      case 'showIcon':
        for (const bool of BOOLEAN_VALUES) {
          const item = new vscode.CompletionItem(bool, vscode.CompletionItemKind.Enum);
          item.insertText = bool;
          suggestions.push(item);
        }
        break;

      case 'align':
      case 'align-horizontal':
        for (const align of ALIGNMENT_VALUES) {
          const item = new vscode.CompletionItem(align, vscode.CompletionItemKind.Enum);
          item.insertText = align;
          suggestions.push(item);
        }
        break;

      case 'stylize':
        for (const style of STYLIZE_VALUES) {
          const item = new vscode.CompletionItem(style, vscode.CompletionItemKind.Enum);
          item.insertText = style;
          item.documentation = new vscode.MarkdownString(`Stylization effect: **${style}**`);
          suggestions.push(item);
        }
        break;

      case 'icon':
        // Add icon reference examples
        const iconExamples = [
          { label: 'Data URI SVG', insertText: 'data:image/svg+xml,<svg>...</svg>', description: 'Inline SVG using data URI' },
          { label: 'Remote URL', insertText: 'ref:remote:svg:https://example.com/icon.svg', description: 'Remote SVG resource' },
          { label: 'Icon Search', insertText: 'ref:search:computer network', description: 'Search AntV icon library' }
        ];
        for (const example of iconExamples) {
          const item = new vscode.CompletionItem(example.label, vscode.CompletionItemKind.Snippet);
          item.insertText = example.insertText;
          item.documentation = new vscode.MarkdownString(example.description);
          suggestions.push(item);
        }
        break;

      case 'colorBg':
      case 'colorPrimary':
        // Add color example
        const colorItem = new vscode.CompletionItem('#FFFFFF', vscode.CompletionItemKind.Color);
        colorItem.insertText = '#';
        colorItem.documentation = new vscode.MarkdownString('Hex color code (e.g., #FF5A5F, #1FB6FF)');
        suggestions.push(colorItem);
        break;
    }

    return suggestions;
  }
}

/**
 * Register completion provider
 */
export function registerCompletionProvider(context: vscode.ExtensionContext): void {
  const provider = new InfographicCompletionProvider();

  const disposable = vscode.languages.registerCompletionItemProvider(
    [
      { scheme: 'file', language: 'infographic' },
      { scheme: 'untitled', language: 'infographic' },
      { scheme: 'file', language: 'markdown' },
      { scheme: 'untitled', language: 'markdown' }
    ],
    provider,
    ' ', // Trigger on space
    '-'  // Trigger on dash for list items
  );

  context.subscriptions.push(disposable);
}
