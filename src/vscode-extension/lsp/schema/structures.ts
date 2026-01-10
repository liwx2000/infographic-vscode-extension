/**
 * Built-in Infographic structures
 */

export interface Structure {
  name: string;
  description: string;
  layoutType: string;
}

export const BUILTIN_STRUCTURES: Structure[] = [
  {
    name: 'list-row',
    description: 'Horizontal row-based layout',
    layoutType: 'list'
  },
  {
    name: 'list-grid',
    description: 'Grid-based layout for multiple items',
    layoutType: 'list'
  },
  {
    name: 'list-pyramid',
    description: 'Pyramid-shaped hierarchical layout',
    layoutType: 'list'
  },
  {
    name: 'list-column',
    description: 'Vertical column-based layout',
    layoutType: 'list'
  }
];
