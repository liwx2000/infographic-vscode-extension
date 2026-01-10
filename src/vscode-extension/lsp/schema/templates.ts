/**
 * Built-in Infographic templates
 */

export interface Template {
  name: string;
  description: string;
  category: string;
}

export const BUILTIN_TEMPLATES: Template[] = [
  {
    name: 'list-row-horizontal-icon-arrow',
    description: 'Horizontal list layout with icons and arrows',
    category: 'list'
  },
  {
    name: 'list-row',
    description: 'Basic row-based list layout',
    category: 'list'
  },
  {
    name: 'list-grid',
    description: 'Grid-based list layout',
    category: 'list'
  },
  {
    name: 'list-pyramid',
    description: 'Pyramid-shaped list layout',
    category: 'list'
  }
];
