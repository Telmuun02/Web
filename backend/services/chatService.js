var Anthropic = require('@anthropic-ai/sdk').default;
var chatTools = require('./chatTools');
var log = require('../lib/logger').fileOnly.child({ module: 'chat' });

// API түлхүүрийг .env-ийн ANTHROPIC_API_KEY-ээс автоматаар уншина.
// Түр алдаа (429, 5xx, сүлжээ) гарвал SDK өөрөө 2 удаа дахин оролдоно
var client = new Anthropic();

var MODEL = 'claude-opus-5-5';
var MAX_TOKENS = 2000;

var SYSTEM = [
  'Чи СӨХ Hub системийн туслах. Орон сууцны оршин суугчдад монгол хэлээр, товч, эелдэг хариулна.',
  'Төлбөр, нэхэмжлэл, санал хүсэлт, зарлал, санал хураалт, хурал, камерын талаар тусална.',
  'Мэдэхгүй зүйлээ зохиож болохгүй — СӨХ-ийн ажилтанд хандахыг зөвлө.',
  'Бусад айлын мэдээллийг хэзээ ч бүү өг.',
  // Чатын цонх энгийн текст харуулдаг — **тод**, # гарчиг гэх мэт тэмдэгт шууд харагдана
  'Markdown (**, #, хүснэгт) бүү ашигла — энгийн текст бич. Жагсаалт хэрэгтэй бол мөр бүрийг "- "-ээр эхлүүл.',
  // Түүх илгээдэггүй тул мессеж бүр бие даасан — өмнөх яриаг таамаглахгүй
  'Чамд өмнөх ярианы түүх ирдэггүй — мессеж бүрийг тусад нь хүлээн авна.',
  'Асуулт өмнөх ярианд хамаарч байвал ("тэр", "дээрх", "дахиад" гэх мэт) эсвэл утга нь тодорхойгүй бол',
  'таамаглаж хариулахгүй, юуг асууж байгааг тодруулж бичихийг эелдгээр хүс.',
  'Жишээ: "Уучлаарай, асуултаа арай тодорхой бичнэ үү? Жишээ нь: энэ сарын төлбөр хэд вэ?"',
  // Функц дуудах эргэлт ганцхан — дараа нь дахин дуудах боломжгүй
  'Төлбөр, хүсэлт, зарлал, санал хураалтын өгөгдөл хэрэгтэй бол функц дууд.',
  'Функцээ зөвхөн НЭГ удаа дуудах боломжтой: хэрэгтэй БҮХ функцээ нэг дор зэрэг дууд.',
  'Өгөгдөл шаардлагагүй асуултад (мэндчилгээ г.м.) функц бүү дууд.',
].join('\n');

// Хоёр хүсэлтэд ижил тохиргоо
function request(system, messages, toolChoice) {
  return client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: 'low' }, // энгийн чат — хурдан, хямд
    // Claude аюулгүй байдлын шалтгаанаар татгалзвал өөр загвар руу автоматаар шилжинэ
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: system,
    tools: chatTools.TOOLS,
    tool_choice: toolChoice,
    messages: messages,
  });
}

/**
 * reply -- Оршин суугчийн НЭГ мессежид Claude-оор хариулт бичүүлнэ (түүхгүй — зардал хэмнэнэ)
 *   text:    string — оршин суугчийн одоогийн мессеж
 *   context: string — оршин суугчийн үндсэн мэдээлэл (нэр, тоот)
 *   me:      { user, unit } — функцүүд өгөгдлөө үүгээр авна (token-оос олсон хэрэглэгч)
 *   → string (хариултын текст)
 *
 * Хамгийн ихдээ 2 хүсэлт:
 *   1. tool_choice 'auto' — Claude шууд хариулна, эсвэл хэрэгтэй функцүүдээ НЭГ дор хүснэ
 *   2. функцүүдийг нэг удаа ажиллуулж үр дүнг өгнө, tool_choice 'none' — дахин функц дуудаж
 *      чадахгүй, заавал эцсийн хариугаа бичнэ
 */
async function reply(text, context, me) {
  var system = SYSTEM + '\n\nОдоо ярьж буй оршин суугч:\n' + context;
  var messages = [{ role: 'user', content: text }];

  // 1-р хүсэлт — функцүүдийн жагсаалттай
  var response = await request(system, messages, { type: 'auto' });
  logUsage(response, 1);

  if (response.stop_reason === 'tool_use') {
    var calls = response.content.filter(function (b) { return b.type === 'tool_use'; });

    // Хүссэн бүх функцийг зэрэг ажиллуулна. Алдаа гарвал Claude-д is_error-оор хэлнэ
    var results = await Promise.all(
      calls.map(async function (call) {
        try {
          var data = await chatTools.run(call.name, me, call.input);
          return { type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(data) };
        } catch (err) {
          log.error({ tool: call.name, err: err }, 'Функц ажиллахад алдаа гарлаа');
          return { type: 'tool_result', tool_use_id: call.id, content: 'Өгөгдөл авч чадсангүй', is_error: true };
        }
      })
    );
    log.debug({ tools: calls.map(function (c) { return c.name; }) }, 'Функц дуудлаа');

    // Claude-ийн хариуг (thinking, tool_use блокуудтай нь) өөрчлөлгүй буцааж, бүх үр дүнг НЭГ мессежээр өгнө
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: results });

    // 2-р хүсэлт — 'none': функц дахин дуудахгүй, зөвхөн хариулна
    response = await request(system, messages, { type: 'none' });
    logUsage(response, 2);
  }

  if (response.stop_reason === 'refusal') {
    log.warn({ category: response.stop_details && response.stop_details.category }, 'Claude татгалзсан');
    return 'Уучлаарай, энэ асуултад хариулж чадахгүй байна.';
  }

  return extractText(response) || 'Уучлаарай, хариулт гаргаж чадсангүй. Дахин оролдоно уу.';
}

function logUsage(response, step) {
  log.debug(
    { step: step, input: response.usage.input_tokens, output: response.usage.output_tokens, stop: response.stop_reason },
    'Чатын хариулт'
  );
}

// Хариулт хэд хэдэн блоктой ирж болно (thinking, text гэх мэт) — зөвхөн text-үүдийг нийлүүлнэ
function extractText(response) {
  return response.content
    .filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; })
    .join('\n')
    .trim();
}

module.exports = { reply };
