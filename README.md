# AI Chat Context Sidebar

一个可直接导入 Chrome / Edge 的浏览器扩展，用于在常见 AI 聊天页面右侧生成“用户提问导航侧栏”。

## 项目简介

AI Chat Context Sidebar 会在 AI 聊天网页右侧注入一个可交互侧栏，用于读取当前页面中由用户发起的提问内容，并生成可点击的提问导航列表。

这个扩展主要解决长对话场景下“历史提问难以快速定位”的问题，适用于 ChatGPT、Gemini、豆包、Claude、Kimi、DeepSeek、元宝、千问等常见 AI 聊天界面。

## 核心功能

- 自动识别常见 AI 聊天页面中的用户提问内容
- 只展示用户发起的提问，不展示 AI 回答
- 侧栏预览文本限制为 15 个字，超出使用省略号展示
- 点击侧栏提问条目，聊天界面定位到对应提问位置
- 侧栏支持独立滚动，不影响聊天页面本身滚动
- 支持顶部 `开/关` 按钮，默认展开，可折叠提问列表
- 支持长按侧栏非按钮区域，在浏览器可视区域内上下拖动侧栏
- 支持拖拽侧栏上下边框调整侧栏高度
- 支持手动选择聊天容器作为自动识别失败时的兜底方案
- 配置会按站点保存，包括展开状态、侧栏位置与高度
- 仅在已支持的 AI 站点中注入，不会在 GitHub 等普通网站显示

## 当前适配站点

- ChatGPT
- Gemini
- 豆包
- Claude
- Kimi
- DeepSeek
- 腾讯元宝
- 通义千问

## 安装方式

### 本地开发 / 自用安装

1. 打开 Chrome：`chrome://extensions/`
2. 或打开 Edge：`edge://extensions/`
3. 开启“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择当前项目目录

目录路径：

`D:\DevelopmentSpace\IdeaJavaWorkSpace\插件开发\ai-context`

### 商店上传包

项目中已包含打包文件：

- `ai-context.zip`

可用于 Chrome Web Store 或 Microsoft Edge Add-ons 提交。

## 使用方式

1. 打开任意已支持的 AI 聊天页面
2. 进入具体会话
3. 侧栏会自动出现在页面右侧
4. 点击侧栏提问条目，即可定位到对应的聊天内容
5. 若自动识别失败，可点击“选择聊天框”手动指定聊天区域
6. 点击顶部 `关` 按钮可折叠侧栏，点击 `开` 可再次展开
7. 长按侧栏内非按钮区域可上下拖动位置
8. 鼠标停在侧栏上下边框附近拖动，可调整侧栏高度
9. 长会话场景下，请先向上滚动聊天区，让历史提问节点加载出来，再由侧栏读取

## 版本更新

### v1.1.0

- 限制扩展只在已支持的 AI 聊天站点中注入
- 新增千问站点适配
- 优化 Gemini、豆包、元宝的用户提问识别逻辑
- 修复侧栏滚轮悬停时不滚动的问题
- 支持长按侧栏区域上下拖动
- 支持拖拽侧栏上下边框调整高度

## 项目结构

```text
ai-context/
├─ icons/                # 扩展图标
├─ content.js            # 内容脚本，处理 DOM 识别、侧栏渲染、交互逻辑
├─ content.css           # 侧栏样式
├─ manifest.json         # Chrome / Edge 扩展清单
├─ README.md             # 项目说明
├─ DEVELOPMENT.md        # 开发文档
├─ CONTRIBUTING.md       # 贡献说明
├─ PRIVACY.md            # 隐私说明
├─ STORE_LISTING.md      # 商店上架文案
├─ PACKAGE.md            # 打包说明
└─ ai-context.zip        # 已打包的上传文件
```

## 开发说明

详细开发文档见：

- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [PRIVACY.md](./PRIVACY.md)

## 发布说明

### Chrome Web Store

需要开发者账号和一次性注册。

### Microsoft Edge Add-ons

可以通过 Microsoft Partner Center 提交扩展。

## 隐私说明

扩展仅在当前页面本地读取用户提问文本，用于生成导航侧栏。

- 不上传聊天内容到开发者服务器
- 不向第三方接口传输聊天内容
- 不收集账号密码和支付信息

完整内容见 [PRIVACY.md](./PRIVACY.md)。

## License

本项目采用 [MIT License](./LICENSE)。
