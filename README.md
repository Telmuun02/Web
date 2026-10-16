# Web төсөл

React (Vite) frontend болон Express backend-ээс бүрдсэн вэб аппликейшн.

## Ашигласан технологиуд

| Хэсэг    | Технологи                          |
| -------- | ---------------------------------- |
| Frontend | React 19, Vite 8, ESLint           |
| Backend  | Node.js, Express 4, Morgan, cookie-parser |
| Mobile   | React Native, Expo, JavaScript (JSX) |

## Хавтасны бүтэц

```
web/
├── backend/            # Express сервер
│   ├── bin/www         # Серверийг асаах файл (порт: 3000)
│   ├── routes/         # API замууд (index.js, users.js)
│   ├── public/         # Статик файлууд (зураг, CSS, JS)
│   ├── app.js          # Express аппын тохиргоо
│   └── package.json
│
├── frontend/           # React + Vite клиент
│   ├── src/            # React компонентууд (App.jsx, main.jsx)
│   ├── public/         # Статик файлууд
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Шаардлага

- [Node.js](https://nodejs.org/) 20 буюу түүнээс дээш хувилбар
- npm

## Суулгах

Backend болон frontend-ийн хамаарлуудыг тус тусад нь суулгана:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Ажиллуулах

Хоёр тусдаа терминал нээгээд дараах командуудыг ажиллуулна.

**Backend** (http://localhost:3000):

```bash
cd backend
npm start
```

Портыг өөрчлөх бол `PORT` орчны хувьсагч ашиглана. Жишээ нь PowerShell дээр: `$env:PORT=4000; npm start`

**Frontend** (http://localhost:5173):

```bash
cd frontend
npm run dev
```

## Командууд

### Backend

| Команд      | Тайлбар              |
| ----------- | -------------------- |
| `npm start` | Серверийг асаана     |

### Frontend

| Команд            | Тайлбар                                   |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Хөгжүүлэлтийн серверийг асаана            |
| `npm run build`   | Production хувилбарыг `dist/` руу бэлдэнэ |
| `npm run preview` | Build хийсэн хувилбарыг шалгаж үзнэ       |
| `npm run lint`    | ESLint-ээр кодыг шалгана                  |

## API

| Method | Зам      | Тайлбар                  |
| ------ | -------- | ------------------------ |
| GET    | `/`      | Нүүр хуудас              |
| GET    | `/users` | Хэрэглэгчдийн жагсаалт   |

## Зохиогч

- Нэр: _таны нэр_
- И-мэйл: _таны и-мэйл_
