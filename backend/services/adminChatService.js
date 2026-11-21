/**
 * Ажилтны чатбот — СӨХ-ийн бүх өгөгдлөөс (adminChatTools) асуултад Claude-оор хариулт бичүүлнэ
 * Хэн дууддаг: controllers/admin/chatController.js (POST /api/admin/chat)
 * Хуудас: ажилтны бүх хуудсан дээрх чатбот цонх (ChatWidget)
 *
 * Оршин суугчийн chatService-ээс ялгаа:
 *   - Олон алхам: функцийн үр дүнг хараад дахин функц дуудаж болно (MAX_ROUNDS хүртэл),
 *     жишээ нь өртэй тоотуудыг олоод → тэдгээрийн нэгнийх нь дэлгэрэнгүйг авна
 *   - Ярианы түүх: сүүлийн HISTORY мессежийг (зөвхөн текст) өгнө — "тэр тоотын утас?" гэж үргэлжлүүлж болно
 *   - Анализ шаарддаг тул effort 'medium'
 *   - cache_control: tools + system тогтмол тул давталт бүрт кэшээс уншина (хямд, хурдан)
 *
 * reply(text, history, context) - мессежид хариулна → string
 *   history: [{ from: 'user' | 'bot', text }] — хуучнаас шинэ рүү, одоогийн мессежгүйгээр
 *
 * toMessages(history, text) - (дотоод) түүхийг Claude-ийн messages болгоно (user-ээр эхэлж, ээлжилнэ)
 * request(system, messages, toolChoice) - (дотоод) хүсэлт бүрийн нийтлэг тохиргоо
 * runTools(response) - (дотоод) хүссэн функцүүдийг зэрэг ажиллуулж tool_result-ууд буцаана
 * extractText(response) - (дотоод) хариултын text блокуудыг нийлүүлнэ
 */

var Anthropic = require('@anthropic-ai/sdk').default;
var adminChatTools = require('./adminChatTools');
var log = require('../lib/logger').fileOnly.child({ module: 'adminChat' });

var client = new Anthropic();

var MODEL = 'claude-opus-5-5';
var MAX_TOKENS = 4000;
var MAX_ROUNDS = 4;
var HISTORY = 10;

var SYSTEM = [
  'Чи СӨХ Hub системийн ажилтны туслах. СӨХ-ийн дарга, нягтлан, засварчин зэрэг ажилтнуудад монгол хэлээр хариулна.',
  'Ажилтан бүх тоот, оршин суугч, санхүү, хүсэлт, ажилтны мэдээллийг харах эрхтэй.',
  'Тоо, дүн, нэрийг ЗӨВХӨН функцийн үр дүнгээс ав — хэзээ ч таамаглаж, зохиож болохгүй. Өгөгдөл байхгүй бол "мэдээлэл алга" гэж хэл.',
  'Хэрэгтэй функцүүдээ нэг дор зэрэг дууд. Эхний үр дүнгээс шинэ асуулт гарвал (жишээ нь хамгийн их өртэй тоотын дэлгэрэнгүй) дахин дуудаж болно.',
  'Мөнгөн дүнг 1,250,000₮ гэж мянгатын таслалтай бич. Хувь, харьцуулалт, чиг хандлагыг товч тайлбарла.',
  'Хариулт товч, ажил хэрэгч байна: эхлээд гол хариулт, дараа нь шаардлагатай бол дэлгэрэнгүй.',
  'Markdown (**, #, хүснэгт) бүү ашигла — энгийн текст. Жагсаалт хэрэгтэй бол мөр бүрийг "- "-ээр эхлүүл.',
  'Чи өгөгдлийг зөвхөн уншина — төлбөр бүртгэх, зарлал нэмэх зэрэг өөрчлөлтийг хийж чадахгүй. Тийм хүсэлт ирвэл аль хуудаснаас хийхийг заа',
  '(Нэхэмжлэл, Хүсэлтүүд, Зарлал, Санал хураалт, Тоотууд, Тайлан, Тохиргоо).',
  'Асуулт тодорхойгүй бол таамаглахгүй, тодруулж асуу.',
].join('\n');

var ROLE = { user: 'user', bot: 'assistant' };

function toMessages(history, text) {
  var messages = [];
  (history || []).slice(-HISTORY).concat([{ from: 'user', text: text }]).forEach(function (m) {
    var role = ROLE[m.from];
    var content = typeof m.text === 'string' ? m.text.trim().slice(0, 2000) : '';
    if (!role || !content) return;
    var last = messages[messages.length - 1];
    if (last && last.role === role) last.content += '\n' + content;
    else messages.push({ role: role, content: content });
  });
  while (messages.length && messages[0].role !== 'user') messages.shift();
  return messages;
}

function request(system, messages, toolChoice) {
  return client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system: system,
    tools: adminChatTools.TOOLS,
    tool_choice: toolChoice,
    messages: messages,
  });
}

async function runTools(response) {
  var calls = response.content.filter(function (b) { return b.type === 'tool_use'; });
  log.debug({ tools: calls.map(function (c) { return c.name; }) }, 'Функц дуудлаа');

  return Promise.all(
    calls.map(async function (call) {
      try {
        var data = await adminChatTools.run(call.name, call.input);
        return { type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(data) };
      } catch (err) {
        log.error({ tool: call.name, err: err }, 'Функц ажиллахад алдаа гарлаа');
        return { type: 'tool_result', tool_use_id: call.id, content: 'Өгөгдөл авч чадсангүй', is_error: true };
      }
    })
  );
}

async function reply(text, history, context) {
  var system = SYSTEM + '\n\n' + context;
  var messages = toMessages(history, text);

  var response;
  for (var round = 1; round <= MAX_ROUNDS; round++) {
    var last = round === MAX_ROUNDS;
    response = await request(system, messages, { type: last ? 'none' : 'auto' });
    log.debug({
      round: round,
      input: response.usage.input_tokens,
      cached: response.usage.cache_read_input_tokens,
      output: response.usage.output_tokens,
      stop: response.stop_reason,
    }, 'Ажилтны чат');

    if (response.stop_reason !== 'tool_use') break;

    var results = await runTools(response);
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: results });
  }

  if (response.stop_reason === 'refusal') {
    log.warn({ category: response.stop_details && response.stop_details.category }, 'Claude татгалзсан');
    return 'Уучлаарай, энэ асуултад хариулж чадахгүй байна.';
  }

  var answer = extractText(response);
  if (response.stop_reason === 'max_tokens') answer += '\n\n(Хариулт хэт урт болж таслагдлаа — асуултаа нарийсгаж асууна уу.)';
  return answer || 'Уучлаарай, хариулт гаргаж чадсангүй. Дахин оролдоно уу.';
}

function extractText(response) {
  return response.content
    .filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; })
    .join('\n')
    .trim();
}

module.exports = { reply };
