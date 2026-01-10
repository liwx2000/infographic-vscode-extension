import * as vscode from 'vscode';

/**
 * Parses Infographic syntax structure
 */

export interface BlockInfo {
  type: 'design' | 'data' | 'theme';
  startLine: number;
  endLine: number;
}

/**
 * Extracts all blocks from document
 */
export function parseBlocks(document: vscode.TextDocument): BlockInfo[] {
  const blocks: BlockInfo[] = [];
  let currentBlock: BlockInfo | null = null;

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;
    const trimmed = line.trim();

    // Check for block keywords
    if (trimmed === 'design' || trimmed === 'data' || trimmed === 'theme') {
      // Save previous block if exists
      if (currentBlock) {
        currentBlock.endLine = i - 1;
        blocks.push(currentBlock);
      }

      // Start new block
      currentBlock = {
        type: trimmed as 'design' | 'data' | 'theme',
        startLine: i,
        endLine: i
      };
    }
  }

  // Save last block
  if (currentBlock) {
    currentBlock.endLine = document.lineCount - 1;
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Checks if document has valid entry line
 */
export function hasValidEntry(document: vscode.TextDocument): boolean {
  for (let i = 0; i < Math.min(5, document.lineCount); i++) {
    const line = document.lineAt(i).text.trim();
    if (line.startsWith('infographic')) {
      return true;
    }
  }
  return false;
}

/**
 * Extracts template name from entry line
 */
export function getTemplateName(document: vscode.TextDocument): string | null {
  for (let i = 0; i < Math.min(5, document.lineCount); i++) {
    const line = document.lineAt(i).text.trim();
    const match = line.match(/^infographic\s+([a-zA-Z0-9_-]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}
