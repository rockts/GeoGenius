// Cloudflare Pages Function - 数据查看面板（密码保护）
// 访问：
// - /api/stats?token=你设置的密码              默认 JSON，兼容旧接口
// - /api/stats?token=你设置的密码&format=html 给人看的中文面板
// - /api/stats?token=你设置的密码&format=agent 给 agent 用的结构化分析

const TOPICS = {
  a1: { grade: '一年级', title: '认识立体图形', sub: '长方体·正方体·圆柱·球' },
  a2: { grade: '一年级', title: '认识平面图形', sub: '从立体面到平面形' },
  b1: { grade: '二年级', title: '角的初步认识', sub: '角·直角·画法' },
  b2: { grade: '二年级', title: '长方形与正方形', sub: '边角特征与包含关系' },
  b3: { grade: '二年级', title: '长度的认识与测量', sub: '厘米·米·测量方法' },
  c1: { grade: '三年级', title: '四边形与平行四边形', sub: '认识·特征·分类' },
  c2: { grade: '三年级', title: '周长的认识', sub: '一圈的总长度' },
  c3: { grade: '三年级', title: '长方形周长公式', sub: '推导 C = 2(a+b)' },
  c4: { grade: '三年级', title: '面积的认识', sub: '铺方格理解面积' },
  c5: { grade: '三年级', title: '长方形面积公式', sub: '推导 S = ab' },
  d1: { grade: '四年级', title: '角的度量', sub: '四类角·量角器使用' },
  d2: { grade: '四年级', title: '平行四边形与梯形', sub: '定义·特征·分类' },
  d3: { grade: '四年级', title: '线段、射线与直线', sub: '端点·延伸·关系' },
  d4: { grade: '四年级', title: '平行与垂直', sub: '同一平面内两直线关系' },
  d5: { grade: '四年级', title: '观察物体', sub: '前面·上面·侧面' },
  e1: { grade: '五年级', title: '平行四边形面积', sub: '剪拼变长方形推导' },
  e2: { grade: '五年级', title: '三角形面积', sub: '两个拼平行四边形' },
  e3: { grade: '五年级', title: '梯形面积', sub: '两梯形拼平行四边形' },
  e4: { grade: '五年级', title: '组合图形面积', sub: '分割法与补全法' },
  f1: { grade: '六年级', title: '圆的周长', sub: 'π的发现 C = 2πr' },
  f2: { grade: '六年级', title: '圆的面积', sub: '扇形切拼 S = πr²' },
  f3: { grade: '六年级', title: '圆柱的表面积', sub: '展开图 S = 2πr(r+h)' },
  f4: { grade: '六年级', title: '圆柱的体积', sub: 'V = πr²h' },
  f5: { grade: '六年级', title: '圆锥的体积', sub: 'V = ⅓πr²h' },
  p_b1: { grade: '二年级', title: '轴对称图形', sub: '对折重合·对称轴' },
  p_b2: { grade: '二年级', title: '平移与旋转初步', sub: '感知两种运动现象' },
  p_d1: { grade: '四年级', title: '轴对称深化', sub: '方格纸上画对称图形' },
  p_d2: { grade: '四年级', title: '平移深化', sub: '方格纸上描述平移' },
  p_d3: { grade: '四年级', title: '旋转深化', sub: '顺逆时针旋转90°' },
  p_e1: { grade: '五年级', title: '图形的放大与缩小', sub: '按比例变化·比例尺' },
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  // 密码从环境变量读取，CF Pages 设置里加 STATS_TOKEN
  const validToken = env.STATS_TOKEN;
  if (!validToken || token !== validToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const kv = env.GEO_STATS;
  if (!kv) {
    return jsonResponse({ error: 'KV not bound' }, 500);
  }

  const stats = await collectStats(kv);

  if (format === 'html') {
    return new Response(renderHtml(stats, token), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (format === 'agent') {
    return jsonResponse(buildAgentReport(stats));
  }

  // 默认 JSON 保持旧接口结构，避免外部调用被破坏。
  return jsonResponse({
    overview: stats.overview,
    hardestTopics: stats.hardestTopics.map(toLegacyQuizStat),
    popularTopics: stats.popularTopics.map(toLegacyCompleteStat),
    recentFeedbacks: stats.recentFeedbacks.map(toLegacyFeedback),
  });
}

async function collectStats(kv) {
  const today = getChinaDateKey();

  const uvToday = JSON.parse((await kv.get(`uv:${today}`)) || '[]').length;
  const ratingTotal = parseFloat((await kv.get('rating_total')) || '0');
  const ratingCount = parseInt((await kv.get('rating_count')) || '0', 10);
  const avgRating = ratingCount > 0 ? (ratingTotal / ratingCount).toFixed(1) : 'N/A';

  const quizKeys = await kv.list({ prefix: 'quiz_total:' });
  const quizStats = [];
  for (const k of quizKeys.keys) {
    const topicId = k.name.replace('quiz_total:', '');
    const total = parseInt((await kv.get(k.name)) || '0', 10);
    const correct = parseInt((await kv.get(`quiz_correct:${topicId}`)) || '0', 10);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
    quizStats.push(enrichTopic({
      topicId,
      total,
      correct,
      accuracy,
      sampleLevel: getSampleLevel(total),
    }));
  }
  quizStats.sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));

  const completeKeys = await kv.list({ prefix: 'count:topic_complete:' });
  const completeStats = [];
  for (const k of completeKeys.keys) {
    const topicId = k.name.replace('count:topic_complete:', '');
    const count = parseInt((await kv.get(k.name)) || '0', 10);
    completeStats.push(enrichTopic({ topicId, count }));
  }
  completeStats.sort((a, b) => b.count - a.count);

  const fbKeys = await kv.list({ prefix: 'feedback:', limit: 100 });
  const recentFeedbacks = [];
  const sortedFeedbackKeys = [...fbKeys.keys].sort((a, b) => b.name.localeCompare(a.name));
  for (const k of sortedFeedbackKeys.slice(0, 20)) {
    const val = await kv.get(k.name);
    if (val) {
      const feedback = JSON.parse(val);
      recentFeedbacks.push(enrichFeedback(feedback));
    }
  }

  const stats = {
    generatedAt: new Date().toISOString(),
    overview: { uvToday, avgRating, ratingCount },
    hardestTopics: quizStats.slice(0, 8),
    popularTopics: completeStats.slice(0, 8),
    recentFeedbacks,
  };
  stats.agentAnalysis = buildAgentAnalysis(stats);
  return stats;
}

function enrichTopic(item) {
  const meta = TOPICS[item.topicId] || {};
  return {
    ...item,
    title: meta.title || item.topicId || '未知知识点',
    grade: meta.grade || '',
    sub: meta.sub || '',
    displayName: meta.title ? `${meta.grade} · ${meta.title}` : item.topicId,
  };
}

function enrichFeedback(feedback) {
  const topic = inferFeedbackTopic(feedback);
  return {
    ...feedback,
    localTime: formatChinaTime(feedback.ts),
    device: simplifyUserAgent(feedback.ua || ''),
    inferredTopicId: topic?.topicId || '',
    inferredTopicName: topic?.displayName || '',
    tags: classifyFeedback(feedback),
    summary: summarizeFeedback(feedback),
  };
}

function inferFeedbackTopic(feedback) {
  const text = `${feedback.hardest || ''} ${feedback.comment || ''}`.toLowerCase();
  if (!text.trim()) return null;

  for (const [topicId, meta] of Object.entries(TOPICS)) {
    if (
      text.includes(topicId.toLowerCase()) ||
      text.includes(meta.title.toLowerCase()) ||
      text.includes(meta.title.replace(/[的与]/g, '').toLowerCase())
    ) {
      return { topicId, ...meta, displayName: `${meta.grade} · ${meta.title}` };
    }
  }

  const keywordMap = [
    ['圆柱体积', 'f4'],
    ['圆柱的体积', 'f4'],
    ['圆柱', 'f4'],
    ['圆锥体积', 'f5'],
    ['圆锥', 'f5'],
    ['量角器', 'd1'],
    ['观察物体', 'd5'],
    ['轴对称', 'p_d1'],
    ['长方形面积', 'c5'],
    ['三角形面积', 'e2'],
    ['梯形面积', 'e3'],
  ];
  for (const [keyword, topicId] of keywordMap) {
    if (text.includes(keyword)) {
      const meta = TOPICS[topicId];
      return { topicId, ...meta, displayName: `${meta.grade} · ${meta.title}` };
    }
  }

  return null;
}

function classifyFeedback(feedback) {
  const text = `${feedback.hardest || ''} ${feedback.comment || ''}`;
  const tags = [];
  if ((feedback.rating || 0) <= 3) tags.push('低评分');
  if (/不懂|不好理解|看不懂|太难|难懂|不好懂|学生不好理解/.test(text)) tags.push('理解困难');
  if (/动画|演示|直观|切割|切拼|拼凑|转化|推导/.test(text)) tags.push('动画推导');
  if (/儿童|孩子|学生|小学生/.test(text)) tags.push('儿童视角');
  if (/公式|推导|怎么得来|由来/.test(text)) tags.push('公式来源');
  if (!tags.length) tags.push('普通反馈');
  return tags;
}

function summarizeFeedback(feedback) {
  const comment = String(feedback.comment || '').trim();
  if (!comment) return feedback.hardest ? `最难知识点：${feedback.hardest}` : '未填写文字建议';
  return comment.length > 80 ? `${comment.slice(0, 80)}...` : comment;
}

function buildAgentReport(stats) {
  return {
    generatedAt: stats.generatedAt,
    purpose: '供 agent 生成产品迭代建议；不要直接自动上线，先生成待办和改动草案。',
    overview: stats.overview,
    topics: TOPICS,
    hardestTopics: stats.hardestTopics,
    popularTopics: stats.popularTopics,
    recentFeedbacks: stats.recentFeedbacks,
    analysis: stats.agentAnalysis,
  };
}

function buildAgentAnalysis(stats) {
  const recommendations = [];

  for (const feedback of stats.recentFeedbacks) {
    if (!feedback.comment && !feedback.hardest) continue;
    const topicId = feedback.inferredTopicId;
    const topic = topicId ? TOPICS[topicId] : null;
    const tags = feedback.tags || [];
    const priority = getFeedbackPriority(feedback);
    recommendations.push({
      priority,
      source: 'feedback',
      topicId: topicId || '',
      topicName: topic ? `${topic.grade} · ${topic.title}` : '未能自动匹配知识点',
      reason: [
        `${feedback.grade || '未知身份'}给出${feedback.rating || '?'}星反馈`,
        tags.join('、'),
      ].filter(Boolean).join('；'),
      userVoice: feedback.comment || feedback.hardest || '',
      suggestedAction: suggestAction(feedback, topicId),
      needsHumanReview: true,
    });
  }

  for (const item of stats.hardestTopics) {
    if (!item.total) continue;
    recommendations.push({
      priority: item.total >= 20 && item.accuracy <= 60 ? 'high' : 'medium',
      source: 'quiz_accuracy',
      topicId: item.topicId,
      topicName: item.displayName,
      reason: `练习正确率 ${item.accuracy}%（${item.correct}/${item.total}），样本量：${sampleText(item.sampleLevel)}`,
      suggestedAction: item.total < 20
        ? '样本较少，先观察；可人工复核题目和动画是否有明显误导。'
        : '优先复核该知识点动画解释和练习题设计，必要时补充提示或拆分步骤。',
      needsHumanReview: true,
    });
  }

  recommendations.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));

  return {
    summary: buildSummary(stats),
    recommendations: recommendations.slice(0, 10),
    automationPolicy: {
      safeToAutomate: ['反馈归类', '生成待办', '生成改动草案', '运行全量动画巡检'],
      requireHumanApproval: ['教学内容调整', '动画逻辑重做', '自动合并发布'],
    },
  };
}

