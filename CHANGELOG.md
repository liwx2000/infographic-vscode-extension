# Changelog

All notable changes to the "AntV Infographic Preview" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-01-10

### Added
- **Export Functionality**
  - SVG/PNG export button in preview panel toolbar

### Improved
- Add default background color in preview

### Changed
- **Dependency Updates**
  - Upgraded @antv/infographic from 0.1.4 to 0.2.7

### Removed
- **Theme Configuration**
  - Removed theme configuration support

## [1.2.1] - 2026-01-04

### Changed
- **Improved Infographic Document Workflow**
  - New `.infographic` files now open in standard text editor with side-by-side preview panel
  - Changed from full custom editor to split editor/preview layout for better editing experience
  - Preview panel automatically syncs with editor content changes
  - Fixed language association configuration key in package.json (`language` instead of `languageId`)

### Refactored
- **Webview Architecture Simplification**
  - Removed unused `webviewContent.ts` file (399 lines removed)
  - Simplified error handling by removing diagnostic collection parameters
  - Cleaned up save handler logic and removed unnecessary conditions
  - Streamlined editor template by removing unused variables and state
  - Improved code maintainability by consolidating error display logic

### Added
- **New Preview Panel System**
  - `InfographicPreviewPanel`: Singleton panel for displaying live preview beside editor
  - `PreviewTemplate`: Dedicated HTML template for preview rendering
  - Automatic document registration in TempFileCache for sync management
  - Bi-directional synchronization between text editor and preview panel

### Fixed
- Documentation: Updated image URLs in README to point to master branch

## [1.2.0] - 2026-01-03

### Added
- **Custom Editor for Standalone .infographic Files**
  - Support for creating and editing standalone `.infographic` files
  - Split-view editor with text editor on the left and live preview on the right
  - Automatic live preview updates as users type
  - Files with `.infographic` extension automatically open in the custom editor
- **Interactive Code Block Editor**
  - Code lens provider that adds "Edit Infographic" button to markdown infographic code blocks
  - Clicking the edit button opens a dedicated editor for the code block
  - Split-view interface with text editor and live preview
  - Apply and Revert buttons for saving or discarding changes
  - Changes sync back to the original markdown file
- **Visual Gutter Decorations**
  - Logo icon displayed in the editor gutter next to infographic code block identifiers
  - Helps visually identify infographic blocks in markdown files
  - Uses the extension's `logo.svg` for consistent branding
- **Language Support**
  - New "infographic" language identifier registration
  - Syntax support for `.infographic` file extension
  - Enables language-specific features for infographic files

### Technical Details
- **New Extension Components**
  - `InfographicEditorProvider`: Custom text editor provider implementing `vscode.CustomTextEditorProvider`
  - `InfographicCodeLensProvider`: Provides edit buttons via VS Code's code lens API
  - `InfographicGutterDecorationProvider`: Manages gutter icon decorations for infographic blocks
  - `TempFileCache`: Persistent cache for temporary file URI tracking
  - `SaveHandler`: Handles save operations and synchronization logic
  - `SyncService`: Coordinates bi-directional sync between buffers and markdown sources
  - `MessageHandler`: Centralized message type definitions and handling logic
- **Extension Contributions**
  - Registered `customEditors` contribution for "infographicMarkdown.editor" view type
  - Registered "infographicMarkdown.editBlock" command
  - Added language definition for "infographic" language ID
  - File extension association for `.infographic` files
- **Webview Integration**
  - Editor template system for custom editor HTML generation
  - Real-time configuration synchronization with VS Code settings
  - Theme-aware rendering that respects VS Code color theme changes

### Improved
- **User Experience**
  - More intuitive workflow for editing infographic content
  - Visual indicators for infographic code blocks in markdown
  - Seamless integration between markdown editing and visual preview
- **Development Workflow**
  - Ability to work with infographic content as standalone files
  - Direct editing without switching between preview and source
  - Faster iteration with live preview feedback

## [1.1.0] - 2024-12-27

### Added
- VSCode extension settings for customizable rendering options
  - `infographicMarkdown.theme`: Control color theme (auto/light/dark)
  - `infographicMarkdown.width`: Set infographic container width
  - `infographicMarkdown.height`: Set infographic container height
  - `infographicMarkdown.padding`: Configure container padding
- Automatic theme detection that follows VSCode's current theme
- Settings integration with AntV Infographic library's InfographicOptions
- Live settings updates in preview without requiring reload

### Changed
- Improved README documentation with:
  - Centered logo display at the top
  - VSCode Marketplace installation instructions
  - Direct reference to official AntV Infographic syntax guide
  - Enhanced configuration section with detailed settings documentation
- Simplified syntax reference section to reduce documentation redundancy

### Improved
- Conditional rendering logic to skip empty infographic blocks
- Better user experience with real-time settings synchronization
- More comprehensive configuration documentation

### Removed
- Redundant changelog section from README (moved to CHANGELOG.md)
- Lengthy syntax examples from README (referenced official documentation instead)

## [1.0.0] - 2024-12-26

### Added
- Initial release of AntV Infographic Preview extension
- Markdown preview rendering for `infographic` code blocks
- Support for AntV Infographic syntax
- Bundled @antv/infographic library (no CDN dependencies)
- Automatic theme support (light, dark, high contrast)
- Live preview updates with intelligent caching
- Error handling with user-friendly messages
- CSP-compliant implementation for VSCode strict mode
- Comprehensive documentation and examples

### Features
- **Markdown Integration**: Seamlessly render infographics in Markdown preview
- **Offline Support**: All dependencies bundled within extension package
- **Performance Optimized**: Smart caching and incremental updates
- **Theme Aware**: Automatically adapts to VSCode theme
- **Developer Friendly**: Clear error messages and syntax validation
- **Secure**: Fully compliant with Content Security Policy

### Technical Details
- Webpack bundled for optimized distribution
- Custom markdown-it plugin for syntax transformation
- Browser-compatible text measurement stub for measury package
- MutationObserver-based update detection
- Efficient instance lifecycle management

## [Unreleased]

### Planned Features
- Syntax highlighting and autocomplete support
- Template browser and discovery
- Custom theme editor
- Export infographic as image
- Interactive editing capabilities
