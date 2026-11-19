/**
 * Чатбот - оршин суугчийн мессежид Claude-оор хариулт бичүүлнэ
 * Хэн дууддаг: controllers/user/chatController.js (POST /api/resident/chat)
 * Хуудас: оршин суугчийн бүх хуудсан дээрх чатбот цонх (ChatWidget)
 *
 * reply(text, context, me) - НЭГ мессежид хариулна (түүхгүй, зардал хэмнэнэ) → string
 *   Хамгийн ихдээ 2 хүсэлт:
 *     1. tool_choice 'auto' - шууд хариулна, эсвэл хэрэгтэй функцүүдээ (chatTools) нэг дор хүснэ
 *     2. функцүүдийн үр дүнг өгч tool_choice 'none' - заавал эцсийн хариугаа бичнэ
 *
 * request(system, messages, toolChoice) - (дотоод) хоёр хүсэлтийн нийтлэг тохиргоо
 * logUsage(response, step) - (дотоод) токены хэрэглээг логлоно
 * extractText(response) - (дотоод) хариултын text блокуудыг нийлүүлнэ
 */

var Anthropic = require('@anthropic-ai/sdk').default;
var chatTools = require('./chatTools');
var log = require('../lib/logger').fileOnly.child({ module: 'chat' });

var client = new Anthropic();

var MODEL = 'claude-opus-5-5';
var MAX_TOKENS = 2000;

var SYSTEM = [
  'Чи СӨХ Hub системийн туслах. Орон сууцны оршин суугчдад монгол хэлээр, товч, эелдэг хариулна.',
  'Төлбөр, нэхэмжлэл, санал хүсэлт, зарлал, санал хураалт, хурал, камерын талаар тусална.',
  'Мэдэхгүй зүйлээ зохиож болохгүй — СӨХ-ийн ажилтанд хандахыг зөвлө.',
  'Бусад айлын мэдээллийг хэзээ ч бүү өг.',
  'Markdown (**, #, хүснэгт) бүү ашигла — энгийн текст бич. Жагсаалт хэрэгтэй бол мөр бүрийг "- "-ээр эхлүүл.',
  'Чамд өмнөх ярианы түүх ирдэггүй — мессеж бүрийг тусад нь хүлээн авна.',
  'Асуулт өмнөх ярианд хамаарч байвал ("тэр", "дээрх", "дахиад" гэх мэт) эсвэл утга нь тодорхойгүй бол',
  'таамаглаж хариулахгүй, юуг асууж байгааг тодруулж бичихийг эелдгээр хүс.',
  'Жишээ: "Уучлаарай, асуултаа арай тодорхой бичнэ үү? Жишээ нь: энэ сарын төлбөр хэд вэ?"',
  'Төлбөр, хүсэлт, зарлал, санал хураалтын өгөгдөл хэрэгтэй бол функц дууд.',
  'Функцээ зөвхөн НЭГ удаа дуудах боломжтой: хэрэгтэй БҮХ функцээ нэг дор зэрэг дууд.',
  'Өгөгдөл шаардлагагүй асуултад (мэндчилгээ г.м.) функц бүү дууд.',
].join('\n');

function request(system, messages, toolChoice) {
  return client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: system,
    tools: chatTools.TOOLS,
    tool_choice: toolChoice,
    messages: messages,
  });
}

async function reply(text, context, me) {
  var system = SYSTEM + '\n\nОдоо ярьж буй оршин суугч:\n' + context;
  var messages = [{ role: 'user', content: text }];

  var response = await request(system, messages, { type: 'auto' });
  logUsage(response, 1);

  if (response.stop_reason === 'tool_use') {
    var calls = response.content.filter(function (b) { return b.type === 'tool_use'; });

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

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: results });

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

function extractText(response) {
  return response.content
    .filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; })
    .join('\n')
    .trim();
}

module.exports = { reply };