function buildSummary(stats) {
  const feedbackCount = stats.recentFeedbacks.length;
  const strongestFeedback = stats.recentFeedbacks.find((f) => f.comment);
  if (strongestFeedback) {
    return `最近有 ${feedbackCount} 条反馈；最明确的建议指向「${strongestFeedback.inferredTopicName || '未匹配知识点'}」：${strongestFeedback.summary}`;
  }
  return `最近有 ${feedbackCount} 条反馈；当前样本仍少，建议结合课堂观察判断。`;
}

function getFeedbackPriority(feedback) {
  const text = `${feedback.hardest || ''} ${feedback.comment || ''}`;
  if ((feedback.rating || 0) <= 3 && text.length > 10) return 'high';
  if (/不好理解|学生不好理解|看不懂|难懂|推导|转化|动画/.test(text)) return 'high';
  if (text.length > 10) return 'medium';
  return 'low';
}

function suggestAction(feedback, topicId) {
  const text = `${feedback.hardest || ''} ${feedback.comment || ''}`;
  if (topicId === 'f4' && /切割|切拼|拼凑|长方体|转化|推导|圆柱/.test(text)) {
    return '为「圆柱的体积」补充切分圆柱、重排成近似长方体的动画，突出“底面积不变，高不变，体积=底面积×高”的转化思想。';
  }
  if (/动画|直观|演示/.test(text)) {
    return '复核对应知识点的动画是否足够直观，必要时增加中间过渡帧和文字标注。';
  }
  if (/公式|推导|怎么得来|由来/.test(text)) {
    return '补充公式来源说明，避免只给结论；用图形转化或生活例子解释。';
  }
  return '先归档为产品反馈，样本增加后再判断是否进入开发。';
}

