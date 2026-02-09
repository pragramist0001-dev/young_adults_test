# EduTest - O'quv Markazi Boshqaruv Tizimi

EduTest — bu o'quv markazlari uchun mo'ljallangan zamonaviy boshqaruv platformasi. Tizim o'qituvchilar, talabalar va dars jarayonlarini samarali boshqarish imkonini beradi.

## 🚀 Xususiyatlari

- **Admin Paneli**: Talabalar va o'qituvchilarni boshqarish, guruhlar yaratish.
- **O'qituvchi Kabineti**: Dars jadvallari, vazifalar yuklash va talabalar natijalarini kuzatish.
- **Test Tizimi**: Onlayn testlar yaratish va ularni topshirish.
- **Statistika**: O'zlashtirish ko'rsatkichlarini grafik ko'rinishida ko'rish.
- **Ko'ptillilik**: O'zbek, Rus va Ingliz tillarida interfeys.

## 🛠 Texnologiyalar

- **Frontend**: React.js, Vite, Tailwind CSS, Redux Toolkit.
- **Backend**: Node.js, Express.js.
- **Ma'lumotlar bazasi**: MongoDB (Mongoose ORM).
- **Xavfsizlik**: JSON Web Token (JWT), BCrypt.

## 📂 Loyiha Tuzilmasi

- `/client` — Frontend (React dasturi)
- `/server` — Backend (API server)
- `render.yaml` — Avtomatik deploy sozlamalari

## 💻 Mahalliy Ishga Tushirish

1. Repozitoriyani yuklab oling:
   ```bash
   git clone https://github.com/pragramist0001-dev/young_adults_test.git
   cd young_adults_test
   ```

2. Backend-ni sozlang:
   ```bash
   cd server
   npm install
   # .env faylini yarating va MONGO_URI, JWT_SECRET kiriting
   npm run dev
   ```

3. Frontend-ni sozlang:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 🌐 Deploy Qilish (Render.com)

Loyiha Render.com uchun to'liq sozlangan (`render.yaml`). 

1. GitHub-ga push qiling.
2. Render.com da **Blueprints** bo'limiga kiring.
3. Repozitoriyangizni ulang.
4. Render avtomatik ravishda barcha sozlamalarni o'qiydi. Sizdan faqat `MONGO_URI` (MongoDB Atlas linki) so'raladi.

---
© 2026 EduTest Platform. Barcha huquqlar himoyalangan.
