// Cloudflare Pages Function - 学生反馈收集
// KV 命名空间：GEO_STATS

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const { grade, rating, hardest, comment } = body;

    // 简单校验
    if (!grade || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ ok: false, msg: '参数不完整' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const kv = env.GEO_STATS;
    if (!kv) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // 每条反馈存为独立条目，key = feedback:时间戳:随机数
    const key = `feedback:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
    const record = {
      grade,          // 年级，如 "五年级"
      rating,         // 1-5 星
      hardest,        // 最难的知识点 topicId，可为空
      comment,        // 文字反馈，可为空
      ts: new Date().toISOString(),
      ua: (request.headers.get('User-Agent') || '').slice(0, 80), // 设备类型参考
    };

    await kv.put(key, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365, // 保留1年
    });

    // 同时累计评分统计
    const ratingKey = `rating_total`;
    const ratingCountKey = `rating_count`;
    const total = parseFloat((await kv.get(ratingKey)) || '0');
    const count = parseInt((await kv.get(ratingCountKey)) || '0');
    await kv.put(ratingKey, String(total + rating));
    await kv.put(ratingCountKey, String(count + 1));

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, msg: e.message }), {
      status: 500, headers: corsHeaders,
    });
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
