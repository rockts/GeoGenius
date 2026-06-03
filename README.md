# GeoGenius — 几何直观AI学习助手

小学图形与几何动态演示学习工具。工具通过 SVG 分步动画呈现公式推导和图形运动过程，配合 AI 老师讲解、变式练习题和匿名使用数据收集，帮助教师在课堂上快速展示关键几何关系。

🔗 **在线体验：[geogenius.xiaole.app](https://geogenius.xiaole.app/)**

## 功能

- **分步动画推导**：30 个知识点拆分为 3–5 步，用 SVG 动画直观演示公式来源，可暂停、重播、逐步控制
- **124 个动画步骤**：自定义缓动引擎，`requestAnimationFrame` 驱动，自动适配视口大小
- **AI 老师对话**：开箱即用，无需配置；内置后端代理，默认使用 DeepSeek 模型；也可在设置中填入自己的 API Key 切换
- **变式练习题**：109 道选择题，覆盖公式认识 + 应用变式（含反推未知量、实际应用情境、钝角三角形高的位置等），含即时反馈和"再来一题"
- **真实完成进度**：看完最后一步才记录 ✓，首页显示已掌握知识点数，进度持久化存储
- **使用数据收集**：匿名记录知识点完成和答题数据（IP 脱敏），提供管理面板查看最难知识点、今日访问数、平均评分
- **学生反馈入口**：首页底部"使用反馈"按钮，收集年级、星级评分、难点和建议
- **键盘快捷键**：→ / Space 下一步，← 上一步，R 重播，F 投影模式，Esc 返回

## 快速开始

直接打开浏览器访问 [geogenius.xiaole.app](https://geogenius.xiaole.app/)，无需安装任何依赖。

本地运行：
```bash
# 克隆仓库后直接用浏览器打开 index.html 即可，无需构建
open index.html
```

## 知识点覆盖

依据义务教育数学课程标准（2022 年版），覆盖「图形认识与测量」和「图形位置与运动」两大主题：

| 年级 | 图形认识与测量 | 图形位置与运动 |
|------|--------------|--------------|
| 一年级 | 认识立体图形、认识平面图形 | — |
| 二年级 | 角的初步认识、长方形与正方形、长度的认识与测量 | 轴对称图形、平移与旋转初步 |
| 三年级 | 四边形与平行四边形、周长的认识、长方形周长公式、面积的认识、长方形面积公式 | — |
| 四年级 | 角的度量、平行四边形与梯形、线段、射线与直线、平行与垂直、观察物体 | 轴对称深化、平移深化、旋转深化 |
| 五年级 | 平行四边形面积、三角形面积、梯形面积、组合图形面积 | 图形的放大与缩小 |
| 六年级 | 圆的周长、圆的面积、圆柱表面积、圆柱体积、圆锥体积 | — |

**合计：30 个知识点，124 个动画步骤，109 道练习题**

## 部署

```bash
# 将 index.html 放到 Cloudflare Pages 或 Nginx 静态目录
cp index.html /usr/share/nginx/html/index.html
```

AI 后端代理（`/api/chat`）和数据收集接口（`/api/track`、`/api/feedback`、`/api/stats`）通过 Cloudflare Pages Functions 实现，需在 CF Pages 控制台完成以下配置：

**KV 命名空间绑定**（Settings → Functions → KV namespace bindings）：
- 变量名：`GEO_STATS`，绑定到已创建的 KV 命名空间

**环境变量**（Settings → Environment variables）：
- `DEEPSEEK_API_KEY`：DeepSeek API Key，用于 AI 对话代理
- `STATS_TOKEN`：自定义密码，用于访问 `/api/stats?token=xxx` 数据面板

## 数据查看

学生使用后，访问以下地址查看匿名统计数据：

```
https://geogenius.xiaole.app/api/stats?token=你设置的STATS_TOKEN
```

返回字段：
- `overview`：今日访问数（UV）、平均评分、评分人数
- `hardestTopics`：答错率最高的 5 个知识点（反映学生真实难点）
- `popularTopics`：完成次数最多的 5 个知识点
- `recentFeedbacks`：最近 10 条学生反馈

## AI 设置

工具默认通过后端代理调用 AI，无需用户配置。如需使用自己的 Key：

1. 点击动画页面右下角「AI 老师」按钮，再点右上角设置图标
2. 填入 [DeepSeek API Key](https://platform.deepseek.com/)（注册后免费获取）
3. Key 仅存储在浏览器本地 `localStorage`，不上传到任何服务器

不填写则走后端代理；代理不可用时自动降级为本地 mock 回复，功能照常可用。

## 技术实现

单文件 HTML，无外部框架，无构建步骤：

| 类别 | 实现 |
|------|------|
| 图形渲染 | 原生 SVG + 自封装辅助函数（E / T / R / PL / L / C / RA） |
| 动画引擎 | `requestAnimationFrame` + ease-in-out 缓动，支持速度控制 |
| 布局 | CSS Grid + Flexbox，响应式适配移动端（含软键盘遮挡修复） |
| 持久化 | `localStorage`（年级选择、完成进度、API Key） |
| AI 接入 | Cloudflare Pages Function 代理（默认）/ DeepSeek Chat API（用户自定义 Key） |
| 数据收集 | Cloudflare Pages Functions + KV（匿名埋点、反馈收集、数据面板） |
| 字体 / 图标 | Noto Sans SC + Tabler Icons（CDN） |

## 已修复的问题

- 长方形对称轴画法（对角线 → 横纵中线）
- 四边形家族表述改为条件化表达，避免学生把平行四边形误解为只能是斜的图形
- 量角器动画加入被测角，展示完整量角过程
- 四类角（锐角/直角/钝角/平角）改为两行布局，手机端不再挤压
- 旋转动画旋转方向和弧线对齐修正
- 梯形推导中间步骤明确标注「平行四边形面积÷2→梯形面积」，防止误读
- AI 消息重复发送 bug、练习题"再来一题"、进度标记虚标等

## 后续计划

- 图形位置与运动主题练习题补充更多变式题型
- 练习题增加填空和图形判断题型
- 根据数据面板反馈持续优化最难知识点的动画说明
