/**
 * Өгөгдлийн сангийн алдааг таних (SQLite / D1)
 * MySQL-ийн үеийн err.code === 'ER_DUP_ENTRY'-ийн оронд
 *
 * isDuplicate(err) - UNIQUE нөхцөл зөрчигдсөн эсэх (давхар имэйл, давхар санал гэх мэт)
 */

function isDuplicate(err) {
  return /UNIQUE constraint failed/.test(String(err && err.message));
}

module.exports = { isDuplicate };
