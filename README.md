# 🧩 One Line Block Puzzle Solver (AI)

Project iseng membuat **AI Solver** untuk game One Line Block Puzzle menggunakan **JavaScript (Vanilla)** dan algoritma **DFS Backtracking**.

## 🚀 Fitur
* **Auto Detection:** Mengubah screenshot game menjadi matriks data (0 dan 1).
* **Smart Solver:** Menggunakan algoritma Backtracking untuk mencari jalur Hamiltonian.
* **Visualisasi:** Menggambar solusi langsung di atas canvas.
* **Fast:** Solusi ditemukan dalam hitungan milidetik.

## 🛠️ Teknologi
* HTML5 & CSS3
* Vanilla JavaScript (No Framework)
* [Cropper.js](https://github.com/fengyuanchen/cropperjs) (Untuk crop gambar)

## 🎮 Cara Pakai
1.  Buka `index.html` di browser.
2.  Upload screenshot level puzzle yang sulit.
3.  Crop bagian kotaknya saja.
4.  Tentukan Titik Awal (Start) dan Akhir (End).
5.  Klik **Selesaikan Puzzle**.

## 🧠 Logika Algoritma
Solver ini menggunakan pendekatan matematis:
1.  **Image Processing:** Thresholding untuk membedakan path (1) dan wall (0).
2.  **Graph Theory:** Menganggap grid sebagai graf dan mencari *Hamiltonian Path* (melewati semua node aktif tepat satu kali).
3.  **Backtracking:** Mencoba jalur secara rekursif. Jika buntu, mundur satu langkah dan coba arah lain.

---
*Dibuat oleh Ali Mustain - Mahasiswa Fisika yang lagi gabut.*