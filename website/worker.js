// ═══════════════════════════════════════════════════
//  DinoDeutsch — Cloudflare Worker
//  Proxy Anthropic API + Memory với Supabase
//
//  Secrets cần set trong Worker (wrangler secret put):
//    ANTHROPIC_API_KEY
//    SUPABASE_URL
//    SUPABASE_ANON_KEY
// ═══════════════════════════════════════════════════

const ALLOWED_ORIGIN = 'https://dinodeutsch.pages.dev';

const CORS = {
  'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// ── System prompt gốc ──
const BASE_SYSTEM = `Bạn là KI Tutor của DinoDeutsch — chuyên gia dạy tiếng Đức cho người Việt.

PHONG CÁCH: Ấm áp, kiên nhẫn, khuyến khích. Dạy bằng tiếng Việt, dùng tiếng Đức cho ví dụ.

QUY TẮC:
- Từ vựng: LUÔN kèm giới từ der/die/das
- Ngữ pháp: Quy tắc → Cấu trúc → Ví dụ → Lưu ý → Mẹo nhớ
- Từ vựng: bảng có cột Từ | Giới từ | Phiên âm | Nghĩa | Ví dụ
- Hội thoại: đóng vai bằng tiếng Đức, sửa lỗi sau mỗi lượt
- Tối đa 250 từ mỗi câu trả lời

SAU MỖI CÂU TRẢ LỜI, thêm một dòng JSON ở cuối (học viên không thấy) theo định dạng:
<!--MEMORY:{"weak":[],"strong":[],"errors":[],"words":0,"notes":""}-->

Trong đó:
- weak: mảng chủ đề học viên còn yếu (dựa vào câu hỏi/lỗi vừa rồi)
- strong: mảng chủ đề học viên làm tốt
- errors: mảng lỗi cụ thể vừa mắc (chuỗi mô tả ngắn)
- words: số từ mới vừa học trong lượt này (0 nếu không học từ)
- notes: ghi chú ngắn về học viên (để trống nếu không có gì đặc biệt)`;

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    try {
      const body = await request.json();
      const { messages, topic, userId, supabaseToken } = body;

      // ── Load memory từ Supabase (nếu có user) ──
      let memoryContext = '';
      let memory = null;

      if (userId && supabaseToken) {
        memory = await loadMemory(env, userId, supabaseToken);
        if (memory) {
          memoryContext = buildMemoryPrompt(memory);
        }
      }

      // ── Gọi Anthropic API ──
      const systemPrompt = BASE_SYSTEM + (memoryContext ? '\n\n' + memoryContext : '');

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'x-api-key':       env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system:     systemPrompt,
          messages,
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error?.message || 'Anthropic API error');

      let replyText = aiData.content?.[0]?.text || '';

      // ── Parse memory tag từ reply ──
      let memoryUpdate = null;
      const memMatch = replyText.match(/<!--MEMORY:(.*?)-->/s);
      if (memMatch) {
        try {
          memoryUpdate = JSON.parse(memMatch[1]);
        } catch (_) {}
        // Xóa tag khỏi text hiển thị
        replyText = replyText.replace(/<!--MEMORY:.*?-->/s, '').trim();
      }

      // ── Lưu memory vào Supabase ──
      if (userId && supabaseToken && memoryUpdate) {
        await saveMemory(env, userId, supabaseToken, memoryUpdate);
      }

      // ── Lưu tin nhắn vào chat_messages ──
      if (userId && supabaseToken) {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        await saveMessages(env, userId, supabaseToken, [
          { role: 'user',      content: lastUserMsg?.content || '', topic },
          { role: 'assistant', content: replyText, topic, xp_gained: 10 },
        ]);
      }

      return new Response(JSON.stringify({
        reply: replyText,
        memoryUpdate,
        memory: memory ? { level: memory.level, xp: memory.xp } : null,
      }), { headers: CORS });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: CORS,
      });
    }
  }
};

// ── Helpers ──

function buildMemoryPrompt(m) {
  const parts = [`HỒ SƠ HỌC VIÊN (dùng để cá nhân hóa cách dạy):`];
  parts.push(`- Cấp độ hiện tại: ${m.level}`);
  parts.push(`- Tổng XP: ${m.xp} · Số từ đã học: ${m.learned_words}`);
  if (m.weak_topics?.length)   parts.push(`- Điểm YẾU cần chú ý: ${m.weak_topics.join(', ')}`);
  if (m.strong_topics?.length) parts.push(`- Điểm MẠNH: ${m.strong_topics.join(', ')}`);
  if (m.common_errors?.length) parts.push(`- Lỗi hay mắc: ${m.common_errors.join('; ')}`);
  if (m.notes)                 parts.push(`- Ghi chú: ${m.notes}`);
  parts.push(`\nHãy điều chỉnh cách dạy dựa trên hồ sơ này — nhắc lại điểm yếu khi liên quan, khen ngợi điểm mạnh.`);
  return parts.join('\n');
}

async function loadMemory(env, userId, token) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/user_memory?user_id=eq.${userId}&select=*&limit=1`,
    { headers: supabaseHeaders(env, token) }
  );
  const rows = await res.json();
  return rows?.[0] || null;
}

async function saveMemory(env, userId, token, update) {
  const { weak, strong, errors, words, notes } = update;
  await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/upsert_memory`, {
    method: 'POST',
    headers: { ...supabaseHeaders(env, token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_user_id:   userId,
      p_xp_add:    10,
      p_weak:      weak?.length   ? weak   : null,
      p_strong:    strong?.length ? strong : null,
      p_errors:    errors?.length ? errors : null,
      p_notes:     notes || null,
      p_words_add: words || 0,
    }),
  });
}

async function saveMessages(env, userId, token, msgs) {
  const rows = msgs.map(m => ({ user_id: userId, ...m }));
  await fetch(`${env.SUPABASE_URL}/rest/v1/chat_messages`, {
    method: 'POST',
    headers: { ...supabaseHeaders(env, token), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(rows),
  });
}

function supabaseHeaders(env, token) {
  return {
    'apikey':        env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
  };
}
