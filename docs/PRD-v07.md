PERINTAH EKSEKUSI: IMPLEMENTASI PRD-v07.md (RESPONSIVE UI & FUNCTIONAL NAVIGATION)

Konteks:
UI Dashboard saat ini "ngaco" dan tidak user-friendly. Di desktop, Dropdown Filter menumpuk secara vertikal sehingga membuang ruang. Di mobile, layout terlalu memanjang dan Hamburger Menu tidak berfungsi (mati). Kita perlu perbaikan UI/UX yang presisi agar setara dengan standar Premium SaaS.

Tugas Anda (AI Agent):
Tolong refactor komponen UI (khususnya `DashboardClient.tsx` atau file komponen utama Anda) dengan mematuhi spesifikasi `PRD-v07.md` berikut:

# PRD-v07: Responsive Layout & Navigation Overhaul

## 1. Perbaikan Navigasi (Functional Sidebar/Menu)
- Pastikan file komponen memiliki direktif `"use client";` di baris paling atas karena kita butuh interaktivitas.
- Gunakan React `useState` untuk mengelola state menu (`const [isMenuOpen, setIsMenuOpen] = useState(false)`).
- **Mobile Action:** Saat Hamburger Icon diklik, tampilkan Mobile Menu/Sidebar (bisa berupa dropdown panel di bawah header atau off-canvas sidebar). Tambahkan interaksi transisi yang halus.
- **Desktop Action:** Sembunyikan icon Hamburger di layar besar (`md:hidden`). Gunakan desain Top Navbar yang bersih dan elegan khusus desktop.

## 2. Layouting Ulang Filter Bar (Grid/Flexbox)
- **Desktop (`md` dan ke atas):** Filter Bar (Category, City, Status) HARUS sejajar secara horizontal (inline). Gunakan `grid grid-cols-1 md:grid-cols-3 gap-4`.
- **Mobile:** Biarkan menumpuk secara vertikal (`flex-col`), namun rapikan padding dan margin agar lebih proporsional.

## 3. Optimasi Stats Cards
- **Desktop:** Tampilkan dalam satu baris horizontal (`grid-cols-1 md:grid-cols-4`).
- **Mobile:** Ubah menjadi grid 2x2 pada layar kecil (`grid-cols-2 gap-3`) agar data tidak memakan terlalu banyak scroll vertikal di HP.

## 4. Fix Table Overflow (Mobile UX)
- Pastikan container utama tabel benar-benar dibungkus dengan `<div className="overflow-x-auto w-full">`.
- Tambahkan class `whitespace-nowrap` pada setiap tag `<th>` dan `<td>` agar teks di dalam tabel tidak tergencet/wrap ke bawah secara paksa saat dibuka di layar HP. 

Tolong berikan kode lengkap hasil refactornya sekarang agar aplikasi ini benar-benar responsif!