# AntV Infographic Test

This document tests the AntV Infographic VSCode extension.

## Example 1: Simple List with Horizontal Arrow

```infographic
infographic list-row-simple-horizontal-arrow
data
  items
    - label Step 1
      desc Start
    - label Step 2
      desc In Progress
    - label Step 3
      desc Complete
```

## Example 2: List with Icons and Values

```infographic
infographic list-row-horizontal-icon-arrow
data
  title Customer Growth Engine
  desc Multi-channel customer acquisition
  items
    - label Lead Generation
      value 18.6
      desc Content marketing and outreach
      icon company-021_v1_lineal
    - label Conversion
      value 12.4
      desc Lead scoring and automation
      icon antenna-bars-5_v1_lineal
    - label Retention
      value 32.1
      desc Customer success programs
      icon activities-037_v1_lineal
```

## Example 3: Empty Block (Should show placeholder)

```infographic
```

## Regular Code Block (Should not be transformed)

```javascript
console.log('This should remain a code block');
```
