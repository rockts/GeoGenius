# GeoGenius 开发上下文

> **每次新对话开始时，把这个文件发给 AI，即可无缝继续开发。**
> 每次开发结束后更新「当前状态」和「待办事项」两节。

---

## 项目基本信息

- **项目名**：GeoGenius — 小学几何公式动画推导工具
- **线上地址**：https://geogenius.xiaole.app
- **GitHub**：https://github.com/rockts/GeoGenius（主分支：`main`）
- **部署**：Cloudflare Pages，自动部署 `main` 分支
- **结构**：单文件 `index.html`，无框架，无构建步骤；AI后端代理在 `functions/` 目录

---

## 技术栈

### SVG 绘图辅助函数（定义在 index.html 内）

| 函数 | 说明 |
|------|------|
| `E(tag, attrs, parent)` | 创建 SVG 元素 |
| `T(s, x, y, text, color, size, anchor, weight)` | 绘制文字 |
| `R(s, x, y, w, h, fill, stroke, sw, r)` | 绘制矩形 |
| `L(s, x1, y1, x2, y2, color, sw, dash)` | 绘制直线 |
| `PL(s, points, fill, stroke, sw)` | 绘制多边形 |
| `RA(s, x, y, size, color)` | 绘制直角标记 |
| `C(s, cx, cy, r, fill, stroke, sw)` | 绘制圆 |
| `lp([x1,y1],[x2,y2], t)` | 线性插值（动画用） |
| `ease(t)` | ease-in-out 缓动函数 |

### 动画结构

每个知识点是一个步骤数组，每步格式：
```javascript
{
  hint: '底部说明文字',
  formula: '公式卡片文字',
  dur: 1200,          // 动画时长(ms)
  draw(s, t) { ... }  // t: 0→1，s: SVG容器
}
```

### 知识点 ID 体系

| ID前缀 | 年级 | 主题 |
|--------|------|------|
| a1, a2 | 一年级 | 图形认识与测量 |
| b1–b3 | 二年级 | 图形认识与测量 |
| c1–c5 | 三年级 | 图形认识与测量 |
| d1, d2 | 四年级 | 图形认识与测量 |
| e1–e7 | 五年级 | 图形认识与测量 |
| f1–f5 | 六年级 | 图形认识与测量 |
| p_b1, p_b2 | 二年级 | 图形位置与运动 |
| p_d1–p_d3 | 四年级 | 图形位置与运动 |
| p_e1 | 五年级 | 图形位置与运动 |

---

## 当前状态（最后更新：2026-06-20 22:24）

- **知识点**：33 个，135 个动画步骤
- **当前分支**：dev / `8fd37a1` — feat(g1): 长方体和正方体的认识Canvas版（Cabinet投影·棱分组·正方体特例）
- **index.html 大小**：368859 字节 / 9796 行
- **Cloudflare 部署分支**：main
- **最后提交者**：rockts @ 2026-06-20 22:24


## 待办事项

- [ ] 继续排查其他知识点的图形标注准确性
- [ ] 图形位置与运动主题补充更多练习题变式
- [ ] 练习题增加填空和图形判断题型
- [ ] 根据数据面板反馈持续优化最难知识点动画

---

## 开发规范

### Push 流程（用 GitHub API 操作时必须遵守）

```python
# 1. 每次 push 前先拉取最新 SHA，不能用缓存的
req = urllib.request.Request(
    "https://api.github.com/repos/rockts/GeoGenius/contents/index.html?ref=main",
    headers={"Authorization": f"token {TOKEN}"}
)
with urllib.request.urlopen(req) as resp:
    sha = json.loads(resp.read())['sha']

# 2. push 后验证 commit 已进入历史
# 3. 重要修改 push 后立即从远程拉取验证关键词存在
```

### Commit 格式
```
fix: 描述具体修复内容
feat: 描述新增功能
docs: 文档更新
```

### 修改验证模板
```python
checks = {
    '描述': '代码中的关键词',
}
for k, v in checks.items():
    print(f"{'✅' if v in content else '❌'} {k}")
```

---

## 后端配置（Cloudflare Pages）

**KV 命名空间绑定**：变量名 `GEO_STATS`

**环境变量**：
- `DEEPSEEK_API_KEY`：DeepSeek API Key
- `STATS_TOKEN`：数据面板访问密码

**数据面板**：`https://geogenius.xiaole.app/api/stats?token=你的STATS_TOKEN`

---

## 快速接手指令

新对话开始时对 AI 说：

> 这是我的项目 GeoGenius 的开发上下文文件，请阅读后继续开发。
> GitHub Token: ghp_xxx（每次手动填写，不要提交到仓库）
> 今天要做：xxx
