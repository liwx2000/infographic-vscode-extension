<div align="center">
  <img src="https://raw.githubusercontent.com/liwx2000/infographic-vscode-extension/refs/heads/master/infographic.png" alt="AntV Infographic Logo" width="200"/>
</div>

# AntV Infographic Preview for VSCode

A Visual Studio Code extension that renders [AntV Infographic](https://infographic.antv.vision) visualizations directly in your Markdown preview.

## Features

- 📊 **Live Preview**: See your infographics render in real-time as you edit
- 🎨 **Theme Support**: Automatically adapts to VSCode's light and dark themes
- ⚙️ **Customizable**: Configure rendering options via VSCode settings
- 📦 **Offline Ready**: All dependencies bundled - no CDN or internet required
- 🔒 **Secure**: Fully compliant with VSCode's strict Content Security Policy
- ⚡ **Fast**: Optimized rendering with smart caching and updates

## Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions view (Cmd+Shift+X / Ctrl+Shift+X)
3. Search for "Infographic Markdown Preview"
4. Click "Install"

### From VSIX File

1. Download the `.vsix` file from the releases page
2. Open VSCode
3. Go to Extensions view (Cmd+Shift+X / Ctrl+Shift+X)
4. Click the "..." menu at the top right
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

### From Source

```bash
git clone <repository-url>
cd infographic-vscode-extension
npm install
npm run build
npm run package
```

Then install the generated `.vsix` file using the steps above.

## Usage

Create infographic visualizations in your Markdown files using code blocks with the `infographic` language identifier.

### Quick Example

````markdown
```infographic
infographic list-row-simple-horizontal-arrow
data
  items
    - label Step 1
      desc Initialize
    - label Step 2
      desc Process
    - label Step 3
      desc Complete
```
````

### Syntax Reference

For complete infographic syntax documentation, including:

- Available templates and layouts
- Data structure and properties
- Design customization options
- Theme configuration
- Icons and styling

Please visit the official documentation: **[AntV Infographic Syntax Guide](https://infographic.antv.vision/learn/infographic-syntax)**

## Configuration

This extension provides several settings to customize the infographic rendering behavior.

### How to Configure

1. Open VSCode Settings: `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. Search for "infographic" in the settings search bar
3. Adjust the settings according to your preferences

Alternatively, you can edit your `settings.json` file directly by pressing `Cmd+Shift+P` / `Ctrl+Shift+P` and selecting "Preferences: Open Settings (JSON)".

### Available Settings

#### `infographicMarkdown.theme`

**Type:** `string` (enum: `auto`, `light`, `dark`)  
**Default:** `auto`

Controls the color theme for rendered infographics:

- `auto` - Automatically follows VSCode's current color theme (default)
- `light` - Always use light theme regardless of VSCode theme
- `dark` - Always use dark theme regardless of VSCode theme

**Example:**

```json
{
  "infographicMarkdown.theme": "auto"
}
```

#### `infographicMarkdown.width`

**Type:** `string`  
**Default:** `"100%"`  
**Pattern:** Must be a number followed by `px` or `%`

Sets the width of rendered infographic containers:

- Percentage values: `"100%"`, `"80%"`, `"50%"` (relative to container)
- Absolute values: `"500px"`, `"800px"`, `"1200px"`

**Example:**

```json
{
  "infographicMarkdown.width": "800px"
}
```

#### `infographicMarkdown.height`

**Type:** `string`  
**Default:** `"100%"`  
**Pattern:** Must be a number followed by `px` or `%`

Sets the height of rendered infographic containers:

- Percentage values: `"100%"`, `"80%"` (relative to container)
- Absolute values: `"400px"`, `"600px"`, `"800px"`

**Example:**

```json
{
  "infographicMarkdown.height": "600px"
}
```

#### `infographicMarkdown.padding`

**Type:** `number` or `array of numbers`  
**Default:** `0`

Defines the padding inside the infographic container:

- Single number: Uniform padding on all sides (e.g., `16`)
- Array of 4 numbers: Padding for [top, right, bottom, left] (e.g., `[10, 20, 10, 20]`)

**Examples:**

```json
// Uniform padding
{
  "infographicMarkdown.padding": 16
}

// Individual sides
{
  "infographicMarkdown.padding": [10, 20, 10, 20]
}
```

### Settings Example Configuration

Here's a complete example configuration in your VSCode `settings.json`:

```json
{
  "infographicMarkdown.theme": "auto",
  "infographicMarkdown.width": "100%",
  "infographicMarkdown.height": "600px",
  "infographicMarkdown.padding": 16
}
```

## Error Handling

The extension provides helpful error messages when:

- Syntax is invalid or incomplete
- Template names are not recognized
- Required data is missing

Errors are displayed directly in the preview pane with details about what went wrong.

## Theme Support

The extension automatically adapts to your VSCode theme:

- **Light themes**: Clean, bright appearance
- **Dark themes**: Comfortable dark mode rendering
- **High contrast**: Enhanced borders and visibility

You can override the automatic theme detection using the `infographicMarkdown.theme` setting. See [Extension Settings](#extension-settings) for details.

## Performance

- **Smart Caching**: Infographics are only re-rendered when syntax changes
- **Efficient Updates**: Live preview updates use debouncing to prevent excessive rendering
- **Memory Management**: Automatic cleanup of removed infographics

## Troubleshooting

### Infographic Not Rendering

1. Check that the code block language is set to `infographic`
2. Verify your syntax follows the AntV Infographic format
3. Look for error messages in the preview pane
4. Try closing and reopening the Markdown preview

### Preview Not Updating

1. Make sure the Markdown preview is open
2. Try refreshing the preview (close and reopen)
3. Check VSCode's output panel for extension errors

### CSP Errors

This extension is fully CSP-compliant. If you see CSP errors:

1. Ensure you're using the latest version of the extension
2. Check that no other extensions are interfering
3. Report the issue on GitHub with reproduction steps

## Technical Details

### Architecture

- **Markdown-it Plugin**: Transforms infographic code blocks into placeholder containers
- **Preview Script**: Initializes and renders infographic instances in the webview
- **Bundled Library**: Includes @antv/infographic library for offline functionality

### Security

- No external CDN dependencies
- No dynamic script execution
- Fully compliant with VSCode's strict CSP
- All resources bundled within extension package

### Dependencies

- [@antv/infographic](https://github.com/antvis/infographic) - The core rendering library
- Webpack bundled for browser compatibility

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build for development (with watch mode)
npm run watch

# Build for production
npm run build

# Package as VSIX
npm run package
```

### Testing Locally

1. Open the project in VSCode
2. Press F5 to launch Extension Development Host
3. Open or create a Markdown file
4. Add infographic code blocks
5. Open the Markdown preview

### Project Structure

```
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── config.ts             # Configuration management
│   ├── markdown-it-plugin.ts # Markdown-it plugin
│   ├── preview.ts            # Preview script
│   └── measury-stub.js       # Browser-compatible text measurement
├── media/
│   └── infographic.css       # Preview styles
├── dist/                     # Compiled output
├── package.json              # Extension manifest
└── webpack.config.js         # Build configuration
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Resources

- [AntV Infographic Documentation](https://infographic.antv.vision)
- [AntV Infographic Syntax Guide](https://infographic.antv.vision/learn/infographic-syntax)
- [VSCode Extension API](https://code.visualstudio.com/api)

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/your-repo/issues) on GitHub.
