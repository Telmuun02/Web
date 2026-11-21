/**
 * iconv-lite-ийн Cloudflare Workers-д зориулсан орлуулга (wrangler.jsonc → alias)
 * Express-ийн body-parser, raw-body нь хүсэлтийн body-г текст болгоход iconv-lite ашигладаг.
 * Жинхэнэ iconv-lite@0.4 Workers дээр ачаалагдахгүй (browser талбараас болж streams модуль хоосон болдог),
 * тиймээс Workers-д суурилсан TextDecoder-оор ижил функцуудыг гүйцэтгэнэ. Компьютер дээр (Node) ашиглагдахгүй.
 *
 * encodingExists(enc) - кодлол дэмжигдэх эсэх
 * decode(buf, enc) - Buffer → текст
 * getDecoder(enc) - хэсэгчлэн уншигч { write(buf), end() }
 * encode(str) - текст → Buffer (UTF-8)
 */

function encodingExists(enc) {
  try {
    new TextDecoder(enc);
    return true;
  } catch (err) {
    return false;
  }
}

function decode(buf, enc) {
  return new TextDecoder(enc).decode(buf);
}

function getDecoder(enc) {
  var decoder = new TextDecoder(enc);
  return {
    write: function (buf) {
      return decoder.decode(buf, { stream: true });
    },
    end: function () {
      return decoder.decode();
    },
  };
}

function encode(str) {
  return Buffer.from(String(str), 'utf8');
}

module.exports = { encodingExists, decode, getDecoder, encode };
