# Changelog

All notable changes to the "AntV Infographic Preview" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
