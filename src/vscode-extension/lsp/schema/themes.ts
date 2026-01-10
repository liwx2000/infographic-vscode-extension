/**
 * Built-in Infographic themes
 */

export interface Theme {
  name: string;
  description: string;
}

export const BUILTIN_THEMES: Theme[] = [
  {
    name: 'default',
    description: 'Default theme with standard colors'
  },
  {
    name: 'dark',
    description: 'Dark theme with dark background'
  },
  {
    name: 'light',
    description: 'Light theme with bright background'
  }
];

export const BUILTIN_ITEM_DESIGNS = [
  {
    name: 'simple',
    description: 'Simple text-based item design'
  },
  {
    name: 'simple-horizontal-arrow',
    description: 'Simple design with horizontal arrow'
  },
  {
    name: 'circle-node',
    description: 'Circular node design for hierarchical items'
  },
  {
    name: 'pill-badge',
    description: 'Pill-shaped badge design'
  }
];

export const BUILTIN_TITLE_DESIGNS = [
  {
    name: 'default',
    description: 'Default title design with text and description'
  }
];
