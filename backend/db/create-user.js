// Хэрэглэгч нэмэх / нууц үгийг нь шинэчлэх:
//   npm run user:create -- --email a@b.mn --name "Нэр" --role admin [--phone 99112233] [--password ...]
// --password өгөхгүй бол санамсаргүй нууц үг үүсгээд нэг удаа хэвлэнэ.
// Ийм имэйлтэй хэрэглэгч байвал нэр, role, нууц үгийг нь шинэчилнэ.
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

  var generated = !args.password;
  var password = args.password || randomPassword();
  if (password.length < 8) throw new Error('Нууц үг дор хаяж 8 тэмдэгт байна');

  var data = {
    name: args.name,
    email: args.email.toLowerCase(),
    role: role,
    password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
  };
  if (args.phone) data.phone = args.phone;

  var existing = await db('users').where({ email: data.email }).first();
  if (existing) {
    await db('users').where({ id: existing.id }).update({ ...data, updated_at: db.fn.now() });
    console.log('Шинэчиллээ: #' + existing.id + ' ' + data.email + ' (' + role + ')');
  } else {
    var [id] = await db('users').insert(data);
    console.log('Нэмлээ: #' + id + ' ' + data.email + ' (' + role + ')');
  }

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
