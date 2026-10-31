# СӨХ Hub

Орон сууцны өмчлөгчдийн холбоо (СӨХ)-ны удирдлагын систем. Нэг хотхоны (жишээ: "Нарны хотхон") тоот, оршин суугч, сарын хураамжийн нэхэмжлэл ба төлбөр, засварын хүсэлт, санал хураалтыг нэг дор удирдана.

Төсөл гурван хэсэгтэй:

- **frontend**: СӨХ-ийн ажилтан (admin) болон оршин суугч (user) ашиглах вэб апп
- **backend**: REST API, MySQL өгөгдлийн сан
- **mobile**: оршин суугчдад зориулсан утасны апп (Expo)

---

## Агуулга

- [Боломжууд](#боломжууд)
- [Ашигласан технологиуд](#ашигласан-технологиуд)
- [Архитектур](#архитектур)
- [Хавтасны бүтэц](#хавтасны-бүтэц)
- [Шаардлага](#шаардлага)
- [Суулгах](#суулгах)
- [Ажиллуулах](#ажиллуулах)
- [Командууд](#командууд)
- [Өгөгдлийн сан](#өгөгдлийн-сан)
- [API](#api)
- [Frontend хуудсууд](#frontend-хуудсууд)
- [Код бичих дүрэм](#код-бичих-дүрэм)
- [Одоогийн төлөв](#одоогийн-төлөв)
- [Түгээмэл алдаа](#түгээмэл-алдаа)

---

## Боломжууд

| Боломж | Admin | User |
| --- | :---: | :---: |
| Самбар: цуглуулалт, өр, хүсэлт, санал хураалтын тойм | ✅ | ✅ |
| Нэхэмжлэл ба төлбөр | ✅ | |
| Засварын хүсэлт илгээх, хянах | ✅ | ✅ |
| Зарлал | ✅ | ✅ |
| Санал хураалт (нэг тоот нэг санал, ирцийн босго) | ✅ | ✅ |
| Тоот ба оршин суугч | ✅ | |
| Тайлан | ✅ | |
| Тохиргоо | ✅ | |

Цэсний аль хэсэг хэнд харагдахыг `frontend/src/components/App/Navbar.jsx` доторх `roles` тодорхойлдог.

---

## Ашигласан технологиуд

| Хэсэг | Технологи |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, MUI Icons, ESLint |
| Backend | Node.js, Express 4, Knex (query builder, migration), mysql2, bcryptjs, dotenv, Morgan |
| Өгөгдлийн сан | MySQL 8.0 (`utf8mb4`) |
| Mobile | React Native, Expo |
| Фонт | Onest (үндсэн текст), Unbounded (гарчиг) |

---

## Архитектур

```
Browser (React, :5173)
   │  fetch('/api/...')
   ▼
Express (:3000)
   app.js ──► routes/api.js ──► controllers/ ──► db/models/ ──► db/index.js (Knex)
                                                                     │
                                                                     ▼
                                                              MySQL (:3306, sukh_hub)
```

| Давхарга | Хавтас | Үүрэг | Laravel-тай харьцуулбал |
| --- | --- | --- | --- |
| Route | `backend/routes/api.js` | Аль URL ямар controller функцийг дуудахыг заана | `routes/api.php` |
| Controller | `backend/controllers/` | Хүсэлтийг уншиж, model дуудаж, JSON хариу буцаана | `app/Http/Controllers` |
| Model | `backend/db/models/` | Өгөгдлийн сангийн query-нууд | `app/Models` |
| Migration | `backend/db/migrations/` | Хүснэгтийн бүтэц | `database/migrations` |
| Тохиргоо | `backend/db/knexfile.js` + `.env` | Холболтын мэдээлэл | `config/database.php` + `.env` |

Browser өгөгдлийн сан руу хэзээ ч шууд хандахгүй. Бүх хүсэлт backend API-аар дамжина.

---

## Хавтасны бүтэц

```
Web/
├── backend/
│   ├── bin/www                  # Серверийг асаах файл (порт: 3000)
│   ├── app.js                   # Express тохиргоо, /api холболт, алдаа барих
│   ├── routes/
│   │   └── api.js               # Бүх API зам нэг дор
│   ├── controllers/
│   │   ├── dashboardController.js
│   │   └── unitsController.js
│   ├── db/
│   │   ├── index.js             # Knex холболт — require('../db')
│   │   ├── knexfile.js          # Холболтын тохиргоо (.env-ээс уншина)
│   │   ├── check.js             # Холболт шалгах скрипт
│   │   ├── create-user.js       # Хэрэглэгч нэмэх / нууц үг шинэчлэх скрипт
│   │   ├── migrations/          # Хүснэгтийн бүтэц
│   │   └── models/              # Query-нууд (base.js + хүснэгт бүрт нэг файл)
│   ├── public/                  # Статик файлууд
│   ├── .env.example             # Орчны хувьсагчийн загвар
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx             # Эхлэл — BrowserRouter
│       ├── App.jsx              # Route-ууд, хэрэглэгчийн state
│       ├── App.css              # Дизайны өнгөнүүд (--navy, --yellow, ...)
│       ├── index.css
│       ├── api/
│       │   └── auth.js          # Нэвтрэлтийн API дуудлагууд
│       ├── components/
│       │   ├── Page.jsx         # Түр хоосон хуудас
│       │   ├── App/             # Нэвтэрсний дараах хүрээ
│       │   │   ├── Layout.jsx + .css     # Navbar + <Outlet />, нэвтрэлт шалгана
│       │   │   ├── Navbar.jsx + .css     # Хажуугийн цэс (role-оор шүүнэ)
│       │   │   └── Brand.jsx + .css      # СӨХ Hub лого
│       │   └── Auth/            # Нэвтрэх, сэргээх хуудсуудын компонентууд
│       │       ├── AuthLayout.jsx + .css
│       │       └── PasswordInput.jsx + .css
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Login.jsx
│           ├── ForgotPassword.jsx
│           └── styles/          # Хуудсуудын CSS
│               ├── Dashboard.css
│               └── Auth.css
│
├── mobile/                      # Expo апп
│   ├── App.js
│   ├── app.json
│   └── package.json
│
└── README.md
```

---

## Шаардлага

- [Node.js](https://nodejs.org/) 20 буюу түүнээс дээш хувилбар, npm
- [MySQL Community Server](https://dev.mysql.com/downloads/installer/) 8.0, порт **3306** дээр ажиллаж байх
- (Заавал биш) MySQL Workbench: хүснэгтээ харахад
- (Mobile) утсандаа [Expo Go](https://expo.dev/go) апп

---

## Суулгах

### 1. Хамаарлуудыг суулгах

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../mobile
npm install
```

### 2. Өгөгдлийн сан үүсгэх

MySQL Workbench эсвэл MySQL Command Line Client дээр:

```sql
CREATE DATABASE sukh_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

`utf8mb4` нь кирилл үсгийг зөв хадгалахад заавал хэрэгтэй.

### 3. `.env` файл үүсгэх

```bash
cd backend
cp .env.example .env
```

`backend/.env` доторх утгуудыг өөрийн MySQL-ийн мэдээллээр бөглөнө:

```
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=таны_нууц_үг
DB_NAME=sukh_hub
```

> ⚠️ `.env` нь `.gitignore`-д орсон тул git-д орохгүй. Нууц үгээ хэзээ ч commit хийж болохгүй. Багийнхандаа хуваалцах бол зөвхөн `.env.example`-ийг шинэчилнэ.

### 4. Холболтыг шалгах

```bash
npm run db:check
# MySQL холбогдлоо — хувилбар 8.0.x, database: sukh_hub
```

### 5. Хүснэгтүүдийг үүсгэх

```bash
npm run migrate
```

### 6. Admin хэрэглэгч үүсгэх

```bash
npm run user:create -- --email admin@example.com --name "Нэр" --role admin
```

`--password` өгөхгүй бол санамсаргүй нууц үг үүсгээд терминалд нэг удаа хэвлэнэ. Ижил имэйлтэй хэрэглэгч байвал шинээр нэмэхгүй, нэр, role, нууц үгийг нь шинэчилнэ.

---

## Ажиллуулах

Тусдаа терминалуудад:

**Backend** (http://localhost:3000):

```bash
cd backend
npm start
```

Портыг өөрчлөх бол PowerShell дээр: `$env:PORT=4000; npm start`

**Frontend** (http://localhost:5173):

```bash
cd frontend
npm run dev
```

**Mobile:**

```bash
cd mobile
npm start
```

Терминалд гарах QR кодыг утасныхаа Expo Go аппаар уншуулна.

---

## Командууд

### Backend

| Команд | Тайлбар |
| --- | --- |
| `npm start` | Серверийг асаана |
| `npm run db:check` | MySQL холболтыг шалгана |
| `npm run migrate` | Хийгдээгүй migration-уудыг ажиллуулна |
| `npm run migrate:rollback` | Сүүлийн migration багцыг буцаана |
| `npm run migrate:status` | Аль migration хийгдсэнийг харуулна |
| `npm run migrate:make -- нэр` | Шинэ migration файл үүсгэнэ |
| `npm run seed` | Seed өгөгдөл оруулна |
| `npm run seed:make -- нэр` | Шинэ seed файл үүсгэнэ |
| `npm run user:create -- --email ... --name ... [--role admin] [--phone ...] [--password ...]` | Хэрэглэгч нэмнэ эсвэл шинэчилнэ |

> `npx knex ...` командыг шууд ашиглах бол knexfile `db/` дотор байгаа тул `npx knex --knexfile db/knexfile.js ...` гэж бичнэ.

### Frontend

| Команд | Тайлбар |
| --- | --- |
| `npm run dev` | Хөгжүүлэлтийн серверийг асаана |
| `npm run build` | Production хувилбарыг `dist/` руу бэлдэнэ |
| `npm run preview` | Build хийсэн хувилбарыг шалгаж үзнэ |
| `npm run lint` | ESLint-ээр кодыг шалгана |

### Mobile

| Команд | Тайлбар |
| --- | --- |
| `npm start` | Expo хөгжүүлэлтийн сервер |
| `npm run android` / `ios` / `web` | Тухайн платформ дээр нээнэ |

---

## Өгөгдлийн сан

Өгөгдлийн сан: `sukh_hub` (MySQL 8.0, `utf8mb4`). Одоогоор Dashboard-д шаардлагатай хүснэгтүүд л үүссэн.

| Хүснэгт | Агуулга | Гол баганууд |
| --- | --- | --- |
| `units` | Тоот | `code` ('1-12'), `entrance` (орц), `floor`, `area_m2` |
| `users` | Хэрэглэгч | `name`, `email`, `phone`, `password_hash`, `role` (admin/user), `unit_id` |
| `invoices` | Сарын нэхэмжлэл | `unit_id`, `period` (сарын 1-ний өдөр), `amount`, `due_date`, `status` (unpaid/partial/paid) |
| `payments` | Төлбөр | `invoice_id`, `amount`, `method` (cash/bank/qpay/card), `paid_at` |
| `requests` | Засварын хүсэлт | `category`, `title`, `status` (open/in_progress/resolved/rejected), `resolved_at` |
| `polls` | Санал хураалт | `title`, `threshold_percent`, `starts_at`, `ends_at` |
| `poll_options` | Сонголтууд | `poll_id`, `label`, `position` |
| `poll_votes` | Өгсөн саналууд | `poll_id`, `option_id`, `unit_id` |

Дүрмүүд:

- Мөнгөн дүнг бүхэл тоогоор (₮) хадгална.
- Нэг тоотод нэг сард нэг нэхэмжлэл байна: `unique(unit_id, period)`.
- Нэг тоот нэг санал хураалтад нэг л санал өгнө: `unique(poll_id, unit_id)`.
- Нууц үгийг зөвхөн bcrypt hash хэлбэрээр хадгална. `Users` model энгийн query-нуудад `password_hash`-ийг буцаадаггүй.
- Ангилал, төлөвүүдийг англи түлхүүрээр (`plumbing`, `open`, ...) хадгалж, Монгол нэрийг frontend дээр харуулна.

Дараа нэмэх хүснэгтүүд: `fees` (хураамжийн тохиргоо), `announcements` (зарлал), `password_resets`, `sessions`.

### Model-ууд (`backend/db/models/`)

Model бүр `base.js`-ийн нийтлэг CRUD функцуудыг (`all`, `find`, `where`, `create`, `update`, `remove`) авч, өөрт хэрэгтэй query-нуудыг нэмдэг.

| Model | Нэмэлт функцууд |
| --- | --- |
| `Units` | `byEntrance(n)`, `withResidents(id)` |
| `Users` | `findForLogin(email эсвэл утас)`, `admins()` |
| `Invoices` | `forUnit(id)`, `monthlySummary(from)`, `debtors(limit)`, `overdueTotal()` |
| `Payments` | `forInvoice(id)`, `record(invoiceId, data)`: төлбөр бүртгээд нэхэмжлэлийн төлөвийг transaction дотор шинэчилнэ |
| `Requests` | `list(filters)`, `openCount()`, `countByCategory(from)`, `avgResolveHours(from)`, `setStatus(id, status)` |
| `Polls` | `active()`, `results(id)`, `createWithOptions(data, labels)`, `vote(pollId, optionId, unitId, userId)` |

```js
var { Units, Invoices } = require('../db/models');
var debtors = await Invoices.debtors(6);
```

---

## API

Бүх зам `/api` угтвартай бөгөөд `backend/routes/api.js` дотор тодорхойлогдсон. Хариу нь JSON хэлбэртэй.

| Method | Зам | Controller | Тайлбар |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | `dashboardController.show` | Самбарын бүх өгөгдөл нэг дор |
| GET | `/api/units` | `unitsController.index` | Тоотууд (`?entrance=1`) |
| GET | `/api/units/:id` | `unitsController.show` | Тоот + оршин суугчид |
| POST | `/api/units` | `unitsController.store` | Шинэ тоот |
| PUT | `/api/units/:id` | `unitsController.update` | Тоот засах |
| DELETE | `/api/units/:id` | `unitsController.destroy` | Тоот устгах |

> ⚠️ Controller функцууд одоогоор хоосон байгаа (бичигдэж байна). Хоосон функц хариу буцаадаггүй тул тэр замыг дуудвал хүсэлт хариугүй өлгөгдөнө.

Алдааны хариу:

| Код | Хэзээ |
| --- | --- |
| 400 | Шаардлагатай талбар дутуу |
| 404 | Мөр эсвэл зам олдсонгүй: `{ "error": "..." }` |
| 409 | Давхардсан утга (MySQL `ER_DUP_ENTRY`) |
| 500 | Серверийн алдаа. `next(err)` дуудахад `app.js`-ийн алдааны middleware хариулна |

Төлөвлөсөн замууд: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/invoices`, `/api/requests`, `/api/polls`.

---

## Frontend хуудсууд

| Зам | Хуудас | Хэнд |
| --- | --- | --- |
| `/login` | Нэвтрэх | Бүгд |
| `/forgot-password` | Нууц үг сэргээх (код → шинэ нууц үг) | Бүгд |
| `/` | Самбар | admin, user |
| `/invoices` | Нэхэмжлэл ба төлбөр | admin |
| `/invoices/settings` | Хураамжийн тохиргоо | admin |
| `/requests` | Засварын хүсэлт | admin, user |
| `/announcements` | Зарлал | admin, user |
| `/polls` | Санал хураалт | admin, user |
| `/units` | Тоот ба оршин суугч | admin |
| `/reports` | Тайлан | admin |
| `/settings` | Тохиргоо | admin |

- `/login` болон `/forgot-password` хуудсууд `AuthLayout` (зүүн талд navy хэсэг) ашигладаг.
- Бусад хуудсууд `Layout`-ын `<Outlet />` дотор гарна. Нэвтрээгүй хэрэглэгчийг `Layout` автоматаар `/login` руу шилжүүлнэ.
- Хуудсууд нэвтэрсэн хэрэглэгчийг `useOutletContext()`-оор авна.

---

## Код бичих дүрэм

### Backend

- Model, controller, migration-ий функцуудыг `async function нэр() {}` хэлбэрээр бичиж, файлын төгсгөлд `module.exports`-оор экспортлоно.
- Controller бүр алдааг `try { ... } catch (err) { next(err) }` хэлбэрээр барина. Express 4 нь `async` функцийн алдааг өөрөө барьдаггүй.
- Хэрэглэгчийн оруулсан утгыг SQL string-д шууд залгаж болохгүй. Knex-ийн `.where({...})` эсвэл `db.raw('... ?', [утга])` ашиглана.
- Шинэ зам нэмэхдээ `routes/api.js`-д нэг мөр нэмээд, логикийг controller-т бичнэ.

### Migration

- Нэгэнт push хийсэн migration файлыг **засахгүй**. Өөрчлөлт хэрэгтэй бол шинэ migration үүсгэнэ, жишээ нь `npm run migrate:make -- add_email_to_residents`.
- `up` болон `down` хоёуланг бичнэ. `down` нь `up`-ийн хийснийг яг буцаах ёстой.

### Frontend

- Компонентын CSS-ийг компонентын хажууд байрлуулна: `Navbar.jsx` + `Navbar.css`.
- Хуудсуудын CSS `pages/styles/` дотор байна.
- Өнгөнүүдийг `App.css`-ийн хувьсагчдаас (`var(--navy)`, `var(--yellow)`, ...) авна.
- Vite дээр CSS глобал үйлчилдэг тул шинэ классуудад угтвар өгнө (`auth-`, `sidebar-`, ...).
- API дуудлагуудыг `src/api/` дотор бичиж, хуудсууд зөвхөн тэдгээр функцийг дуудна.

---

## Одоогийн төлөв

**Хийгдсэн:**

- [x] Frontend route-ууд, role-оор шүүгддэг Navbar
- [x] Dashboard хуудасны дизайн (түр өгөгдөлтэй)
- [x] Login, нууц үг сэргээх хуудсууд
- [x] MySQL холболт, Knex migration (8 хүснэгт)
- [x] Model-ууд (`db/models/`)
- [x] Нэг route файл (`routes/api.js`), controller-уудын бүтэц
- [x] Хэрэглэгч үүсгэх скрипт (bcrypt)

**Хийгдэж байгаа / дараагийн алхам:**

- [ ] Controller-уудын код (`dashboardController`, `unitsController`)
- [ ] Нэвтрэлтийн backend: `express-session`, `/api/auth/*`, `requireAuth`, `requireRole` middleware
- [ ] Frontend-ийг API-тай холбох: `vite.config.js`-д `/api` → `localhost:3000` proxy нэмэх
- [ ] `App.jsx`-ийн түр `handleLogin`, `src/api/auth.js`-ийн түр функцуудыг жинхэнэ `fetch`-ээр солих
- [ ] Dashboard-ийг `/api/dashboard`-аас өгөгдөл авдаг болгох
- [ ] Seed өгөгдөл
- [ ] Нэхэмжлэл, хүсэлт, санал хураалт, зарлалын хуудсууд
- [ ] Mobile апп

> Одоогоор login түр зуурынх: ямар ч нэр, нууц үгээр нэвтэрдэг. Нууц үг сэргээх код нь `123456`.

---

## Түгээмэл алдаа

| Алдаа | Шалтгаан, шийдэл |
| --- | --- |
| `ER_ACCESS_DENIED_ERROR ... (using password: NO)` | `backend/.env`-д `DB_PASSWORD` бичигдээгүй байна |
| `ER_ACCESS_DENIED_ERROR ... (using password: YES)` | Нууц үг эсвэл хэрэглэгчийн нэр буруу. `DB_USER` нь database-ийн нэр биш, MySQL-ийн хэрэглэгч (`root`) байх ёстой. Keyboard кирилл layout дээр байсан эсэхийг шалгаарай |
| `ER_BAD_DB_ERROR: Unknown database 'sukh_hub'` | Өгөгдлийн сан үүсээгүй байна. [Суулгах](#2-өгөгдлийн-сан-үүсгэх)-ын 2-р алхмыг үзнэ үү |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL асаагүй байна. PowerShell: `Get-Service MySQL*`, `Start-Service MySQL80` |
| Browser дээр `localhost:3306` нээгдэхгүй | Хэвийн үзэгдэл. MySQL HTTP биш тул Workbench эсвэл backend-ээр хандана |
| Migration файл устгасны дараа `corrupt` гэх алдаа | Файлыг устгахаас өмнө `npm run migrate:rollback` хийх ёстой |
| Dump файлын кирилл үсэг эвдэрсэн | PowerShell-ийн `>` нь UTF-16 бичдэг. `mysqldump --default-character-set=utf8mb4 --result-file=dump.sql ...` ашиглана |
| `git push origin -b master` алдаа өгнө | `git push`-д `-b` гэсэн тохиргоо байхгүй. `git push origin master` эсвэл `git push` |
