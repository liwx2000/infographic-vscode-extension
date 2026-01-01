# Theme Test

This file tests theme switching and configuration.

## Light Theme Test

This should render with light theme colors.

```infographic
infographic list-row-simple-horizontal-arrow
data
  items
    - label Design
      desc Create mockups
    - label Develop
      desc Write code
    - label Deploy
      desc Ship product
```

## Dark Theme Test

Switch your VSCode theme to dark mode to see this render with dark colors.

```infographic
infographic list-row-simple-horizontal-arrow
theme dark
  colorPrimary #61DDAA
  colorBg #1F1F1F
  palette
    - #61DDAA
    - #F6BD16
    - #F08BB4
data
  items
    - label Design
      desc Create mockups
    - label Develop
      desc Write code
    - label Deploy
      desc Ship product
```
