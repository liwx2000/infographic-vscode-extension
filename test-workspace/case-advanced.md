# Advanced Infographic Test

This file tests more complex infographic features.

## Multiple Blocks

Test multiple infographic blocks rendering independently.

### Block 1

```infographic
infographic list-row-simple-horizontal-arrow
data
  items
    - label Research
      desc Market analysis
    - label Strategy
      desc Planning phase
    - label Execution
      desc Implementation
```

### Block 2

```infographic
infographic timeline-vertical-simple
data
  items
    - label Phase 1
      desc Foundation
    - label Phase 2
      desc Growth
    - label Phase 3
      desc Scale
```

### Block 3

```infographic
infographic list-row-simple-horizontal-arrow
data
  items
    - label Input
      desc Data collection
    - label Process
      desc Analysis
    - label Output
      desc Results
```

## Error Handling Test

This should show an error message:

```infographic
invalid syntax here
this is not valid
```
