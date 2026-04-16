# 笔记软件

一个基于 Electron 开发的跨平台笔记软件，支持 Markdown 编辑、LaTeX 公式渲染和标签管理。

## 功能特性

- **Markdown 编辑**：支持 Markdown 语法，实时预览编辑效果
- **LaTeX 公式**：支持数学公式渲染，使用 KaTeX 库
- **标签管理**：支持为文本添加标签，标签显示在编辑区下方
- **文件管理**：支持新建、打开、保存笔记
- **文件夹浏览**：支持打开文件夹并查看其中的笔记
- **跨平台**：基于 Electron，可在 Windows、macOS 和 Linux 上运行

## 技术栈

- **Electron**：跨平台桌面应用框架
- **Marked**：Markdown 解析与渲染
- **KaTeX**：LaTeX 数学公式渲染
- **HTML/CSS/JavaScript**：前端界面

## 安装方法

### 前提条件

- Node.js (v14.0 或更高版本)
- npm (v6.0 或更高版本)

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/ericvbn/notebook.git
   cd notebook
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 运行应用：
   ```bash
   npm start
   ```

## 使用说明

### 基本操作

- **新建笔记**：点击欢迎框中的「新建笔记」按钮或使用快捷键 `Ctrl+N`
- **打开文件**：点击欢迎框中的「打开文件」按钮或使用快捷键 `Ctrl+O`
- **打开文件夹**：点击欢迎框中的「打开文件夹」按钮或使用快捷键 `Ctrl+Shift+O`
- **保存笔记**：使用快捷键 `Ctrl+S`
- **另存为**：使用快捷键 `Ctrl+Shift+S`

### 标签管理

1. 在编辑器中选中文本
2. 右键点击选中的文本
3. 在弹出的模态框中输入标签名称
4. 点击「确定」按钮添加标签
5. 标签会显示在编辑区下方的标签栏中
6. 点击标签上的「×」符号可以删除标签

### 公式渲染

- **行内公式**：使用 `$` 符号包裹公式，例如 `$E=mc^2$`
- **块级公式**：使用 `$$` 符号包裹公式，例如 `$$E=mc^2$$`

## 项目结构

```
├── css/               # 样式文件
│   └── style.css      # 主样式文件
├── js/                # JavaScript 文件
│   └── script.js      # 渲染进程代码
├── data/              # 数据存储目录
│   └── newNote/       # 新笔记存储目录
├── index.html         # 主界面
├── index.js           # 主进程
├── preload.js         # 预加载脚本
├── package.json       # 项目配置
└── README.md          # 项目说明
```

## 数据存储

- **Markdown 文件**：存储笔记内容
- **JSON 文件**：存储笔记的元数据和标签信息
- **默认存储位置**：项目目录下的 `data` 文件夹

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新建笔记 |
| Ctrl+O | 打开文件 |
| Ctrl+Shift+O | 打开文件夹 |
| Ctrl+S | 保存笔记 |
| Ctrl+Shift+S | 另存为 |
| Ctrl+Q | 退出应用 |
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |
| Ctrl+X | 剪切 |
| Ctrl+C | 复制 |
| Ctrl+V | 粘贴 |
| Ctrl+A | 全选 |
| F11 | 全屏 |

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- GitHub: [https://github.com/ericvbn/notebook](https://github.com/ericvbn/notebook)

---

希望这个笔记软件能够帮助您更高效地记录和管理笔记！