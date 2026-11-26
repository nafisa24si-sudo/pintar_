# PINTAR

Aplikasi pendataan dan administrasi peserta magang berbasis React, Vite, dan Tailwind CSS.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Pemindaian QR memerlukan izin kamera browser dan koneksi aman (HTTPS atau `localhost`). Pendaftaran dapat dibuka lewat tombol di beranda atau QR pendaftaran.

## Absensi QR

Admin membuka menu **Absensi** untuk memindai QR, melihat riwayat, rekap kedisiplinan, memproses izin/sakit, meninjau peringatan, dan melihat diagram radius kantor. ID Card menampilkan QR yang berisi kode peserta, bukan data pribadi. Admin mengonfirmasi catatan setelah melihat identitas yang ditemukan; kode peserta juga dapat dimasukkan manual. Peserta masuk melalui `/login`; halaman `/peserta` menampilkan kehadiran, riwayat, pengajuan izin/sakit, ID Card, dan profil akun tersebut.

Status kehadiran memakai waktu WIB: hadir tepat waktu sampai pukul 07.45 Senin–Kamis atau 07.30 Jumat; setelah batas tersebut status menjadi terlambat. Peserta yang belum memiliki catatan berstatus belum absen, izin yang disetujui admin berstatus izin, dan tanggal kerja lampau tanpa catatan atau izin dihitung tidak hadir. Akhir pekan tidak menerima absensi. Pengingat browser tersedia lima menit sebelum mulai, saat mulai, dan setelah batas masuk; browser harus tetap terbuka.

Catatan absensi disimpan pada `localStorage` browser dengan key `pintar-attendance`; pengajuan izin dan peringatan juga disimpan lokal. Data hanya tersedia di browser/perangkat yang menyimpannya dan tidak tersinkronisasi antarperangkat. Persentase kehadiran menggunakan jumlah hari hadir dibagi hari kerja terjadwal setelah pengajuan disetujui. Peserta mengaktifkan akun dengan email dan kode peserta yang terdaftar, lalu membuat kata sandi. Kata sandi disimpan sebagai hash PBKDF2 dan sesi menggunakan `sessionStorage`; aktivasi dengan kode peserta tetap bukan verifikasi identitas yang kuat. Bukti izin/sakit bersifat opsional dan dibatasi 1 MB.

Login peserta dan pemeriksaan role saat ini hanya pembatas antarmuka pada satu browser. Karena data peserta, kredensial, dan sesi dikelola di browser, pengguna yang menguasai perangkat dapat membaca atau mengubah penyimpanannya; data tidak dibagikan ke Admin/perangkat lain. Sistem ini belum layak untuk deployment publik atau menjamin kerahasiaan antar-peserta. Untuk keamanan produksi dibutuhkan backend/API dengan autentikasi, otorisasi per peserta, penyimpanan bersama, dan verifikasi aktivasi akun. Sistem absensi saat ini hanya mencatat jam masuk melalui pemindaian Admin; pencatatan jam pulang belum tersedia.

Konfirmasi absensi meminta lokasi perangkat dan hanya diterima dalam radius 50 meter dari pin kantor Pelindo Regional 1 Dumai. Jarak hasil GPS ditampilkan kepada admin. Browser harus mengizinkan akses lokasi dan aplikasi harus dibuka lewat HTTPS atau `localhost`. Pemeriksaan lokasi, penghitungan status, dan peringatan aktivitas berjalan di browser; waktu perangkat tidak dapat diverifikasi secara tepercaya tanpa backend. Diagram peta bersifat skematis dan pemeriksaan jarak menggunakan koordinat kantor.

Pemindaian QR bukan bukti identitas orang yang memegang kartu. Selfie tidak diwajibkan. Prototipe ini tidak menyediakan penyimpanan bersama atau kontrol keamanan server, sehingga jangan gunakan sebagai satu-satunya kontrol kehadiran atau unggah bukti sensitif sebelum autentikasi dan kebijakan penyimpanan ditetapkan.