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
infographic hierarchy-tree-bt-curved-line-badge-card
data
  title 用户调研
  desc 通过用户调研，了解用户需求和痛点，指导产品设计和优化
  items
    - label 用户调研
      value 100
      icon mingcute/user-question-line
      children
        - label 用户为什么要使用某个音乐平台
          value 80
          icon mingcute/music-2-ai-line
          children
            - label 用户从哪些渠道了解到这个平台
              value 70
              icon mingcute/ad-circle-line
            - label 这个平台是哪些方面吸引了用户
              value 65
              icon mingcute/mushroom-line
        - label 用户在什么场景下使用这个平台
          value 75
          icon mingcute/time-line
          children
            - label 用户从什么事件什么场景下使用
              value 60
              icon mingcute/calendar-time-add-line
            - label 用户在某个场景下用到哪些功能
              value 55
              icon mingcute/danmaku-line
```

### Block 3

```infographic
infographic sequence-zigzag-pucks-3d-underline-text
data
  items
    - label 步骤 1
      desc 开始
      icon mdi/lightbulb-on
    - label 步骤 2
      desc 规划
      icon mdi/clipboard-text-outline
    - label 步骤 3
      desc 执行
      icon mdi/rocket-launch-outline
    - label 步骤 4
      desc 检查
      icon mdi/checklist
    - label 步骤 5
      desc 完成
      icon mdi/check-circle
```

## Error Handling Test

This should show an error message:

```infographic
invalid syntax here
this is not valid
```
