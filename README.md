<div align="center">
  <br>
  <div>
    <img src="https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/firebase-%23FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </div>

  <h1 align="center">Voquest - Gamified English Vocabulary Learning App</h1>

   <div align="center">
     Check out the live app on <a href="https://voquestpawm.vercel.app" target="_blank"><b>Vercel</b></a>.
    </div>
</div>

---

## <a name="table">Table of Contents</a>

1. 🤖 [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🚀 [Quick Start](#quick-start)

---

## <a name="introduction">🤖 Introduction</a>

**Voquest** adalah aplikasi pembelajaran kosa kata bahasa Inggris berbasis web yang interaktif.  
Nama *"Voquest"* berasal dari **“Vocabulary Quest”**, menggambarkan petualangan untuk memperluas kosa kata melalui **kuis dan modul pembelajaran** yang seru dan edukatif.  

Platform ini menggabungkan elemen gamifikasi untuk meningkatkan motivasi belajar pengguna, seperti progres level, skor terbaik, dan sistem pencapaian.  
<br/>

---

## <a name="tech-stack">⚙️ Tech Stack</a>

### **Frontend**
- HTML  
- CSS  
- JavaScript (Vanilla)  

### **Backend & Services**
- Firebase Authentication — mengelola login dan register secara aman di sisi klien  
- Cloud Firestore — menyimpan data pengguna, skor, dan soal secara real-time  
- Vercel Serverless Functions — menangani penyimpanan progres pengguna di sisi server  
- Vercel — digunakan untuk deployment agar mendukung portabilitas dan performa global  

---

## <a name="features">🔋 Features</a>

### **1. User Authentication**  
Login dan register menggunakan Firebase Authentication secara langsung di sisi klien.  
<br/>
### **2. Learning Quiz**  
Menjawab soal kosakata berdasarkan level dan tingkat kesulitan yang meningkat.  
<br/>
### **3. Progress Tracking (Serverless)**  
Progres pengguna disimpan melalui endpoint serverless `/api/saveProgress` untuk menjaga keamanan dan integritas data.  
<br/>
### **4. Profile Page**  
Menampilkan data pengguna (nama, email, skor terbaik, dan level) yang diambil langsung dari Firestore.  
<br/>
### **5. Dynamic Quiz Content**  
Data soal diambil dari Firestore agar mudah diperbarui tanpa redeploy aplikasi.  

---

## <a name="quick-start">🚀 Quick Start</a>

Ikuti langkah-langkah berikut untuk menjalankan Voquest secara lokal di perangkatmu.

### **Prerequisites**
Pastikan kamu sudah menginstal:
- Git
- Firebase CLI
- Node.js

### **Cara Setup**
1. Clone repository ini:
   ```bash
   git clone https://github.com/your-username/voquest.git
   cd voquest
2. Pastikan telah menginstal Node.js, Firebase CLI, dan Git di komputermu.
3. Jika ingin menjalankan serverless function (saveProgress), pastikan sudah login ke Firebase dan memiliki environment variable yang sesuai di .env.local atau di Vercel Project Settings:
   ```bash
   FIREBASE_SERVICE_ACCOUNT=<your-service-account-json>

### **Cara Run Program**
1. Buka direktori utama project.
2. Jalankan proyek secara lokal menggunakan Live Server di VS Code, atau buka langsung file:
   ```bash
   pages/index.html