function renderHtml(stats, token) {
  const encodedToken = encodeURIComponent(token || '');
  const agentUrl = `?token=${encodedToken}&format=agent`;
  const jsonUrl = `?token=${encodedToken}`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>GeoGenius 数据面板</title>
 <style>
  body{margin:0;background:#f7f5f0;color:#1a1814;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;}
  .wrap{max-width:1080px;margin:0 auto;padding:24px 16px 48px;}
  h1{font-size:24px;margin:0 0 6px;}
  .sub{color:#777;font-size:13px;margin-bottom:18px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px;}
  .card{background:#fff;border:1px solid #e4e0d8;border-radius:12px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.04);}
  .metric{font-size:28px;font-weight:700;color:#1a5fa8;margin-top:4px;}
  .label{font-size:13px;color:#777;}
  .section{margin-top:16px;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th,td{padding:10px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top;}
  th{color:#777;font-weight:600;background:#fafafa;}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#e8f1fb;color:#0d3f6e;font-size:12px;margin:2px 4px 2px 0;}
  .warn{background:#fef0dc;color:#6a3a00;}
  .high{background:#fdeaea;color:#9b1c1c;}
  .medium{background:#fef0dc;color:#6a3a00;}
  .low{background:#eaf6dc;color:#204808;}
  .feedback{display:grid;gap:10px;}
  .fb-head{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;}
  .comment{line-height:1.7;white-space:pre-wrap;}
  .muted{color:#888;font-size:12px;}
  .actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px;}
  .btn{display:inline-block;text-decoration:none;color:#1a5fa8;background:#fff;border:1px solid #c7d7ee;border-radius:8px;padding:8px 12px;font-size:13px;}
  code{background:#f2f2f2;border-radius:4px;padding:1px 4px;}
 </style>
</head>
<body>
 <main class="wrap">
  <h1>GeoGenius 数据面板</h1>
  <div class="sub">生成时间：${escapeHtml(formatChinaTime(stats.generatedAt))} · 默认 JSON 仍保留；本页用于人工判断，agent 接口用于生成待办草案。</div>
  <div class="actions">
   <a class="btn" href="${escapeHtml(jsonUrl)}">JSON 接口</a>
   <a class="btn" href="${escapeHtml(agentUrl)}">Agent 分析接口</a>
  </div>
  <section class="grid">
   <div class="card"><div class="label">今日访问 UV</div><div class="metric">${stats.overview.uvToday}</div></div>
   <div class="card"><div class="label">平均评分</div><div class="metric">${stats.overview.avgRating}</div></div>
   <div class="card"><div class="label">评分数量</div><div class="metric">${stats.overview.ratingCount}</div></div>
  </section>
  <section class="card section">
   <h2>Agent 建议</h2>
   <p class="muted">${escapeHtml(stats.agentAnalysis.summary)}</p>
   ${renderRecommendations(stats.agentAnalysis.recommendations)}
  </section>
  <section class="card section">
   <h2>最难知识点</h2>
   ${renderHardestTable(stats.hardestTopics)}
  </section>
  <section class="card section">
   <h2>热门知识点</h2>
   ${renderPopularTable(stats.popularTopics)}
  </section>
  <section class="card section">
   <h2>最近反馈</h2>
   ${renderFeedbacks(stats.recentFeedbacks)}
  </section>
 </main>
</body>
</html>`;
}

function renderRecommendations(items) {
  if (!items.length) return '<p class="muted">暂无明确建议。</p>';
  return `<table><thead><tr><th>优先级</th><th>来源</th><th>知识点</th><th>原因</th><th>建议动作</th></tr></thead><tbody>${items.map((item) => `
   <tr>
    <td><span class="pill ${escapeHtml(item.priority)}">${priorityText(item.priority)}</span></td>
    <td>${escapeHtml(item.source)}</td>
    <td>${escapeHtml(item.topicName || item.topicId || '-')}</td>
    <td>${escapeHtml(item.reason || '-')}</td>
    <td>${escapeHtml(item.suggestedAction || '-')}</td>
   </tr>`).join('')}</tbody></table>`;
}

function renderHardestTable(items) {
  if (!items.length) return '<p class="muted">暂无练习数据。</p>';
  return `<table><thead><tr><th>知识点</th><th>正确率</th><th>答题</th><th>样本判断</th></tr></thead><tbody>${items.map((item) => `
   <tr>
    <td><strong>${escapeHtml(item.displayName)}</strong><br><span class="muted">${escapeHtml(item.sub)}</span></td>
    <td>${item.accuracy ?? '-'}%</td>
    <td>${item.correct}/${item.total}</td>
    <td><span class="pill ${item.sampleLevel === 'low' ? 'warn' : ''}">${sampleText(item.sampleLevel)}</span></td>
   </tr>`).join('')}</tbody></table>`;
}

function renderPopularTable(items) {
  if (!items.length) return '<p class="muted">暂无完成数据。</p>';
  return `<table><thead><tr><th>知识点</th><th>完成次数</th></tr></thead><tbody>${items.map((item) => `
   <tr>
    <td><strong>${escapeHtml(item.displayName)}</strong><br><span class="muted">${escapeHtml(item.sub)}</span></td>
    <td>${item.count}</td>
   </tr>`).join('')}</tbody></table>`;
}

function renderFeedbacks(items) {
  if (!items.length) return '<p class="muted">暂无反馈。</p>';
  return `<div class="feedback">${items.map((item) => `
   <article class="card">
    <div class="fb-head">
     <span class="pill">${escapeHtml(item.grade || '未知身份')}</span>
     <span class="pill">${escapeHtml(String(item.rating || '?'))} 星</span>
     ${item.inferredTopicName ? `<span class="pill warn">${escapeHtml(item.inferredTopicName)}</span>` : ''}
     ${(item.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('')}
    </div>
    <div class="comment">${escapeHtml(item.comment || item.hardest || '未填写文字建议')}</div>
    <div class="muted">时间：${escapeHtml(item.localTime)} · 设备：${escapeHtml(item.device)}</div>
   </article>`).join('')}</div>`;
}

function toLegacyQuizStat(item) {
  return {
    topicId: item.topicId,
    total: item.total,
    correct: item.correct,
    accuracy: item.accuracy,
  };
}

function toLegacyCompleteStat(item) {
  return {
    topicId: item.topicId,
    count: item.count,
  };
}

function toLegacyFeedback(item) {
  return {
    grade: item.grade,
    rating: item.rating,
    hardest: item.hardest,
    comment: item.comment,
    ts: item.ts,
    ua: item.ua,
  };
}

function getSampleLevel(total) {
  if (total >= 50) return 'high';
  if (total >= 20) return 'medium';
  return 'low';
}

function sampleText(level) {
  return {
    high: '样本充足',
    medium: '样本可参考',
    low: '样本较少',
  }[level] || '未知';
}

function priorityRank(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] || 0;
}

function priorityText(priority) {
  return { high: '高', medium: '中', low: '低' }[priority] || priority;
}

function simplifyUserAgent(ua) {
  if (!ua) return '未知设备';
  const device = /iPhone/i.test(ua) ? 'iPhone'
    : /iPad/i.test(ua) ? 'iPad'
    : /Android/i.test(ua) ? 'Android'
    : /Macintosh/i.test(ua) ? 'Mac'
    : /Windows/i.test(ua) ? 'Windows'
    : '其他设备';
  const browser = /MicroMessenger/i.test(ua) ? '微信'
    : /Edg/i.test(ua) ? 'Edge'
    : /Chrome/i.test(ua) ? 'Chrome'
    : /Safari/i.test(ua) ? 'Safari'
    : '浏览器';
  return `${device} / ${browser}`;
}

function formatChinaTime(ts) {
  if (!ts) return '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch (_) {
    return ts;
  }
}

function getChinaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
