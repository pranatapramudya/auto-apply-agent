PERINTAH UPDATE FITUR: FULL AUTO-PILOT GOOGLE MAPS SCRAPER

Konteks:
Saat ini fungsi `scrapeGoogleMaps` di file `src/scraper/gmaps.ts` hanya membuka browser Google Maps tetapi tidak melakukan pencarian dan ekstraksi data secara otomatis (masih butuh input manual user). 

Tugas Anda (AI Agent):
Tolong perbaiki dan lengkapi file `src/scraper/gmaps.ts` menggunakan library Playwright agar berjalan FULL OTOMATIS (Auto-Pilot) dengan alur berikut:

1. NAVIGASI: Buka halaman `https://www.google.com/maps`.
2. PENCARIAN OTOMATIS: Cari elemen search box (biasanya `#searchboxinput`), ketikkan parameter `keyword` ke dalamnya, lalu tekan tombol 'Enter' secara otomatis.
3. TUNGGU HASIL: Gunakan `page.waitForSelector` untuk menunggu sampai daftar tempat bisnis muncul di sebelah kiri.
4. EKSTRAKSI & LOOPING: 
   - Klik satu per satu hasil pencarian (maksimal jumlahnya sesuai parameter `limit`).
   - Tunggu detail panel di sebelah kiri terbuka.
   - Ekstrak "Nama Bisnis" (biasanya tag h1).
   - Ekstrak "Kategori Bisnis" (teks di bawah rating).
   - Ekstrak "Nomor Telepon" (cari elemen aria-label yang mengandung kata "telepon" atau "phone").
5. SANITASI DATA: 
   - Jika tempat tersebut tidak mencantumkan nomor HP, lewati (skip) dan lanjut ke target berikutnya.
   - Jika ada nomornya, format menjadi standar WhatsApp internasional (contoh: ubah awalan "08" menjadi "+628", hapus spasi dan tanda strip).
6. SIMPAN KE DATABASE: Masukkan data yang terekstrak ke database menggunakan Prisma (`prisma.prospect.create`) dengan status default: 'PENDING'.
7. CLEANUP: Tutup browser (browser.close()) setelah target `limit` tercapai.

Tuliskan kode lengkapnya. Gunakan `headless: false` untuk sementara agar user bisa melihat proses robotnya bekerja di layar.