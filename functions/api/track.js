// Cloudflare Pages Function - 匿名使用数据收集
// KV 命名空间：GEO_STATS（需在 CF Pages 设置里绑定）

export async function onRequestPost(context) {
  const { request, env } = context;

  // 跨域支持
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const { event, topicId, grade, correct } = body;

    // 只接受合法事件类型
    const allowedEvents = ['topic_complete', 'quiz_answer', 'topic_view'];
    if (!allowedEvents.includes(event)) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers: corsHeaders });
    }

    const kv = env.GEO_STATS;
    if (!kv) {
      // KV 未绑定时静默成功，不影响前端
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // ── 1. 累计计数：event:topicId ──
    const countKey = `count:${event}:${topicId}`;
    const prev = parseInt((await kv.get(countKey)) || '0');
    await kv.put(countKey, String(prev + 1));

    // ── 2. 练习题答题准确率 ──
    if (event === 'quiz_answer' && topicId) {
      const totalKey = `quiz_total:${topicId}`;
      const correctKey = `quiz_correct:${topicId}`;
      const t = parseInt((await kv.get(totalKey)) || '0');
      const c = parseInt((await kv.get(correctKey)) || '0');
      await kv.put(totalKey, String(t + 1));
      if (correct) await kv.put(correctKey, String(c + 1));
    }

    // ── 3. 每日活跃数（UV 用 IP hash 近似）──
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(ip, today);
    const uvKey = `uv:${today}`;
    const uvSet = JSON.parse((await kv.get(uvKey)) || '[]');
    if (!uvSet.includes(ipHash)) {
      uvSet.push(ipHash);
      await kv.put(uvKey, JSON.stringify(uvSet), { expirationTtl: 60 * 60 * 24 * 30 }); // 保留30天
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (e) {
    // 埋点失败不影响用户，静默返回
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// IP 单向 hash，不存原始 IP
async function hashIP(ip, salt) {
  const data = new TextEncoder().encode(ip + salt);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
