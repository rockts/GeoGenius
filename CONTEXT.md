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
| c1–c5, c3b, c5b | 三年级 | 图形认识与测量（c3b=长方形周长、c5b=面积单位换算，原ID已被占用故加b后缀） |
| d1, d2, d5 | 四年级 | 图形认识与测量 |
| e1–e7 | 五年级 | 图形认识与测量 |
| f1–f5 | 六年级 | 图形认识与测量 |
| g1 | 五年级 | 长方体和正方体的认识（Canvas，Cabinet 投影） |
| g2 | 五年级 | 三角形的认识（Canvas，拖动滑块实时分类） |
| g3 | 六年级 | 位置与方向（Canvas，方向角+比例尺+综合定位） |
| p_b1, p_b2 | 二年级 | 图形位置与运动 |
| p_d1–p_d3 | 四年级 | 图形位置与运动 |
| p_e1 | 五年级 | 图形位置与运动 |

---

## 已完成工作记录（Canvas 新标准，2026-06 完整会话）

### 阶段一：核心推导重做（面积/体积类）

全部按"等面积变形逐步动画"标准重做，带说明文字：

- **e1 平行四边形面积**：剪切补形 → 长方形，推导 S=ah
- **e2 三角形面积**：两个全等三角形拼合 → 平行四边形，推导 S=½ah
- **e3 梯形面积**：两个全等梯形旋转180°沿腰拼合 → 平行四边形，推导 S=½(a+b)h
- **f2 圆的面积**：扇形重排拼合 → 近似长方形，推导 S=πr²
- **f4 圆柱体积**：圆柱竖切成扇形柱，同方向并排展开，单色，切得越细越接近长方体，推导 V=πr²h

### 阶段二：其余推导/测量类重做

- **f1 圆的周长**：滚圆测周长（圆沿直线滚动，轨迹展开为直线）+ 摆线轨迹动画，推导 C=2πr
- **f3 圆柱表面积**：侧面展开成长方形（宽=底面周长，高=h），两个底面圆，推导 S=2πr(r+h)
- **f5 圆锥体积**：倒水3次停顿动画，水位逐次升高，验证 V=⅓πr²h
- **c3b 长方形周长**（ID=c3b，原c3已被占用）：四边描边动画 + 展开成一条线，推导 C=2(a+b)
- **c4 正方形周长**：四边描边 + 展开，推导 C=4a
- **c5b 面积单位换算**（ID=c5b）：网格计数证明 1m²=100dm²=10000cm²

### 阶段三：新增缺失知识点（g系列）

- **g1 长方体和正方体的认识**：Canvas，Cabinet 投影3D，12棱6面8顶点，颜色区分各面，滑块调节长宽高
- **g2 三角形的认识**：Canvas，拖动顶点（滑块驱动），实时按角分类（锐角/直角/钝角）+ 按边分类（等边/等腰/不等边），内角和验证动画
- **g3 位置与方向**：Canvas，方向角旋转、比例尺换算、综合定位练习（输入角度+距离定点）

### 阶段四：历史遗留问题修复

- **p_b1 轴对称图形**：确认现有4步内容完整，无需修改
- **b2 长方形与正方形**：补充 Step4/Step5 对称轴内容（长方形2条中线、正方形4条对称轴），折叠动画 + quiz 同步覆盖
- **d1 角的度量**：删除超范围的内角和/三角形分类内容（已被g2覆盖），替换为画角 Canvas 交互（滑块25–155°）和估角练习 SVG 动画
- **d5 观察物体**：从静态贴标签重做为 Canvas Cabinet 投影长方体，4步（总览/正面/俯视/侧面）高亮当前观察面→虚线箭头→平面图按比例展开动画，a/b/h 三滑块实时联动；修复轴向映射错误（x=宽b, y=高h, z=长a）和俯视图标注与箭头重叠问题

### 阶段五：Favicon + OG 分享（v1.2.9）

- **Favicon**：内联 SVG data URI（蓝紫渐变圆角方块+白三角形+内切圆），无额外请求
- **og.svg → og.png**：微信不支持 SVG，用 cairosvg 生成 1200×630 PNG，并生成 630×630 正方形备用版（og-square.png）
- **og:url / og:image / twitter:image**：统一改为 `https://geogenius.xiaole.app/` 域名（修复之前误写为 github.io 导致微信爬虫无法抓取的问题）
- **验证**：curl 确认 `geogenius.xiaole.app/og.png` 返回 image/png 77KB，meta 标签已正确部署

---

## 技术约定（本次会话确立）

- **ID冲突处理**：知识点ID已被占用时，用后缀变体（如 c3→c3b、c5→c5b），不覆盖已有内容
- **Canvas 新范式**：交互类知识点统一用 `{dur:100, noAutoFit:true, draw(s){...}}` + `getXxxCanvas(s)` 注入 `<canvas>` 和 `<div id="xxx-overlay">` 到 SVG 父容器
- **滑块驱动优先**：三角形/长方体等分类型知识点，用滑块实时驱动参数 + 实时判定，不用按钮切换预设样例
- **Canvas 截图确认**：所有新增 Canvas 动画必须截图人工确认几何正确性后才能提交，文字描述不可信
- **git push 防冲突**：CI 会自动提交 CONTEXT.md 到 origin，每次 push 前必须 `git pull --rebase origin <branch>`，有未暂存改动时先 `git stash` 再 pull 再 `git stash pop`
- **dev→main 合并**：CONTEXT.md 必然冲突，固定用 `git checkout --theirs CONTEXT.md && git add CONTEXT.md && git merge --continue`
- **rebase 冲突注意**：rebase 时 `--ours` = upstream（来源分支），`--theirs` = 本地正在 replay 的 commit，与 merge 相反

---

## 当前状态（最后更新：2026-06-21 22:43）

- **知识点**：35 个，144 个动画步骤
- **当前分支**：dev / `7135b71` — feat(f2): 扇形交错咬合重做——金黄朝上浅蓝朝下真正咬合
- **index.html 大小**：429317 字节 / 11021 行
- **Cloudflare 部署分支**：main
- **最后提交者**：rockts @ 2026-06-21 22:43


## 待办事项

- [ ] 继续排查其他知识点的图形标注准确性
- [ ] 图形位置与运动主题补充更多练习题变式
- [ ] 练习题增加填空和图形判断题型
- [ ] 根据数据面板反馈持续优化最难知识点动画
- [ ] 若微信朋友圈仍无法显示预览图，尝试改用 og-square.png（630×630）

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
