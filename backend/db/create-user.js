// Хэрэглэгч нэмэх / нууц үгийг нь шинэчлэх:
//   npm run user:create -- --email a@b.mn --name "Нэр" [--role admin] [--position chairman] [--unit 1-12] [--phone 99112233] [--password ...]
// --role admin     — ажилтан (admins хүснэгт). --position: chairman, accountant, technician, staff
// --role user      — оршин суугч (users хүснэгт, анхдагч). --unit 1-12 — тоотод холбоно (нэвтрэхэд хэрэгтэй)
// Байрандаа амьдардаг ажилтан хоёр тусдаа бүртгэлтэй: нэг удаа --role admin, нэг удаа --role user
// --password өгөхгүй бол санамсаргүй нууц үг үүсгээд нэг удаа хэвлэнэ.
// Тухайн хүснэгтэд ийм имэйлтэй хүн байвал мэдээллийг нь шинэчилнэ.
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var db = require('./index');

var BCRYPT_ROUNDS = 12;

function parseArgs(argv) {
  var args = {};
  for (var i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

function randomPassword() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(14), function (b) { return chars[b % chars.length]; }).join('');
}

async function main() {
  var args = parseArgs(process.argv.slice(2));
  if (!args.email || !args.name) {
    throw new Error('--email болон --name заавал хэрэгтэй');
  }

  var role = args.role || 'user';
  if (role !== 'admin' && role !== 'user') throw new Error("--role нь 'admin' эсвэл 'user' байна");
  var positions = ['chairman', 'accountant', 'technician', 'staff'];
  if (args.position && !positions.includes(args.position)) throw new Error('--position нь ' + positions.join(', ') + ' байна');

  var generated = !args.password;
  var password = args.password || randomPassword();
  if (password.length < 8) throw new Error('Нууц үг дор хаяж 8 тэмдэгт байна');

  var data = {
    name: args.name,
    email: args.email.toLowerCase(),
    password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
  };
  if (args.phone) data.phone = require('../lib/verify').normalizePhone(args.phone) || args.phone;
  if (role === 'admin') {
    data.position = args.position || 'staff';
  } else if (args.unit) {
    var unit = await db('units').where({ code: args.unit }).first();
    if (!unit) throw new Error(args.unit + ' тоот олдсонгүй');
    data.unit_id = unit.id;
  }

  var table = role === 'admin' ? 'admins' : 'users';
  var existing = await db(table).where({ email: data.email }).first();
  var id = existing && existing.id;
  if (existing) {
    await db(table).where({ id: id }).update({ ...data, updated_at: db.fn.now() });
  } else {
    [id] = await db(table).insert(data);
  }
  console.log((existing ? 'Шинэчиллээ: #' : 'Нэмлээ: #') + id + ' ' + data.email + ' (' + role + ')');

  if (generated) console.log('Нууц үг: ' + password + '  ← нэвтэрсний дараа сольж болно');
}

main()
  .catch(function (err) {
    console.error('Алдаа: ' + err.message);
    process.exitCode = 1;
  })
  .finally(function () {
    db.destroy();
  });
