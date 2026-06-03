// Cloudflare Pages Function - 数据查看面板（密码保护）
// 访问：/api/stats?token=你设置的密码

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  // 密码从环境变量读取，CF Pages 设置里加 STATS_TOKEN
  const validToken = env.STATS_TOKEN;
  if (!validToken || token !== validToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const kv = env.GEO_STATS;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── 汇总数据 ──
  const today = new Date().toISOString().slice(0, 10);

  // 今日 UV
  const uvToday = JSON.parse((await kv.get(`uv:${today}`)) || '[]').length;

  // 评分
  const ratingTotal = parseFloat((await kv.get('rating_total')) || '0');
  const ratingCount = parseInt((await kv.get('rating_count')) || '0');
  const avgRating = ratingCount > 0 ? (ratingTotal / ratingCount).toFixed(1) : 'N/A';

  // 所有 quiz 准确率，找出最难知识点
  const allKeys = await kv.list({ prefix: 'quiz_total:' });
  const quizStats = [];
  for (const k of allKeys.keys) {
    const topicId = k.name.replace('quiz_total:', '');
    const total = parseInt((await kv.get(k.name)) || '0');
    const correct = parseInt((await kv.get(`quiz_correct:${topicId}`)) || '0');
    const accuracy = total > 0 ? Math.round(correct / total * 100) : null;
    quizStats.push({ topicId, total, correct, accuracy });
  }
  quizStats.sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));

  // 完成次数 top 知识点
  const completeKeys = await kv.list({ prefix: 'count:topic_complete:' });
  const completeStats = [];
  for (const k of completeKeys.keys) {
    const topicId = k.name.replace('count:topic_complete:', '');
    const count = parseInt((await kv.get(k.name)) || '0');
    completeStats.push({ topicId, count });
  }
  completeStats.sort((a, b) => b.count - a.count);

  // 最近10条反馈
  const fbKeys = await kv.list({ prefix: 'feedback:', limit: 100 });
  const recentFeedbacks = [];
  for (const k of fbKeys.keys.slice(-10).reverse()) {
    const val = await kv.get(k.name);
    if (val) recentFeedbacks.push(JSON.parse(val));
  }

  const stats = {
    overview: {
      uvToday,
      avgRating,
      ratingCount,
    },
    hardestTopics: quizStats.slice(0, 5),   // 正确率最低的5个
    popularTopics: completeStats.slice(0, 5), // 完成最多的5个
    recentFeedbacks,
  };

  return new Response(JSON.stringify(stats, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
