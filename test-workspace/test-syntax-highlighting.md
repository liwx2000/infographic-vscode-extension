# Test Syntax Highlighting and Completion

This markdown file tests the Infographic syntax highlighting in code blocks.

## Test 1: Basic Syntax

```infographic
infographic list-row
data
  title Product Features
  desc Our amazing features
  items
    - label Fast
      value 10
      desc Lightning-fast performance
    - label Reliable
      value 9.5
      desc Rock-solid reliability

design
  structure list-grid
  item simple
  gap 12

theme
  colorPrimary #1FB6FF
  colorBg #F5F5F5
```

## Test 2: Hierarchical Data

```infographic
infographic
data
  title Organization Structure
  desc Product Growth Team
  items
    - label Product Growth
      icon ref:search:company
      children
        - label Growth Strategy
          desc Metrics and experiment design
          icon ref:search:antenna
        - label User Operations
          desc Lifecycle operations
          icon ref:search:activities
```

## Test 3: Theme Customization

```infographic
infographic list-pyramid
data
  title Priority Levels
  items
    - label Critical
      value 3
    - label High
      value 5
    - label Medium
      value 8

theme
  colorBg #0b1220
  colorPrimary #ff5a5f
  palette #ff5a5f #1fb6ff #13ce66
  stylize rough
  roughness 0.3
```
