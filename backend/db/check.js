// Холболт шалгах: npm run db:check
var db = require('./index');

db.raw('SELECT VERSION() AS version, DATABASE() AS db')
  .then(function (result) {
    var row = result[0][0];
    console.log('MySQL холбогдлоо — хувилбар ' + row.version + ', database: ' + row.db);
  })
  .catch(function (err) {
    console.error('Холбогдож чадсангүй: ' + err.code + ' — ' + err.message);
    process.exitCode = 1;
  })
  .finally(function () {
    db.destroy();
  });
