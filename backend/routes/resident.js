var express = require('express');

// Оршин суугчийн API — /api/resident/...
// auth болон requireRole('user')-ийг api.js-д нэг удаа тавьсан.
// Controller-ууд controllers/resident/ дотор байна. Хэрэглэгчийг ҮРГЭЛЖ req.user-аас авна —
// frontend-ээс ирсэн unit_id, user_id-д итгэхгүй (өөр айлын мэдээллийг авах гэж оролдож болно)
var router = express.Router();

// Энд оршин суугчийн route-ууд нэмэгдэнэ (жишээ нь router.get('/home', homeController.show))

module.exports = router;
