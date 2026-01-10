import * as vscode from 'vscode';

export type ContextType = 
  | 'entry' 
  | 'block' 
  | 'design-property' 
  | 'data-property' 
  | 'theme-property' 
  | 'item-property'
  | 'value'
  | 'unknown';

export interface AnalysisContext {
  type: ContextType;
  blockType?: 'design' | 'data' | 'theme';
  propertyName?: string;
  indentLevel: number;
  lineText: string;
  isInItems?: boolean;
}

/**
 * Analyzes document context at cursor position to determine completion suggestions
 */
export function analyzeContext(
  document: vscode.TextDocument,
  position: vscode.Position
): AnalysisContext {
  const lineText = document.lineAt(position.line).text;
  const textBeforeCursor = lineText.substring(0, position.character);
  const indentLevel = getIndentLevel(lineText);

  // Check if we're at document start or entry line
  if (position.line === 0 || isEntryContext(document, position)) {
    return {
      type: 'entry',
      indentLevel,
      lineText
    };
  }

  // Find current block
  const currentBlock = findCurrentBlock(document, position);

  // Check if we're expecting a block keyword
  if (!currentBlock || currentBlock === 'none') {
    return {
      type: 'block',
      indentLevel,
      lineText
    };
  }

  // Check if we're in items list
  const isInItems = isWithinItemsList(document, position);

  // Check if cursor is after a property keyword (value context)
  const propertyMatch = textBeforeCursor.match(/\s+(structure|gap|item|items|title|desc|label|value|icon|illus|children|colorBg|colorPrimary|palette|stylize|roughness|showIcon|align|align-horizontal|desc-line-number)\s+(.*)$/);
  if (propertyMatch) {
    return {
      type: 'value',
      blockType: currentBlock,
      propertyName: propertyMatch[1],
      indentLevel,
      lineText,
      isInItems
    };
  }

  // Determine property context based on block type and indentation
  if (currentBlock === 'design') {
    return {
      type: 'design-property',
      blockType: 'design',
      indentLevel,
      lineText
    };
  } else if (currentBlock === 'data') {
    if (isInItems) {
      return {
        type: 'item-property',
        blockType: 'data',
        indentLevel,
        lineText,
        isInItems: true
      };
    }
    return {
      type: 'data-property',
      blockType: 'data',
      indentLevel,
      lineText
    };
  } else if (currentBlock === 'theme') {
    return {
      type: 'theme-property',
      blockType: 'theme',
      indentLevel,
      lineText
    };
  }

  return {
    type: 'unknown',
    indentLevel,
    lineText
  };
}

/**
 * Determines indentation level of a line
 */
function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1];
  // Count tabs as 4 spaces
  const totalSpaces = spaces.replace(/\t/g, '    ').length;
  return Math.floor(totalSpaces / 2); // 2 spaces per level
}

/**
 * Checks if current position is in entry context
 */
function isEntryContext(document: vscode.TextDocument, position: vscode.Position): boolean {
  const lineText = document.lineAt(position.line).text;
  
  // Check if current line starts with 'infographic' or is empty/whitespace before first content
  if (lineText.trim().startsWith('infographic') || lineText.trim() === '') {
    // Check if there's no block keyword before this line
    for (let i = 0; i < position.line; i++) {
      const prevLine = document.lineAt(i).text.trim();
      if (prevLine.match(/^(design|data|theme)\s*$/)) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

/**
 * Finds the current block type by scanning backwards from cursor
 */
function findCurrentBlock(
  document: vscode.TextDocument,
  position: vscode.Position
): 'design' | 'data' | 'theme' | 'none' {
  // Scan backwards to find block keyword
  for (let i = position.line; i >= 0; i--) {
    const line = document.lineAt(i).text;
    const trimmed = line.trim();
    
    // Check for block keywords at start of line
    if (trimmed === 'design') return 'design';
    if (trimmed === 'data') return 'data';
    if (trimmed === 'theme') return 'theme';
    
    // If we hit infographic keyword or another block at same/lower indent, stop
    if (trimmed.startsWith('infographic') && i < position.line) {
      return 'none';
    }
  }
  
  return 'none';
}

/**
 * Checks if current position is within an items list
 */
function isWithinItemsList(document: vscode.TextDocument, position: vscode.Position): boolean {
  const currentIndent = getIndentLevel(document.lineAt(position.line).text);
  
  // Scan backwards to find 'items' keyword
  for (let i = position.line; i >= 0; i--) {
    const line = document.lineAt(i).text;
    const lineIndent = getIndentLevel(line);
    const trimmed = line.trim();
    
    // If we find 'items' keyword at a lower indent level
    if (trimmed.startsWith('items') && lineIndent < currentIndent) {
      return true;
    }
    
    // If we hit a block keyword, stop
    if (trimmed.match(/^(design|data|theme)\s*$/) && lineIndent === 0) {
      return false;
    }
  }
  
  return false;
}
