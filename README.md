Loyihani Deploy Qilish Qo'llanmasi (Render.com)
Netlify asosan frontend (static saytlar) uchun mo'ljallangan. Sizning loyihangiz MERN stack (MongoDB, Express, React, Node.js) bo'lgani uchun, backend server ham ishlashi kerak.

Eng yaxshi va bepul variant: Render.com. Bu platformada Frontend va Backend alohida, lekin juda oson bog'lanadi.

⚠️ Muhim Eslatma (Ma'lumotlar Bazasi)
Sizning loyihangizda 
students.json
 fayli bor. Deploy qilinganda fayllar o'zgarishi saqlanmaydi! Server har safar qayta ishga tushganda (restart), 
students.json
 fayli asl holatiga qaytadi. Shuning uchun, MongoDB Atlas (Cloud Database) ishlatish shart. Lokal mongodb://localhost... internetda ishlamaydi.

1-qadam: MongoDB Atlas (Agar yo'q bo'lsa)
MongoDB Atlas saytidan ro'yxatdan o'ting.
Bepul klaster (Shared Cluster) yarating.
"Database Access" bo'limida yangi user va parol yarating.
"Network Access" bo'limida "Allow Access from Anywhere (0.0.0.0/0)" ni tanlang.
"Connect" tugmasini bosib, ulanish linkini oling (masalan: mongodb+srv://user:password@cluster.mongodb.net/...).
2-qadam: Backend (Server) Deploy
Render.com saytidan ro'yxatdan o'ting (GitHub orqali).

"New +" tugmasini bosib, "Web Service" ni tanlang.

GitHub repozitoriyingizni ulang.

Quyidagi sozlamalarni kiriting:

Name: markaz-backend (yoki xohlagan nom)
Root Directory: server (juda muhim!)
Environment: Node
Build Command: npm install
Start Command: node index.js
Plan: Free
Environment Variables bo'limiga o'ting va qo'shing:

MONGO_URI: (MongoDB Atlas ulanish linki)
JWT_SECRET: (xohlagan maxfiy so'z)
PORT: 10000 (yoki avtomatik 10000 bo'ladi)
"Create Web Service" tugmasini bosing.

Deploy tugagach, yuqorida backend URL paydo bo'ladi (masalan: https://markaz-backend.onrender.com). Buni nusxalab oling.

3-qadam: Frontend (Client) Deploy
Render.com da "New +" -> "Static Site" ni tanlang.

Xuddi shu GitHub repozitoriyini tanlang.

Sozlamalar:

Name: markaz-frontend
Root Directory: client (juda muhim!)
Build Command: npm install && npm run build (yoki npm run build)
Publish Directory: dist
Environment Variables bo'limiga o'ting:

VITE_API_URL: (2-qadamda olgan Backend URLingiz, oxirida /api qo'shing. Masalan: https://markaz-backend.onrender.com/api)
"Create Static Site" tugmasini bosing.

🎉 Natija
Deploy tugagach, Frontend URL orqali saytga kirishingiz mumkin.

Frontend so'rovlarni avtomatik ravishda Render dagi Backend ga yuboradi.
Ma'lumotlar MongoDB Atlas da xavfsiz saqlanadi.
Muammolar chiqsa:
Render da "Logs" bo'limini tekshiring.
MongoDB IP address ruxsati (Network Access) ochiqligini tekshiring.
