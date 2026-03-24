# AI Chat Context Sidebar

一个面向 Chrome / Edge 的浏览器扩展，用于在常见 AI 聊天页面右侧生成“用户提问导航侧栏”，帮助你在长会话中快速定位历史提问。

## Overview

AI Chat Context Sidebar 会在 AI 聊天网页右侧注入一个独立侧栏，自动读取当前聊天中由用户发起的提问内容，并按顺序生成可点击的导航条目。

这个项目适合以下场景：

- 长对话中快速回看历史提问
- 多轮提问中定位某一段上下文
- 提升 AI 聊天界面的浏览效率

## Highlights

- 只提取用户提问，不展示 AI 回答
- 侧栏预览限制为 15 个字，超出使用省略号
- 点击侧栏条目可直接定位到对应提问
- 侧栏支持独立滚动，不影响聊天页面本身滚动
- 支持展开 / 折叠
- 支持在浏览器可视区域内上下拖动侧栏
- 支持拖拽侧栏上下边框调整高度
- 支持手动选择聊天区域作为自动识别兜底方案
- 仅在已支持的 AI 站点中注入，不会污染普通网站

## Supported Sites

- ChatGPT
- Gemini
- 豆包
- Claude
- Kimi
- DeepSeek
- 腾讯元宝
- 通义千问

## Quick Start

### Load in Chrome / Edge

1. 打开 Chrome：`chrome://extensions/`
2. 或打开 Edge：`edge://extensions/`
3. 开启“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择项目目录：

```text
D:\DevelopmentSpace\IdeaJavaWorkSpace\插件开发\ai-context
```

### Use the Sidebar

1. 打开任意已支持的 AI 聊天页面
2. 进入具体聊天会话
3. 侧栏会自动出现在页面右侧
4. 点击提问条目，跳转到对应聊天位置
5. 如果自动识别失败，点击“选择聊天框”手动指定

### Long Conversation Tip

长会话场景下，请先向上滚动聊天区，让历史提问节点先加载到页面中，再由插件读取。

## Features

### Sidebar Navigation

- 按用户提问顺序展示导航
- 鼠标悬停在侧栏上滚轮可上下浏览条目
- 点击条目后定位对应提问内容

### Sidebar Interaction

- 顶部 `开 / 关` 按钮控制侧栏展开与折叠
- 长按侧栏非按钮区域可上下拖动位置
- 拖动上下边框可调整侧栏高度

### Adaptation Strategy

- 优先使用站点专属规则识别用户提问
- 识别失败时回退到站点定制筛选逻辑
- 支持手动选择聊天容器

## Installation Package

项目中已包含打包产物：

- `ai-context.zip`

可用于提交 Chrome Web Store 或 Microsoft Edge Add-ons。

## Project Structure

```text
ai-context/
├─ icons/                # 扩展图标
├─ content.js            # DOM 识别、侧栏渲染、站点适配、交互逻辑
├─ content.css           # 侧栏样式
├─ manifest.json         # 扩展清单
├─ README.md             # 仓库首页说明
├─ DEVELOPMENT.md        # 开发文档
├─ CONTRIBUTING.md       # 贡献指南
├─ PRIVACY.md            # 隐私说明
├─ STORE_LISTING.md      # 商店上架文案
├─ PACKAGE.md            # 打包说明
└─ ai-context.zip        # 已打包上传文件
```

## Documentation

- [Development Guide](./DEVELOPMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Privacy Policy](./PRIVACY.md)
- [Store Listing Draft](./STORE_LISTING.md)
- [Packaging Notes](./PACKAGE.md)

## Release Notes

### v1.1.0

- 限制扩展只在已支持 AI 聊天站点中注入
- 新增通义千问适配
- 优化 Gemini、豆包、元宝的提问识别逻辑
- 修复侧栏悬停滚轮无法滚动内容的问题
- 支持侧栏上下拖动
- 支持侧栏上下边框拉伸高度

## Privacy

扩展只在当前页面本地读取用户提问文本，用于生成导航侧栏。

- 不上传聊天内容到开发者服务器
- 不向第三方接口传输聊天内容
- 不收集账号密码、支付信息或广告标识

完整说明见 [PRIVACY.md](./PRIVACY.md)。

## License

本项目采用 [MIT License](./LICENSE)。
