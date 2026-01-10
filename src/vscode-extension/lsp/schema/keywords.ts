/**
 * Infographic syntax keywords organized by category
 */

export const ENTRY_KEYWORDS = {
  infographic: {
    keyword: 'infographic',
    description: 'Entry keyword for Infographic document',
    usage: 'infographic [template-name]'
  }
};

export const BLOCK_KEYWORDS = {
  design: {
    keyword: 'design',
    description: 'Design block for visual structure and styling',
    usage: 'design\n  structure [structure-name]\n  item [item-name]'
  },
  data: {
    keyword: 'data',
    description: 'Data block for content and information',
    usage: 'data\n  title [text]\n  desc [text]\n  items\n    - label [text]'
  },
  theme: {
    keyword: 'theme',
    description: 'Theme block for colors and visual style',
    usage: 'theme [theme-name]\n# or\ntheme\n  colorBg #color\n  colorPrimary #color'
  }
};

export const DESIGN_KEYWORDS = {
  structure: {
    keyword: 'structure',
    description: 'Layout structure for organizing visual elements',
    valueType: 'structure-name'
  },
  gap: {
    keyword: 'gap',
    description: 'Spacing between elements in pixels',
    valueType: 'number'
  },
  item: {
    keyword: 'item',
    description: 'Single data item design component',
    valueType: 'item-name'
  },
  items: {
    keyword: 'items',
    description: 'Array of data item designs for hierarchical levels',
    valueType: 'array'
  },
  title: {
    keyword: 'title',
    description: 'Title design component',
    valueType: 'title-name'
  },
  showIcon: {
    keyword: 'showIcon',
    description: 'Toggle icon visibility in items',
    valueType: 'boolean'
  },
  align: {
    keyword: 'align',
    description: 'Text alignment for title',
    valueType: 'alignment'
  },
  'align-horizontal': {
    keyword: 'align-horizontal',
    description: 'Horizontal alignment for elements',
    valueType: 'alignment'
  },
  'desc-line-number': {
    keyword: 'desc-line-number',
    description: 'Maximum number of lines for description text',
    valueType: 'number'
  }
};

export const DATA_KEYWORDS = {
  title: {
    keyword: 'title',
    description: 'Title text for the infographic',
    valueType: 'string'
  },
  desc: {
    keyword: 'desc',
    description: 'Description text providing context',
    valueType: 'string'
  },
  items: {
    keyword: 'items',
    description: 'List of data items',
    valueType: 'array'
  },
  label: {
    keyword: 'label',
    description: 'Label text for a data item',
    valueType: 'string'
  },
  value: {
    keyword: 'value',
    description: 'Numeric value for a data item',
    valueType: 'number'
  },
  icon: {
    keyword: 'icon',
    description: 'Icon reference (data URI, remote URL, or search keyword)',
    valueType: 'string'
  },
  illus: {
    keyword: 'illus',
    description: 'Illustration reference (data URI or remote URL)',
    valueType: 'string'
  },
  children: {
    keyword: 'children',
    description: 'Nested child items for hierarchical data',
    valueType: 'array'
  }
};

export const THEME_KEYWORDS = {
  colorBg: {
    keyword: 'colorBg',
    description: 'Background color in hex format',
    valueType: 'color'
  },
  colorPrimary: {
    keyword: 'colorPrimary',
    description: 'Primary color for decorative elements',
    valueType: 'color'
  },
  palette: {
    keyword: 'palette',
    description: 'Color palette array for data items',
    valueType: 'array'
  },
  stylize: {
    keyword: 'stylize',
    description: 'Visual stylization effect type',
    valueType: 'string'
  },
  roughness: {
    keyword: 'roughness',
    description: 'Roughness level for hand-drawn style (0-1)',
    valueType: 'number'
  }
};

export const ALIGNMENT_VALUES = ['left', 'center', 'right'];
export const BOOLEAN_VALUES = ['true', 'false'];
export const STYLIZE_VALUES = ['rough', 'pattern', 'linear-gradient', 'radial-gradient'];
