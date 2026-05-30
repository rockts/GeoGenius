# GeoGenius — AI 几何小老师

AI 辅助小学几何教学平台，通过交互式图形演示和 AI 讲解，帮助三到六年级学生理解几何概念。

## 功能

- **交互式图形演示** — SVG 动态绘制几何图形，带网格、尺寸标注和割补法动画
- **分步讲解** — 每个知识点拆分为 5 步结构化学习路径
- **AI 智能讲解** — 模拟 AI 老师进行公式讲解和解题提示（当前为本地 mock，预留了 OpenAI 兼容接口）
- **习题生成** — 随机出题，含提示和分步解题过程

## 项目入口

打开 `几何直观AI学习助手.html` 即可看到项目落地页，从中选择要体验的 Demo 版本。

## 演示版本

| 版本 | 路径 | 知识点 | 说明 |
|---|---|---|---|
| 几何直观AI学习助手 | `几何直观AI学习助手.html` | — | 项目入口页，紫色渐变设计，卡片式导航 |
| React 版 | `ai-geometry-tutor/` | 3 个（长方形、三角形、平行四边形面积） | 工程化架构，适合持续开发 |
| 完整版 | `geometry_tool.html` | 28 个（覆盖 1-6 年级全部几何知识点） | 单文件，暖色调设计，快速体验全部功能 |

三个 Demo 的定位：
- `几何直观AI学习助手.html` — 入口导航页，快速访问所有 Demo
- `ai-geometry-tutor/` — React 工程版，交互式图形演示 + AI 讲解 + 习题生成
- `geometry_tool.html` — 完整功能演示，覆盖新课标「图形认识与测量」+「图形位置与运动」两大主题

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| AI 接入 | 预留 OpenAI/DeepSeek/豆包 API（当前 mock） |

## 快速开始

```bash
cd ai-geometry-tutor
npm install
npm run dev      # 开发模式，默认 http://localhost:5173
npm run build    # 生产构建
npm run preview  # 预览构建产物
```

## 项目结构

```
ai-geometry-tutor/
├── src/
│   ├── components/
│   │   ├── Header.tsx           # 顶部标题栏
│   │   ├── TopicTabs.tsx        # 知识点切换标签
│   │   ├── ShapeCanvas.tsx      # SVG 动态图形演示
│   │   ├── ExplanationPanel.tsx # 分步讲解 + AI 讲解
│   │   └── ExercisePanel.tsx    # 练习题生成/提示/答案
│   ├── data/
│   │   └── topics.ts            # 知识点内容和习题生成逻辑
│   ├── hooks/
│   │   └── useTopic.ts          # 核心状态管理
│   ├── services/
│   │   └── aiService.ts         # AI 接口层（当前 mock）
│   ├── types/
│   │   └── index.ts             # 类型定义
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js

几何直观AI学习助手.html            # 项目入口/落地页（卡片式导航）
geometry_tool.html                # 核心功能演示（28 个知识点，暖色调设计）
```

## 后续计划

- [ ] 将 `geometry_tool.html` 中的 28 个知识点和设计语言迁移到 React 版
- [ ] 接入真实 AI API（DeepSeek / OpenAI / 豆包）
- [ ] 图形位置与运动主题（平移、旋转、轴对称）
- [ ] 学习进度追踪
