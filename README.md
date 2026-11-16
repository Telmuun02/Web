# СӨХ Hub

Орон сууцны өмчлөгчдийн холбоо (СӨХ)-ны удирдлагын систем. Тоот, оршин суугч, сарын нэхэмжлэл ба төлбөр, засварын хүсэлт, зарлал, санал хураалтыг нэг дор удирдана.

Төсөл гурван хэсэгтэй:

- **backend**: REST API (Express + MySQL)
- **frontend**: вэб апп. Ажилтан `/admin/...`, оршин суугч `/...`
- **mobile**: оршин суугчдад зориулсан утасны апп (Expo)

---

## Агуулга

- [Ашигласан технологиуд](#ашигласан-технологиуд)
- [Архитектур](#архитектур)
- [Хүсэлт хэрхэн дамждаг вэ](#хүсэлт-хэрхэн-дамждаг-вэ)
- [Middleware (app.use)](#middleware-appuse)
- [Нэвтрэлт ба эрх](#нэвтрэлт-ба-эрх)
- [Хавтасны бүтэц (backend)](#хавтасны-бүтэц-backend)
- [Өгөгдлийн сан](#өгөгдлийн-сан)
- [Лог](#лог)

---

## Ашигласан технологиуд

| Хэсэг | Технологи |
| --- | --- |
| Backend | Node.js, Express 4, Knex, mysql2, bcryptjs, jsonwebtoken, pino (лог), dotenv |
| Чатбот | Anthropic SDK (Claude), Chimege (яриа → текст) |
| Өгөгдлийн сан | MySQL 8.0 (`utf8mb4`) |
| Frontend | React 19, Vite, React Router 7 |
| Mobile | React Native, Expo |

---

## Архитектур

```
Browser / Mobile
   │  fetch('/api/...')   (token: cookie эсвэл Authorization: Bearer)
   ▼
bin/www ──► app.js ──► routes/api.js ─┬─► /auth, /profile           (бүгд)
                                      ├─► /admin    ──► routes/admin.js    ──► controllers/admin/*
                                      └─► /resident ──► routes/resident.js ──► controllers/user/*
                                                                                 │
                                                       services/ (чатбот) ◄──────┤
                                                                                 ▼
                                                                           db/models/*
                                                                                 │
                                                                           db/index.js (Knex)
                                                                                 ▼
                                                                         MySQL (sukh_hub)
```

| Давхарга | Хавтас | Үүрэг | Laravel-тай харьцуулбал |
| --- | --- | --- | --- |
| Эхлэл | `bin/www` | HTTP серверийг порт дээр асаана | `public/index.php` |
| Тохиргоо | `app.js` | Middleware, `/api` холболт, алдаа барих | `bootstrap/app.php` + `Handler.php` |
| Route | `routes/` | URL → controller функц | `routes/api.php` |
| Middleware | `middleware/` | Нэвтрэлт, эрх шалгах | `app/Http/Middleware` |
| Controller | `controllers/` | Хүсэлтийг уншиж, model дуудаж, JSON буцаана | `app/Http/Controllers` |
| Service | `services/` | Гадны API (Claude, Chimege)-тай ажиллах логик | `app/Services` |
| Model | `db/models/` | Өгөгдлийн сангийн query-нууд | `app/Models` |
| Migration | `db/migrations/` | Хүснэгтийн бүтэц | `database/migrations` |
| Seed | `db/seeds/` | Туршилтын өгөгдөл | `database/seeders` |
| Лог | `lib/logger.js` | Терминал болон `logs/app.log` | `Log::` facade |

Browser өгөгдлийн сан руу хэзээ ч шууд хандахгүй. Бүх хүсэлт backend API-аар дамжина.

---

## Хүсэлт хэрхэн дамждаг вэ

Жишээ: оршин суугч өөрийн төлбөрийг харах `GET /api/resident/pay`

1. **`bin/www`**: сервер request-ийг хүлээн авч `app.js` руу өгнө.
2. **`app.js`**: morgan терминалд хэвлэж, JSON body болон cookie-г уншаад `/api`-г `routes/api.js` руу дамжуулна.
3. **`routes/api.js`**: `/resident` бүлэгт `auth` болон `requireRole('user')` хамгаалалт тавьсан.
   - `middleware/auth.js`: token-ийг шалгаад `req.user = { id, role }` болгоно. Token байхгүй бол **401**.
   - `middleware/requireRole.js`: role таарахгүй бол **403**.
4. **`routes/resident.js`**: `/pay` замыг `payController.show` руу илгээнэ.
5. **`controllers/user/payController.js`**: `helpers.currentResident(req)`-ээр хэрэглэгч болон тоотыг олоод model-ууд руу хандана.
6. **`db/models/*`**: Knex-ээр MySQL-ээс өгөгдөл авна.
7. Controller JSON хариу буцаана. Алдаа гарвал `next(err)` дуудаж, хариуг `app.js`-ийн алдааны handler өгнө.

---

## Middleware (app.use)

`app.use(...)` нь **middleware бүртгэнэ**. Request ирэх бүрт controller-т хүрэхээс өмнө эдгээр функц бичигдсэн дарааллаараа ажиллана. Laravel-ийн `Kernel.php` дахь global middleware-тэй адил санаа.

Middleware нь `(req, res, next)` гэсэн 3 параметр авдаг энгийн функц бөгөөд дараах хоёрын аль нэгийг хийнэ:
- `req`-д ямар нэг зүйл нэмээд `next()` дуудаж дараагийнх руу шилжүүлнэ,
- эсвэл `res.json(...)`-оор шууд хариу өгч урсгалыг зогсооно.

```js
app.use(function (req, res, next) {
  console.log('хүсэлт ирлээ');
  next(); // дараагийн middleware руу
});
```

### app.js дахь middleware-үүд

| Middleware | Юу хийдэг | Үгүй бол юу болох вэ |
| --- | --- | --- |
| `morgan('dev')` | Request бүрийг терминалд хэвлэнэ: `GET /api/admin/units 200 15ms`. Чатботын замуудыг алгасна | Ямар request ирснийг харахгүй |
| `express.json()` | Body-д ирсэн JSON текстийг объект болгоод `req.body`-д хийнэ | `req.body` нь `undefined` болно |
| `express.urlencoded()` | HTML form-оор ирсэн `name=Bat&age=20` өгөгдлийг `req.body` болгоно | Form-ийн өгөгдөл уншигдахгүй |
| `cookieParser()` | `Cookie: token=...` header-ийг задлаад `req.cookies.token` болгоно | `auth.js` cookie-ээс token олохгүй тул вэб дээр нэвтрэлт ажиллахгүй |
| `express.static('public')` | `public/` доторх файлуудыг шууд илгээнэ | Статик файлууд нээгдэхгүй |

### Жишээ: cookieParser → auth

1. `authController.login` нь `res.cookie('token', token)` гэж browser-т cookie хадгална.
2. Дараагийн request бүрт browser тэр cookie-г автоматаар илгээнэ.
3. `cookieParser()` түүнийг задлаад `req.cookies.token` болгоно.
4. `middleware/auth.js` тэр token-ийг уншиж JWT шалгана.

Mobile cookie биш, `Authorization: Bearer` header ашигладаг.

### Дараалал чухал

`express.json()` болон `cookieParser()` нь `app.use('/api', apiRouter)`-ээс **өмнө** байх ёстой. Үгүй бол controller ажиллах үед `req.body`, `req.cookies` бэлэн болоогүй байна. Хамгийн сүүлд 404 handler болон 4 параметртэй `(err, req, res, next)` алдааны handler ирнэ.

---

## Нэвтрэлт ба эрх

- Ажилтан (`admins` хүснэгт) болон оршин суугч (`users` хүснэгт) **тусдаа хүснэгтэд** хадгалагдана.
- `POST /api/auth/login` нь `{ login, password, as }` хүлээж авна. `as` нь `'admin'` эсвэл `'user'`, `login` нь имэйл эсвэл утас.
- Амжилттай нэвтэрвэл JWT (`{ id, role }`) үүсгэнэ. Вэб дээр `httpOnly` cookie-д хадгална, mobile Bearer header-ээр илгээнэ.
- Ажлаас гарсан ажилтан (`active = false`) болон тоотгүй оршин суугч нэвтэрч чадахгүй.
- Хамгаалалтыг `routes/api.js`-д бүлэг бүрд **нэг удаа** тавьсан тул `/admin` эсвэл `/resident` дотор шинээр нэмсэн route бүр автоматаар хамгаалагдана.
- Оршин суугчийн controller-ууд хэрэглэгчийг **үргэлж** `req.user`-аас авна. Frontend-ээс ирсэн `user_id`, `unit_id`-д итгэхгүй.

---

## Хавтасны бүтэц (backend)

```
backend/
├── bin/www                  # Серверийг асаана, барьж аваагүй алдааг логлоно
├── app.js                   # Express тохиргоо, /api холболт, 404, алдаа барих
│
├── routes/
│   ├── api.js               # Эх route: /auth, /profile, /admin, /resident
│   ├── admin.js             # /api/admin/...    (ажилтан)
│   └── resident.js          # /api/resident/... (оршин суугч)
│
├── middleware/
│   ├── auth.js              # JWT шалгаж req.user тавина
│   └── requireRole.js       # Role шалгана (auth-ийн дараа)
│
├── controllers/
│   ├── authController.js    # login, logout, me
│   ├── profileController.js # Профайл засах (хоёр role)
│   ├── admin/               # dashboard, invoices, requests, units, polls,
│   │                        # announcements, reports, staff, live
│   └── user/                # home, pay, requests, news, profile, chat, voice
│       └── helpers.js       # currentResident(req) гэх мэт нийтлэг функц
│
├── services/
│   ├── chatService.js       # Claude-тай ярилцах (чатбот)
│   ├── chatTools.js         # Чатботын дууддаг функцүүд (нэхэмжлэл, хүсэлт...)
│   └── chimegeService.js    # Яриа → текст (Chimege STT)
│
├── db/
│   ├── index.js             # Knex холболт
│   ├── knexfile.js          # Холболтын тохиргоо (.env-ээс)
│   ├── check.js             # Холболт шалгах скрипт
│   ├── create-user.js       # Хэрэглэгч үүсгэх скрипт
│   ├── migrations/          # Хүснэгтийн бүтэц
│   ├── models/              # base.js (нийтлэг CRUD) + хүснэгт бүрт нэг файл
│   └── seeds/               # Demo өгөгдөл
│
├── lib/logger.js            # pino logger (терминал + logs/app.log)
├── scripts/                 # logs.js, clear-logs.js
├── logs/                    # Лог файлууд
└── public/                  # Статик файлууд
```

---

## Өгөгдлийн сан

| Хүснэгт | Агуулга |
| --- | --- |
| `buildings` | Байр |
| `entrances` | Орц (байранд харьяалагдана, давхрын тоо, хариуцсан ажилтан) |
| `units` | Тоот (орцонд харьяалагдана) |
| `users` | Оршин суугч (тоотод холбогдоно) |
| `admins` | СӨХ-ийн ажилтан (`active`: устгахгүй, идэвхгүй болгоно) |
| `invoices` | Сарын нэхэмжлэл, `unique(unit_id, period)` |
| `payments` | Төлбөр (нэхэмжлэлд холбогдоно) |
| `requests` | Засварын хүсэлт (засварчин томилж болно) |
| `announcements` | Зарлал (`entrance_id = NULL` бол бүх орцод) |
| `polls`, `poll_options`, `poll_votes` | Санал хураалт, нэг тоот нэг санал |

Дүрмүүд:

- Мөнгөн дүнг бүхэл тоогоор (₮) хадгална.
- Санхүүгийн түүх болон саналыг устгахгүй: FK-ууд `RESTRICT`.
- Нууц үгийг зөвхөн bcrypt hash хэлбэрээр хадгална.

### Model-ууд

Model бүр `base.js`-ийн нийтлэг CRUD функцүүдийг (`all`, `find`, `where`, `create`, `update`, `remove`) авч, өөрт хэрэгтэй query-нуудыг нэмдэг.

```js
var { Units, Invoices } = require('../db/models');
```

---

## Лог

- `lib/logger.js`: терминалд өнгөтэйгөөр, `logs/app.log`-д JSON хэлбэрээр бичнэ.
- Нууц үг болон token логт хэзээ ч бичигдэхгүй (`redact`).
- Чатботын лог зөвхөн файлд бичигдэнэ (`logger.fileOnly`), учир нь олон давтагдаж терминалыг дүүргэдэг.
