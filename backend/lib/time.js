/**
 * Монголын цаг (UTC+8, зуны цаггүй). Workers-ийн Date үргэлж UTC тул
 * getHours(), getDate() шууд ашиглахгүй — эдгээр функцээр дамжина.
 * Өгөгдлийн санд огноо-цагийг Монголын цагаар 'YYYY-MM-DD HH:MM:SS' текстээр хадгална.
 *
 * shifted(date) - (дотоод) UTC талбарууд нь Монголын цагийг заах Date
 * ymd(date) - 'YYYY-MM-DD', анхдагч нь өнөөдөр
 * monthStart(monthsAgo) - n сарын өмнөх сарын 1-ний 'YYYY-MM-01'
 * monthStartDate() - энэ сарын 1-ний 00:00 (Date)
 * hour() - одоогийн цаг (0-23)
 * toDb(date) - Date → 'YYYY-MM-DD HH:MM:SS' (Монголын цаг)
 * fromDb(text) - 'YYYY-MM-DD HH:MM:SS' → ISO UTC текст ('...Z')
 * parseLocal(text) - '2026-11-25T18:00' гэх мэт цагийн бүсгүй утгыг Монголын цагаар уншина
 */

var OFFSET_MS = 8 * 60 * 60 * 1000;

function shifted(date) {
  return new Date((date ? date.getTime() : Date.now()) + OFFSET_MS);
}

function ymd(date) {
  return shifted(date).toISOString().slice(0, 10);
}

function monthStart(monthsAgo) {
  var d = shifted();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - (monthsAgo || 0));
  return d.toISOString().slice(0, 8) + '01';
}

function monthStartDate() {
  return new Date(monthStart(0) + 'T00:00:00+08:00');
}

function hour() {
  return shifted().getUTCHours();
}

function toDb(date) {
  return shifted(date).toISOString().slice(0, 19).replace('T', ' ');
}

function fromDb(text) {
  return new Date(text.replace(' ', 'T') + '+08:00').toISOString();
}

function parseLocal(text) {
  if (typeof text !== 'string') return new Date(text);
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) return new Date(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += 'T00:00';
  return new Date(text + '+08:00');
}

module.exports = { ymd, monthStart, monthStartDate, hour, toDb, fromDb, parseLocal };
