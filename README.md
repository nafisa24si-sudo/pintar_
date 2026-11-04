# PINTAR

Aplikasi pendataan dan administrasi peserta magang berbasis React, Vite, dan Tailwind CSS.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Pemindaian QR memerlukan izin kamera browser dan koneksi aman (HTTPS atau `localhost`). Pendaftaran dapat dibuka lewat tombol di beranda atau QR pendaftaran.

## Absensi QR

Admin membuka menu **Absensi**, lalu memilih **Scan QR**, **Riwayat Absensi**, atau **Rekap Absensi**. ID Card menampilkan QR yang berisi kode peserta, bukan data pribadi. QR dicocokkan dengan daftar peserta tersimpan, dan admin mengonfirmasi catatan setelah melihat identitas yang ditemukan. Kode peserta dapat dimasukkan manual saat kamera tidak tersedia.

Catatan absensi disimpan pada `localStorage` browser dengan key `pintar-attendance`. Data hanya tersedia di browser/perangkat yang menyimpannya dan tidak tersinkronisasi antarperangkat. Jenis catatan saat ini hanya kehadiran harian; aturan jam masuk/pulang, keterlambatan, izin, dan sakit belum ditentukan.

Pemindaian QR bukan bukti identitas orang yang memegang kartu. Selfie tidak diwajibkan dan metode/aturan verifikasi identitas masih perlu dikonfirmasi. Jangan menggunakan pencatatan lokal ini sebagai satu-satunya kontrol kehadiran sebelum kebijakan verifikasi dan penyimpanan bersama ditetapkan.