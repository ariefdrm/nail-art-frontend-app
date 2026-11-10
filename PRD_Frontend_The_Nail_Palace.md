# PRD Frontend The Nail Palace

|                     |                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Draf untuk ditinjau pemilik produk                                                                                                                    |
| **Tanggal**         | 9 November 2026                                                                                                                                       |
| **Branch**          | `test/ai-prototype` (dipotong dari `main`)                                                                                                            |
| **Backend**         | `backend-nail-art-app`; kontrak disalin ke `docs/openapi.yaml`, panduan pemakaian di `docs/API_GUIDE.md` (semua modul P0 dan P1 selesai; FR-16 belum) |
| **Stack**           | TanStack Start (React 19, mode SPA), TanStack Router, TypeScript, Tailwind CSS 4, shadcn/ui `base-nova` (Base UI), axios, Bun                         |
| **Dokumen terkait** | `CLAUDE.md` (aturan kerja agen AI), `CODE_STYLE.md` (gaya kode), `DESIGN_SPEC.md` (tampilan), `docs/` (kontrak API dan panduannya)                    |

---

## 1. Ringkasan dan tujuan

The Nail Palace adalah studio nail art di Kota Jambi yang dijalankan satu orang. Backend reservasi sudah selesai: katalog, slot, reservasi anti-bentrok, manajemen admin, dashboard, ekspor CSV, notifikasi, dan Web Push. Dokumen ini mendefinisikan **frontend** yang memakai backend tersebut.

Branch ini adalah **prototipe uji**. Tujuannya:

1. Menguji backend dari ujung ke ujung lewat antarmuka nyata, bukan hanya lewat tes otomatis dan Swagger.
2. Menjadi dasar fungsional bagi tim UI/UX yang merancang tampilan akhir secara paralel: perilaku, alur, dan pemakaian API sudah benar, sehingga desainer cukup mengganti lapisan tampilan.
3. Memberi pemilik versi yang bisa dicoba sebelum demo 8 Desember 2026.

Bukan tujuan: tampilan final, branding, atau aset visual. Tampilan mengikuti `DESIGN_SPEC.md` (modern minimalism, hitam putih, hanya tema terang) dan akan diganti atau disempurnakan oleh desainer.

### 1.1 Indikator keberhasilan

| Indikator                                                                        | Cara memeriksa                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Customer dapat memesan tanpa bantuan                                             | Skenario S-01 selesai di perangkat seluler tanpa petunjuk          |
| Pemilik dapat mengelola harinya                                                  | Skenario S-05 sampai S-10 selesai di desktop                       |
| Setiap endpoint backend yang berhubungan dengan pengguna terpakai minimal sekali | Daftar cakupan endpoint (bagian 11.3) terpenuhi                    |
| Tidak ada angka, kode status, atau pesan mentah dari API yang bocor ke pengguna  | Pemeriksaan manual per modul                                       |
| Desainer dapat mengganti tampilan tanpa mengubah kode data                       | Fitur dipisah menjadi `api` / `queries` / `components` (bagian 10) |

## 2. Konteks dan kolaborasi

- **Dua orang, dua jalur.** Pembuat frontend fungsional (prototipe ini, dibantu agen AI) dan satu orang UI/UX. Keduanya akan bertemu di `develop` pada repo `nail-art-frontend-app`. Prototipe ini sengaja berada di branch terpisah supaya tidak mengganggu pekerjaan desainer.
- **Aturan agar mudah digabung:** semua nilai visual berasal dari token di `src/styles.css`; halaman dibagi menjadi lapisan data (hook) dan lapisan tampilan (komponen); folder fitur tidak saling mengimpor isi dalamnya.
- **Backend tidak diubah dari repo ini.** Celah kontrak dicatat di bagian 14 dan disampaikan ke pemilik backend.
- Ada folder `the-nail-palace-frontend-app` di mesin yang sama dengan scaffold lain (satu commit). Dokumen ini tidak memakainya.

## 3. Ruang lingkup

### 3.1 Dalam lingkup

- Situs customer: beranda, katalog layanan, pemesanan (wizard), cek status dan pembatalan.
- Aplikasi admin: login, reservasi (daftar, detail, ubah status, jadwal ulang, catatan, buat manual, tautan WhatsApp), layanan dan artist (CRUD), jam operasional dan blokir waktu (dengan penanganan konflik), dashboard, ekspor CSV, kotak masuk notifikasi, dan Web Push.
- Responsif: situs customer mengutamakan seluler; admin mengutamakan desktop tetapi tetap dapat dipakai di tablet dan seluler.
- Bahasa antarmuka Indonesia.

### 3.2 Di luar lingkup

- Tema gelap, multi-bahasa, branding akhir, ilustrasi, dan animasi kompleks.
- Pembayaran, akun customer, ulasan, dan pengiriman WhatsApp otomatis (backend memang tidak mengirim; hanya menyiapkan tautan `wa.me`).
- Server-side rendering, server function, dan BFF (lihat bagian 10.1).
- Pengelolaan akun admin (tambah atau hapus admin): tidak ada endpoint-nya.
- Skor risiko no-show (FR-16 backend belum ada).
- Aplikasi native.

## 4. Pengguna

| Persona               | Kebutuhan                                                                                                                | Perangkat                        | Akses                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | -------------------------------------- |
| **Customer**          | Melihat layanan, memesan jadwal sendiri, memastikan pesanan, membatalkan bila berhalangan                                | Ponsel (utama)                   | Tanpa akun; kode booking + nomor HP    |
| **Pemilik (`owner`)** | Melihat jadwal hari ini, mengonfirmasi atau menolak, memindah jadwal, memblokir libur, melihat ringkasan, mengunduh data | Laptop di studio, ponsel di luar | Login; semua fitur termasuk ekspor CSV |
| **Staf (`staff`)**    | Sama dengan pemilik kecuali ekspor CSV                                                                                   | Ponsel, tablet                   | Login; endpoint ekspor menjawab 403    |

## 5. Peta halaman

URL bahasa Indonesia untuk halaman customer; kode tetap berbahasa Inggris.

### 5.1 Situs customer

| Route             | Halaman                                                           | Requirement |
| ----------------- | ----------------------------------------------------------------- | ----------- |
| `/`               | Beranda                                                           | FE-01       |
| `/layanan`        | Katalog layanan (daftar, filter kategori, detail dalam panel)     | FE-02       |
| `/pesan`          | Wizard pemesanan (langkah ada di parameter pencarian `?langkah=`) | FE-03       |
| `/pesan/berhasil` | Konfirmasi pemesanan terkirim                                     | FE-03       |
| `/cek-booking`    | Cek status dan batalkan                                           | FE-04       |

### 5.2 Aplikasi admin

| Route               | Halaman                                                      | Requirement         |
| ------------------- | ------------------------------------------------------------ | ------------------- |
| `/admin/login`      | Masuk                                                        | FE-05               |
| `/admin`            | Dashboard                                                    | FE-13               |
| `/admin/reservasi`  | Daftar reservasi + panel detail (`?id=`) + buat manual       | FE-06, FE-07, FE-08 |
| `/admin/layanan`    | Kelola layanan                                               | FE-09               |
| `/admin/artist`     | Kelola artist                                                | FE-10               |
| `/admin/jadwal`     | Jam operasional dan blokir waktu (dua tab)                   | FE-11, FE-12        |
| `/admin/notifikasi` | Kotak masuk                                                  | FE-15               |
| `/admin/ekspor`     | Ekspor CSV (hanya owner)                                     | FE-14               |
| `/admin/pengaturan` | Notifikasi perangkat (Web Push), keluar dari semua perangkat | FE-16, FE-05        |
| `*`                 | Halaman tidak ditemukan                                      | FE-17               |

Semua route `/admin/*` kecuali `/admin/login` berada di bawah layout `admin/_app` yang menjaga sesi.

## 6. Kebutuhan fungsional

Prioritas: **P0** wajib untuk prototipe yang bisa didemokan, **P1** penting, **P2** bila waktu ada. Endpoint ditulis relatif terhadap `VITE_API_BASE_URL`.

### 6.1 Situs customer

**FE-01 Beranda (P1)**

- Menampilkan nama studio, satu kalimat penjelasan, tombol utama "Pesan sekarang" ke `/pesan`, tombol sekunder "Cek booking" ke `/cek-booking`, dan beberapa layanan pilihan (data dari `GET /services`, maksimal 6).
- Jam operasional **tidak ditampilkan**: tidak ada endpoint publiknya (lihat bagian 14, Q-01).
- Kriteria: dapat dipakai di lebar 360 px tanpa gulir horizontal; ada keadaan memuat dan gagal untuk daftar layanan.

**FE-02 Katalog layanan (P0)**

- `GET /services` (opsional `?category=`), `GET /services/{id}`. Daftar menampilkan nama, kategori, durasi (format "1 j 30 mnt"), harga (Rupiah), dan gambar bila ada (`image_url`).
- Filter kategori dibangun dari kategori yang ada pada hasil; kategori tersimpan di parameter pencarian `?kategori=`.
- Detail muncul dalam panel (sheet) dengan deskripsi dan tombol "Pesan layanan ini" yang membuka `/pesan?layanan=<id>`.
- Kriteria: layanan nonaktif tidak muncul (backend sudah menyaring); keadaan kosong "Belum ada layanan"; 404 pada detail menampilkan pesan dan menutup panel.

**FE-03 Wizard pemesanan (P0)**

- Langkah: **1 Layanan -> 2 Tanggal & jam -> 3 Data diri -> 4 Tinjau & kirim**. Langkah tersimpan di URL (`?langkah=`) dan pilihan tersimpan di state wizard agar tombol kembali browser berfungsi.
- Langkah 1: pilih layanan (`GET /services`); bila datang dari `?layanan=` langkah ini dilewati.
- Langkah 2: kalender dengan batas hari ini sampai `VITE_MAX_ADVANCE_DAYS` hari ke depan; setelah tanggal dipilih, ambil `GET /availability?service_id&date` dan tampilkan slot (jam mulai, "10.00"). Slot kosong -> "Tidak ada jadwal tersedia pada tanggal ini, coba tanggal lain." Pemilihan artist **disembunyikan secara default**; tautan kecil "Pilih artist" menampilkan daftar dari `GET /artists`, lalu availability diambil ulang dengan `artist_id`, dan hanya slot milik artist itu yang ditampilkan.
- Langkah 3: nama (wajib, maks 100), nomor HP (wajib; menerima `08...`, `62...`, `+62...`; tampilkan hasil normalisasi `+62...`; hanya nomor seluler Indonesia valid), catatan (opsional, maks 500), tautan gambar referensi (opsional, `http(s)`, maks 2048).
- Langkah 4: ringkasan (layanan, tanggal-jam WIB, durasi, harga, artist "Ditentukan studio" atau nama), tombol "Kirim pemesanan" -> `POST /bookings` dengan `start_at` persis seperti dikembalikan availability.
- Setelah `201`: pindah ke `/pesan/berhasil` yang menampilkan **kode booking** besar, tombol salin, ringkasan, status "Menunggu konfirmasi", dan penjelasan bahwa pemilik akan mengonfirmasi. Tampilkan peringatan: "Simpan kode ini bersama nomor HP Anda untuk mengecek atau membatalkan pesanan." Data hanya ada di state navigasi; me-refresh halaman menampilkan arahan ke `/cek-booking`.
- Kriteria penerimaan:
  - `409 SLOT_UNAVAILABLE` saat kirim: kembali ke langkah 2, ambil ulang slot, tampilkan pesan "Jadwal tersebut baru saja terisi. Silakan pilih jam lain." Data diri tidak hilang.
  - `422`: pesan per kolom (lihat bagian 8). `404` layanan: kembali ke langkah 1.
  - `429`: tampilkan "Terlalu banyak percobaan" dengan hitung mundur dari `Retry-After`; tombol kirim nonaktif sampai habis.
  - Tombol kirim dinonaktifkan selama permintaan berjalan (tidak ada kirim ganda).
  - Seluruh alur dapat diselesaikan hanya dengan papan ketik.

**FE-04 Cek status dan batalkan (P0)**

- Formulir kode booking (format `NP-YYYYMMDD-XXXX`, tidak peka huruf besar-kecil) + nomor HP -> `GET /bookings/{code}?phone=`.
- Hasil: status (lencana), layanan, tanggal-jam WIB, artist, harga, kode. Bila `schedule_conflict = true`: pita informasi "Jadwal Anda terpengaruh perubahan jadwal studio. Pemilik akan menghubungi Anda."
- Tombol "Batalkan pemesanan" hanya untuk `pending` dan `confirmed` -> dialog konfirmasi dengan alasan opsional (maks 255) -> `PATCH /bookings/{code}/cancel`.
- Kriteria: `404` (kode atau nomor salah, nomor tidak valid) selalu menampilkan **satu pesan yang sama** "Reservasi tidak ditemukan. Periksa kode booking dan nomor HP Anda." dan tidak membedakan penyebabnya; `409` saat batal menampilkan pesan dari bagian 8; setelah batal, tampilan memuat ulang dan menunjukkan status Dibatalkan; `429` ditangani seperti FE-03.

### 6.2 Aplikasi admin

**FE-05 Autentikasi dan sesi (P0)**

- Login `POST /auth/login` (email, kata sandi); simpan token sesuai bagian 10.2; ambil profil `GET /auth/me` (nama, peran).
- Penjaga route: tanpa sesi valid -> redirect ke `/admin/login?lanjut=<path>`; setelah login kembali ke tujuan semula.
- Token akses diperbarui otomatis saat `401`: **satu pembaruan pada satu waktu**, lintas permintaan dan lintas tab (bagian 10.2). Bila pembaruan gagal -> sesi dibersihkan dan kembali ke login dengan pesan "Sesi berakhir, silakan masuk lagi."
- Keluar: `POST /auth/logout` (dengan refresh token) lalu bersihkan sesi; "Keluar dari semua perangkat": `POST /auth/logout-all`.
- Kriteria: kredensial salah -> "Email atau kata sandi salah" (tidak membedakan); `429` -> pesan dan hitung mundur (batas percobaan gagal); tombol masuk nonaktif saat berjalan; bidang kata sandi dapat ditampilkan/disembunyikan; tidak ada token di URL, log konsol, maupun penyimpanan selain yang dijelaskan di bagian 10.2.

**FE-06 Daftar reservasi (P0)**

- `GET /admin/bookings` dengan filter `date_from`, `date_to`, `status`, `artist_id`, `q` (nama, nomor HP `08...`/`+62...`, atau kode), `page`, `per_page` (default 20). Urutan dari backend: `start_at` naik.
- Semua filter dan halaman tersimpan di parameter pencarian URL (tervalidasi oleh route). Tampilan awal: hari ini sampai 7 hari ke depan.
- Kolom: waktu (tanggal-jam WIB), pelanggan, layanan, artist, status, sumber (online/admin), harga. Penanda "Bentrok jadwal" bila `schedule_conflict`.
- Pintasan cepat: Hari ini, Besok, 7 hari, Menunggu konfirmasi (status `pending`, semua tanggal).
- Kriteria: pencarian ditunda 300 ms; keadaan kosong menjelaskan filter aktif dan menyediakan "Hapus filter"; paginasi menampilkan total; `422` pada rentang terbalik dicegah di formulir.

**FE-07 Detail dan tindakan reservasi (P0)**

- Klik baris membuka panel detail (`/admin/reservasi?id=<id>`; `GET /admin/bookings/{id}`): semua data, catatan customer, catatan admin, alasan pembatalan, kode, sumber, waktu dibuat.
- **Ubah status** (`PATCH /admin/bookings/{id}/status`): tombol hanya untuk transisi yang sah: `pending` -> Konfirmasi / Batalkan; `confirmed` -> Selesai / Tidak hadir / Batalkan. Batalkan wajib alasan (maks 255). Selesai dan Tidak hadir **dinonaktifkan sebelum waktu mulai** dengan petunjuk "Tersedia setelah jadwal dimulai." Status akhir tidak punya tombol.
- **Jadwal ulang** (`PATCH /admin/bookings/{id}`, hanya `pending`/`confirmed`): ganti tanggal-jam (slot dari `GET /availability` untuk layanan dan artist reservasi), artist, atau layanan. Mengganti layanan memperingatkan "Harga akan mengikuti layanan baru." Keterbatasan: waktu reservasi itu sendiri tidak muncul sebagai tersedia (bagian 14, Q-02).
- **Catatan admin** dan **catatan customer** dapat diubah di status apa pun; mengosongkan menghapus catatan.
- **Hubungi via WhatsApp:** tombol dari `reminder_url` (hanya `pending`/`confirmed`) dibuka di tab baru.
- Kriteria: setiap tindakan menutup dengan toast hasil dan memuat ulang daftar serta detail; `409 INVALID_STATUS_TRANSITION` (mis. dua admin bersamaan) -> pesan dan muat ulang data; `409 SLOT_UNAVAILABLE` saat jadwal ulang -> pesan dan ambil ulang slot; `404` -> panel ditutup dengan pesan; tindakan merusak (batal) memakai dialog konfirmasi.

**FE-08 Buat reservasi manual (P0)**

- Tombol "Reservasi baru" di daftar -> dialog/sheet dengan alur ringkas yang sama dengan FE-03 (layanan, tanggal-jam, artist opsional, data diri). `POST /admin/bookings`; status langsung `confirmed`.
- Kriteria: aturan slot sama dengan online (`409` ditangani seperti FE-03); setelah sukses daftar dimuat ulang dan reservasi baru disorot.

**FE-09 Kelola layanan (P1)**

- `GET /admin/services` (termasuk nonaktif), `POST /admin/services`, `PUT /admin/services/{id}`, `DELETE /admin/services/{id}`.
- Bidang: nama (maks 120), kategori (maks 50), deskripsi (maks 1000), harga (bilangan bulat Rupiah 0 sampai 100.000.000), durasi (menit, kelipatan 15, 15 sampai 480), `image_url`, aktif.
- Hapus memakai dialog konfirmasi; backend menonaktifkan layanan yang sudah punya reservasi -> beri tahu hasilnya ("Layanan dinonaktifkan karena sudah punya reservasi") bila status berubah menjadi nonaktif, bukan terhapus.
- Kriteria: tabel menampilkan lencana Aktif/Nonaktif; formulir menolak durasi bukan kelipatan 15 sebelum kirim; `422` per kolom.

**FE-10 Kelola artist (P1)**

- `GET/POST /admin/artists`, `PUT/DELETE /admin/artists/{id}`. Bidang: nama (maks 80), `photo_url`, aktif. Hapus = nonaktifkan (jelaskan di dialog).
- Kriteria: sama dengan FE-09; menonaktifkan artist yang dipakai reservasi mendatang menampilkan peringatan.

**FE-11 Jam operasional (P0)**

- `GET /admin/business-hours` dan `PUT /admin/business-hours` (selalu tepat 7 hari, 0 = Minggu sampai 6 = Sabtu; tampilkan mulai Senin). Per hari: buka/tutup, jam buka, jam tutup, istirahat opsional (mulai dan selesai berpasangan).
- Validasi sisi klien yang sama dengan backend: jam buka < jam tutup; istirahat di dalam jam buka dan berpasangan; hari tutup tanpa jam. Tombol "Salin ke semua hari kerja".
- Kriteria: simpan mengganti satu minggu secara atomik; `422` menandai hari dan kolom yang salah; perubahan hanya berlaku untuk slot ke depan (tulis di bawah judul); peringatan keluar halaman bila ada perubahan belum disimpan.

**FE-12 Blokir waktu (P0)**

- Daftar `GET /admin/blocked-slots` (opsional `date_from`/`date_to`), hapus `DELETE /admin/blocked-slots/{id}`.
- Buat blokir: seluruh studio atau satu artist, mulai, selesai (maks 366 hari), alasan (maks 255). **Alur wajib:** (1) kirim `POST /admin/blocked-slots/check`; (2) bila `can_block = true` -> `POST /admin/blocked-slots`; (3) bila ada konflik -> dialog "Ada N reservasi pada waktu ini" berisi daftar (kode, pelanggan, layanan, waktu, status) dengan tautan WhatsApp `contact_url` per reservasi, dan tombol "Tetap blokir" yang mengirim `acknowledge_conflicts: true`. Jawaban `409 BLOCK_HAS_BOOKINGS` dari pembuatan biasa ditangani dengan dialog yang sama.
- Setelah memblokir, tampilkan ringkasan reservasi terdampak (`affected_bookings`) dan petunjuk "Hubungi pelanggan lalu jadwalkan ulang atau batalkan reservasinya di halaman Reservasi." Tidak ada pembatalan otomatis.
- Kriteria: alasan pemilik tidak pernah muncul di pesan WhatsApp (backend sudah menjaga ini; jangan menggabungkannya di klien).

**FE-13 Dashboard (P0)**

- `GET /admin/dashboard/summary?date_from&date_to` (keduanya wajib, maks 366 hari). Pilihan rentang: 7 hari, 30 hari, bulan ini, bulan lalu, kustom.
- Menampilkan: total reservasi, jumlah per status, **angka no-show**, **rasio reservasi online**, **pendapatan (selesai)**, **rata-rata menit konfirmasi**.
- Nilai `null` (rasio atau rata-rata) tampil sebagai "—" dengan teks bantu "Belum ada data", bukan 0%. Pendapatan memakai format Rupiah. Rincian per status memakai batang sederhana (CSS), tanpa pustaka grafik.
- Kriteria: perubahan rentang tersimpan di URL; keadaan memuat tidak menggeser tata letak; angka memakai angka tabular.

**FE-14 Ekspor CSV (P2)**

- Halaman `/admin/ekspor` hanya untuk `owner` (menu disembunyikan bagi `staff`; akses langsung menampilkan "Anda tidak memiliki akses"). Filter opsional `date_from`, `date_to`, `status`.
- Unduh lewat axios sebagai `blob` (token bearer wajib), simpan dengan nama dari header `Content-Disposition`. Tampilkan penjelasan isi: tanpa nama, nomor HP, kode booking, dan catatan bebas; pelanggan dikenali lewat `customer_ref`.
- Kriteria: indikator proses selama mengunduh; `403` dan `422` ditangani; tidak ada tautan `<a href>` langsung ke endpoint.

**FE-15 Notifikasi (P1)**

- Ikon lonceng di header admin dengan lencana jumlah belum dibaca dari `GET /admin/notifications/unread-count`, diperbarui tiap 30 detik saat tab terlihat dan saat tab kembali aktif.
- `/admin/notifikasi`: daftar `GET /admin/notifications` (filter "Belum dibaca", paginasi), tandai satu dibaca `PATCH /admin/notifications/{id}/read` (saat dibuka), "Tandai semua dibaca" `POST /admin/notifications/read-all`. Setiap item bertaut ke `/admin/reservasi?id=<booking_id>` bila `booking_id` ada.
- Jenis: `new_booking`, `booking_cancelled`, `unconfirmed_reminder`, `upcoming_reminder`, `schedule_conflict` masing-masing dengan ikon dan judul dari API.
- Kriteria: status baca per admin (membaca di sini tidak memengaruhi admin lain, sudah dijamin backend); kotak masuk hanya memuat 30 hari terakhir (sebutkan di keadaan kosong).

**FE-16 Web Push (P1)**

- Di `/admin/pengaturan`: bagian "Notifikasi di perangkat ini" dengan status (tidak didukung, belum diizinkan, diizinkan, diblokir) dan tombol Aktifkan/Matikan.
- Aktifkan: `GET /admin/push/public-key` -> daftarkan service worker `public/sw.js` -> minta izin -> `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` -> `POST /admin/push-subscriptions` dengan `subscription.toJSON()`. Matikan: `unsubscribe()` lalu `DELETE /admin/push-subscriptions` dengan `endpoint`.
- Service worker menampilkan notifikasi dari payload `{ notification_id, booking_id, type, title, body }` dan membuka `/admin/reservasi?id=<booking_id>` saat diklik (memfokuskan tab yang sudah ada bila ada).
- Kriteria: `404` dari `public-key` berarti Web Push mati di server -> sembunyikan bagian ini tanpa pesan galat; `422` untuk endpoint push yang ditolak (browser tidak didukung) -> pesan jelas; berfungsi di `localhost` dan HTTPS saja; tidak ada data pribadi di payload yang ditampilkan.

### 6.3 Lintas fungsi

**FE-17 Kerangka, navigasi, dan fondasi (P0)**

- Layout customer: header (wordmark, "Layanan", "Cek booking", tombol "Pesan"), footer sederhana. Layout admin: sidebar (desktop) atau menu geser (seluler) dengan lonceng notifikasi, nama pengguna, dan tombol keluar.
- Halaman tidak ditemukan, pembatas galat tingkat route, dan penanganan galat jaringan ("Tidak dapat terhubung ke server").
- Klien API, tipe dari kontrak, penjaga auth, pemformat (uang, tanggal, waktu, telepon), token desain, tes dasar, `.env.example`.

**FE-18 Keadaan dan polesan (P1)**

- Setiap daftar dan formulir punya keadaan memuat (kerangka), kosong, dan galat dengan tindakan "Coba lagi"; tidak ada layar kosong tanpa penjelasan.
- Pemeriksaan aksesibilitas dasar (bagian 9) dan uji asap ujung ke ujung.

## 7. Alur utama

**Customer memesan (S-01):** `/` -> "Pesan sekarang" -> pilih layanan -> pilih tanggal -> pilih jam -> isi data -> tinjau -> kirim -> kode booking -> (nanti) `/cek-booking`.

**Pemilik memproses pesanan baru (S-05):** notifikasi (lonceng atau push) "Reservasi baru" -> buka detail -> Konfirmasi -> tombol WhatsApp untuk memberi tahu customer.

**Pemilik memblokir libur (S-08):** `/admin/jadwal` -> Blokir waktu -> pilih rentang -> sistem memeriksa -> bila ada reservasi: daftar + WhatsApp -> "Tetap blokir" -> buka Reservasi (penanda bentrok) -> jadwalkan ulang atau batalkan dengan alasan -> catat kesepakatan di catatan admin.

**Akhir hari (S-07):** Reservasi hari ini -> tandai Selesai atau Tidak hadir -> Dashboard memperlihatkan angka diperbarui.

## 8. Penanganan galat

Semua galat API berbentuk `{ error: { code, message, details? } }`. Antarmuka memetakan `code` dan status HTTP ke pesan Indonesia berikut; pesan API hanya dipakai bila sudah ramah pengguna dan tidak bertentangan dengan tabel.

| Status / kode                         | Sumber                  | Perilaku antarmuka                                                                                                                                                                  |
| ------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada respons / timeout           | Jaringan                | Pesan "Tidak dapat terhubung ke server. Periksa koneksi Anda." + tombol Coba lagi; data yang sudah diisi dipertahankan                                                              |
| `401 UNAUTHORIZED` pada `/admin/*`    | Token kedaluwarsa       | Pembaruan token otomatis (satu kali) lalu ulangi permintaan; bila gagal -> login ulang                                                                                              |
| `401 UNAUTHORIZED` pada `/auth/login` | Kredensial salah        | "Email atau kata sandi salah."                                                                                                                                                      |
| `403 FORBIDDEN`                       | Peran                   | "Anda tidak memiliki akses ke fitur ini." (mis. ekspor oleh staf)                                                                                                                   |
| `404 NOT_FOUND`                       | Sumber daya             | Sesuai konteks: reservasi publik memakai satu pesan generik (FE-04); admin menutup panel dan memuat ulang daftar                                                                    |
| `409 SLOT_UNAVAILABLE`                | Pesan atau jadwal ulang | "Jadwal tersebut baru saja terisi atau tidak tersedia. Silakan pilih jam lain." dan ambil ulang slot                                                                                |
| `409 INVALID_STATUS_TRANSITION`       | Ubah status, batal      | Pesan dari API (sudah berbahasa Indonesia, mis. batas waktu pembatalan) + muat ulang data                                                                                           |
| `409 BLOCK_HAS_BOOKINGS`              | Buat blokir             | Dialog konflik (FE-12)                                                                                                                                                              |
| `422 VALIDATION_ERROR`                | Input                   | Tampilkan `details[].field` + `message` pada kolom yang bersangkutan; bila kolom tidak dikenali, tampilkan sebagai galat formulir. `field` berawalan `query.` berarti parameter URL |
| `429 RATE_LIMITED`                    | Pembatasan laju         | "Terlalu banyak permintaan. Coba lagi dalam N detik." (dari `Retry-After`), tombol terkait nonaktif sampai habis                                                                    |
| `500 INTERNAL_ERROR`                  | Server                  | "Terjadi kesalahan pada server. Coba lagi sebentar lagi." + tombol Coba lagi                                                                                                        |
| `413`                                 | Body terlalu besar      | Pesan umum bahwa data terlalu besar                                                                                                                                                 |

Aturan umum: tidak pernah menampilkan kode galat mentah, jejak tumpukan, atau teks JSON kepada pengguna; permintaan GET boleh dicoba ulang otomatis satu kali untuk galat jaringan, permintaan yang mengubah data tidak boleh dicoba ulang otomatis.

## 9. Kebutuhan non-fungsional

| Kategori              | Kebutuhan                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aksesibilitas**     | WCAG 2.2 AA sebagai target: kontras teks minimal 4,5:1, batas kolom isian minimal 3:1, fokus selalu terlihat, seluruh fungsi dapat dipakai dengan papan ketik, label pada setiap isian, `aria-live` untuk toast dan hasil asinkron, sasaran sentuh minimal 44 px pada halaman customer, menghormati `prefers-reduced-motion`. Karena palet hitam putih, **informasi tidak boleh hanya dibawa warna**; status memakai ikon + teks + bentuk |
| **Responsif**         | Titik henti 360, 640, 768, 1024, 1280 px. Customer: seluler-dulu. Admin: tabel menjadi kartu di bawah 768 px                                                                                                                                                                                                                                                                                                                              |
| **Kinerja**           | Muat awal beranda < 2 detik pada koneksi 4G sedang; pemisahan kode per route; gambar memakai `loading="lazy"` dan dimensi tetap (mencegah pergeseran tata letak); tidak ada pustaka besar untuk grafik atau tanggal selain yang diperlukan komponen                                                                                                                                                                                       |
| **Keamanan**          | Token akses hanya di memori; token penyegar di `localStorage` (keputusan dengan risiko, bagian 10.2); tidak ada token di URL atau log; semua keluaran dari API dirender sebagai teks (React meng-escape; jangan memakai `dangerouslySetInnerHTML`); tautan eksternal `rel="noopener noreferrer"`; tautan gambar dari pengguna (`image_url`, `reference_image_url`) hanya `http(s)`                                                        |
| **Privasi**           | Nomor HP tidak dicatat di konsol; kode booking dan nomor HP tidak disimpan di penyimpanan peramban oleh halaman customer; bagian ekspor menjelaskan bahwa data pribadi tidak diekspor                                                                                                                                                                                                                                                     |
| **Peramban**          | Dua versi terbaru Chrome, Edge, Firefox, Safari (iOS 16.4+ untuk Web Push, dan hanya bila situs ditambahkan ke layar utama)                                                                                                                                                                                                                                                                                                               |
| **Bahasa dan format** | Antarmuka Indonesia; tanggal `id-ID` zona `Asia/Jakarta` ("Selasa, 10 November 2026"), jam 24 jam dengan titik ("10.00"), Rupiah tanpa desimal ("Rp150.000")                                                                                                                                                                                                                                                                              |
| **Kemudahan diganti** | Lihat bagian 2: token tunggal, pemisahan data dan tampilan                                                                                                                                                                                                                                                                                                                                                                                |

## 10. Arsitektur dan keputusan teknis

### 10.1 Pola umum

- **SPA langsung ke API** (mode SPA TanStack Start; `defaultSsr: false`). Tidak ada server function, BFF, atau sesi cookie. Alasan: backend sudah menyediakan CORS allowlist dan token bearer; menjaga prototipe sederhana dan mudah diganti desainer. Alternatif (BFF dengan cookie `httpOnly`) dicatat di bagian 14, Q-05.
- **Lapisan** (rinci di `CLAUDE.md`): `routes` (tipis) -> `features/*` (`api`, `queries`, `schemas`, `components`) -> `lib/api` (klien, galat, tipe) dan `components/ui` (shadcn).
- **Tipe dari kontrak:** `openapi-typescript` menghasilkan `src/lib/api/schema.gen.ts` dari `openapi.yaml` backend (skrip `api:types`); tipe tidak ditulis tangan.
- **Data server:** TanStack Query. Kunci query dibuat lewat pabrik per fitur; mutasi menginvalidasi kunci terkait di `queries.ts`. `staleTime` pendek untuk reservasi dan notifikasi, panjang untuk katalog.
- **Filter dan paginasi** di parameter pencarian route (divalidasi zod), bukan state lokal.
- **Formulir:** react-hook-form + zod; pemetaan `422` ke kolom lewat pembantu bersama di `lib/api/errors.ts`.

### 10.2 Autentikasi admin

| Hal                                                   | Keputusan                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token akses (15 menit)                                | Hanya di memori modul; hilang saat muat ulang, lalu diperbarui dari token penyegar                                                                                                                                                                                                               |
| Token penyegar (7 hari, **diputar setiap pemakaian**) | `localStorage`, kunci `np.refresh`                                                                                                                                                                                                                                                               |
| Pembaruan                                             | Satu per satu (`single-flight`) di dalam satu tab (satu `Promise` bersama) dan **lintas tab lewat Web Locks API** (`navigator.locks.request('np-refresh', ...)`); di dalam kunci, token penyegar dibaca ulang dari `localStorage` dan, bila tab lain sudah memperbaruinya, tidak diperbarui lagi |
| Mengapa ketat                                         | Backend mencabut **semua sesi** admin bila token penyegar yang sudah dipakai diajukan lagi; dua pembaruan paralel dengan token yang sama akan menjatuhkan sesi                                                                                                                                   |
| Tersimpan sebelum dipakai                             | Token penyegar baru disimpan **sebelum** permintaan yang gagal diulang                                                                                                                                                                                                                           |
| Kegagalan                                             | Hapus sesi, arahkan ke login, pesan "Sesi berakhir"                                                                                                                                                                                                                                              |
| Risiko diterima                                       | XSS dapat membaca `localStorage`. Mitigasi: tidak ada `dangerouslySetInnerHTML`, CSP dari backend/hosting, dependensi minimal. Untuk produksi, pertimbangkan BFF (Q-05)                                                                                                                          |

### 10.3 Waktu, uang, telepon

Lihat `CLAUDE.md` (Conventions). Semua pemformat berada di `lib/format.ts` dan memiliki tes; tidak ada pemformatan tanggal di dalam komponen.

### 10.4 Struktur modul dan penamaan route

Lihat `CLAUDE.md` (Architecture). Penamaan URL: Indonesia untuk halaman, Inggris untuk kode.

### 10.5 Dependensi yang diusulkan

Ditambahkan di modul FE-0 (versi diambil yang stabil terbaru saat itu):

| Paket                                                                                                          | Untuk                 |
| -------------------------------------------------------------------------------------------------------------- | --------------------- |
| `@tanstack/react-query` (+ devtools dev)                                                                       | Data server           |
| `react-hook-form`, `@hookform/resolvers`, `zod`                                                                | Formulir dan validasi |
| `sonner` (via shadcn)                                                                                          | Toast                 |
| `react-day-picker`, `date-fns` (via shadcn `calendar`)                                                         | Kalender              |
| `openapi-typescript` (dev)                                                                                     | Tipe dari kontrak     |
| `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `msw` (dev) | Pengujian             |
| `@playwright/test` (dev, FE-11, opsional)                                                                      | Uji ujung ke ujung    |

Komponen shadcn yang dibutuhkan: `button`, `input`, `label`, `textarea`, `select`, `checkbox`, `switch`, `calendar`, `popover`, `dialog`, `alert-dialog`, `sheet`, `sidebar`, `table`, `badge`, `tabs`, `tooltip`, `sonner`, `skeleton`, `separator`, `dropdown-menu`, `alert`, `pagination`, `card`, `form`/field helpers.

## 11. Strategi pengujian

### 11.1 Otomatis

| Jenis                                     | Alat                                  | Isi                                                                                                                                                                                               |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                                      | Vitest                                | `lib/format.ts`, `lib/api/errors.ts` (pemetaan galat), penyimpan token dan pembaruan single-flight (termasuk dua pemanggil bersamaan dan kegagalan), skema zod per fitur, pembantu pemetaan `422` |
| Komponen                                  | Vitest + Testing Library + MSW        | Wizard pemesanan (jalur normal, `409`, `422`, `429`), cek status (`404` generik), dialog konflik blokir, pemilihan transisi status yang sah, tampilan `null` di dashboard                         |
| Kontrak                                   | MSW dibangun dari `openapi.yaml`      | Pastikan mock sesuai kontrak (bentuk respons) agar tes komponen tidak menyimpang                                                                                                                  |
| Uji asap ujung ke ujung (opsional, FE-11) | Playwright terhadap backend sungguhan | S-01, S-05, S-08                                                                                                                                                                                  |

Target: logika di `lib/` dan `features/*/{api,queries,schemas}` >= 80% cakupan; tidak ada tes snapshot markup.

### 11.2 Skenario uji manual (menguji backend lewat UI)

| ID   | Skenario                                                                                     | Yang divalidasi di backend                                                                          |
| ---- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| S-01 | Customer memesan tanpa memilih artist                                                        | Slot dari availability, penugasan artist otomatis, status `pending`, kode booking                   |
| S-02 | Dua tab memesan slot yang sama                                                               | `409 SLOT_UNAVAILABLE`, tidak ada dobel pesan                                                       |
| S-03 | Memesan tepat setelah reservasi lain (jeda 15 menit)                                         | Aturan jeda antar-reservasi pada availability                                                       |
| S-04 | Cek status dengan nomor salah                                                                | `404` generik                                                                                       |
| S-05 | Pemilik mengonfirmasi, menyelesaikan, menandai tidak hadir (sebelum dan sesudah waktu mulai) | Transisi status, larangan selesai sebelum mulai, `confirmed_at`                                     |
| S-06 | Jadwal ulang ke jam kosong, ke jam terisi, ke jam dalam istirahat                            | Aturan slot pada jadwal ulang                                                                       |
| S-07 | Reservasi manual lalu cek di dashboard                                                       | Sumber `admin`, rasio online, pendapatan                                                            |
| S-08 | Blokir waktu yang berisi reservasi                                                           | Pratinjau konflik, `BLOCK_HAS_BOOKINGS`, `acknowledge_conflicts`, `schedule_conflict` di cek status |
| S-09 | Ubah jam operasional lalu cek slot                                                           | Slot mengikuti jam dan istirahat baru                                                               |
| S-10 | Pesanan baru -> lonceng dan push di perangkat admin                                          | Notifikasi dalam transaksi, `unread-count`, Web Push                                                |
| S-11 | Kata sandi salah berulang kali                                                               | Pembatasan laju login (`429`, `Retry-After`)                                                        |
| S-12 | Token akses kedaluwarsa saat sedang bekerja; dua tab admin terbuka                           | Pembaruan token tunggal, tidak ada pencabutan sesi                                                  |
| S-13 | Staf membuka ekspor                                                                          | `403` dan menu tersembunyi                                                                          |

### 11.3 Cakupan endpoint

Semua operasi di `openapi.yaml` yang berhubungan dengan pengguna harus terpakai oleh minimal satu requirement: `/services`, `/services/{id}`, `/artists`, `/availability`, `/bookings*`, `/auth/*`, `/admin/bookings*`, `/admin/services*`, `/admin/artists*`, `/admin/business-hours`, `/admin/blocked-slots*`, `/admin/dashboard/summary`, `/admin/export/bookings.csv`, `/admin/notifications*`, `/admin/push*`, `/admin/push-subscriptions`.

## 12. Rencana pengembangan

Satu modul = satu commit di branch `test/ai-prototype`, urutan tetap. Usulan jadwal (menuju prototipe utuh sebelum demo 8 Desember 2026; sesuaikan dengan kapasitas):

| Modul | Isi                                        | Perkiraan      |
| ----- | ------------------------------------------ | -------------- |
| FE-0  | Fondasi (FE-17)                            | 9 - 13 Nov     |
| FE-1  | Beranda dan katalog (FE-01, FE-02)         | 9 - 13 Nov     |
| FE-2  | Wizard pemesanan (FE-03)                   | 14 - 18 Nov    |
| FE-3  | Cek status dan batal (FE-04)               | 14 - 18 Nov    |
| FE-4  | Login, sesi, penjaga (FE-05)               | 19 - 21 Nov    |
| FE-5  | Daftar dan detail reservasi (FE-06, FE-07) | 19 - 25 Nov    |
| FE-6  | Reservasi manual (FE-08)                   | 24 - 25 Nov    |
| FE-7  | Layanan dan artist (FE-09, FE-10)          | 24 - 27 Nov    |
| FE-8  | Jam operasional dan blokir (FE-11, FE-12)  | 26 - 28 Nov    |
| FE-9  | Dashboard dan ekspor (FE-13, FE-14)        | 29 Nov - 1 Des |
| FE-10 | Notifikasi dan Web Push (FE-15, FE-16)     | 1 - 3 Des      |
| FE-11 | Polesan, aksesibilitas, uji asap (FE-18)   | 4 - 7 Des      |

Titik periksa: **28 Nov** alur customer lengkap + admin mengelola reservasi dan jadwal (prototipe yang bisa diuji pemilik); **3 Des** seluruh fitur; **4 - 7 Des** polesan dan latihan demo.

Prasyarat di luar kode: data layanan dan jam operasional asli di backend (`services.csv`, `jam_operasional.csv`), backend berjalan dengan `CORS_ORIGINS` yang memuat asal frontend, kunci `VAPID_*` di backend untuk menguji push, dan alamat staging bila diuji dari ponsel.

## 13. Definisi selesai

Lihat `CLAUDE.md` (Definition of done). Ringkasnya: kriteria requirement terpenuhi termasuk jalur gagal, `lint` `check` `typecheck` `test` `build` lulus, diuji manual terhadap backend sungguhan, mengikuti `DESIGN_SPEC.md`, dan dokumen terkait diperbarui.

## 14. Risiko dan pertanyaan terbuka

### 14.1 Celah kontrak backend (perlu disampaikan ke pemilik backend)

| ID   | Celah                                                                                 | Dampak                                                                                                           | Usulan                                                                       |
| ---- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Q-01 | Tidak ada endpoint publik untuk jam operasional (`/admin/business-hours` butuh token) | Beranda dan wizard tidak dapat menampilkan jam buka; hari tutup hanya terlihat sebagai "tidak ada slot"          | Tambah `GET /business-hours` publik (hanya hari, jam buka-tutup, istirahat)  |
| Q-02 | `GET /availability` menghitung reservasi itu sendiri sebagai sibuk                    | Pada jadwal ulang admin, jam yang bertumpuk dengan jadwalnya sendiri tampak tidak tersedia (mis. geser 30 menit) | Parameter `exclude_booking_id` untuk admin, atau endpoint availability admin |
| Q-03 | `MAX_ADVANCE_DAYS` dan `SLOT_STEP_MINUTES` tidak dibuka ke klien                      | Frontend memakai nilai tetap dari env (`VITE_MAX_ADVANCE_DAYS`) yang bisa menyimpang                             | Endpoint konfigurasi publik atau menyertakan batas pada respons availability |
| Q-04 | Riwayat status reservasi (FR-11) tidak ada di API                                     | Detail reservasi tidak dapat menampilkan "siapa mengubah apa kapan"                                              | `GET /admin/bookings/{id}/history` bila pemilik membutuhkannya               |
| Q-06 | Pembatalan oleh customer di `CANCEL_MIN_HOURS_BEFORE > 0` hanya diketahui lewat `409` | Tombol batal tampil padahal tidak diizinkan                                                                      | Tampilkan pesan dari API; atau sertakan `can_cancel` pada respons booking    |

### 14.2 Keputusan yang perlu dikonfirmasi

| ID   | Pertanyaan                                                                                        | Default yang dipakai dokumen ini                                                      |
| ---- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Q-05 | Penyimpanan token: SPA dengan token penyegar di `localStorage`, atau BFF dengan cookie `httpOnly` | SPA + `localStorage` (prototipe); evaluasi BFF sebelum produksi                       |
| Q-07 | Foto layanan: tetap berwarna di antarmuka hitam putih?                                            | Ya, antarmuka monokrom, foto produk berwarna alami (lihat `DESIGN_SPEC.md`, bagian 8) |
| Q-08 | Boleh ada satu warna fungsional (merah) hanya untuk galat?                                        | Tidak; galat dibedakan dengan ikon, teks, dan batas tebal                             |
| Q-09 | Penamaan URL Indonesia (`/layanan`, `/pesan`)                                                     | Ya                                                                                    |
| Q-10 | Apakah staf boleh melihat dashboard?                                                              | Ya (backend tidak membatasi)                                                          |

### 14.3 Risiko

| ID  | Risiko                                                       | Dampak                                                      | Mitigasi                                                                               |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| R1  | Pembaruan token paralel mencabut seluruh sesi                | Admin terlempar berulang kali                               | Single-flight + Web Locks + tes khusus (S-12)                                          |
| R2  | Desainer dan prototipe menyimpang                            | Penggabungan sulit                                          | Token tunggal, pemisahan data/tampilan, aturan "jangan memindahkan file di luar modul" |
| R3  | `base-nova` memakai Base UI; contoh internet umumnya Radix   | Agen AI menghasilkan API komponen yang salah                | `CLAUDE.md` memperingatkan; gunakan CLI shadcn untuk menambah komponen                 |
| R4  | Web Push butuh HTTPS dan service worker                      | Tidak dapat diuji dari ponsel di jaringan lokal tanpa HTTPS | Uji di `localhost`; untuk ponsel gunakan terowongan HTTPS atau staging                 |
| R5  | Data asli belum di-seed                                      | Demo tampak kosong                                          | Isi lewat halaman admin layanan dan jam operasional sebelum demo                       |
| R6  | Nilai env klien menyimpang dari backend (`MAX_ADVANCE_DAYS`) | Pemesanan ditolak `422` pada tanggal terjauh                | Q-03; tangani `422` pada tanggal dengan pesan jelas                                    |
| R7  | Tidak ada kerangka uji di scaffold                           | Kualitas tidak terukur                                      | Disiapkan di FE-0                                                                      |

---

## Lampiran A. Status reservasi dan kosakata antarmuka

| Nilai API   | Teks antarmuka      | Arti bagi pengguna                           |
| ----------- | ------------------- | -------------------------------------------- |
| `pending`   | Menunggu konfirmasi | Pesanan diterima, belum dikonfirmasi pemilik |
| `confirmed` | Terkonfirmasi       | Jadwal pasti                                 |
| `completed` | Selesai             | Layanan sudah dilakukan                      |
| `cancelled` | Dibatalkan          | Dibatalkan customer atau pemilik             |
| `no_show`   | Tidak hadir         | Customer tidak datang                        |

| Nilai API (`type` notifikasi) | Teks antarmuka              |
| ----------------------------- | --------------------------- |
| `new_booking`                 | Reservasi baru              |
| `booking_cancelled`           | Dibatalkan customer         |
| `unconfirmed_reminder`        | Belum dikonfirmasi          |
| `upcoming_reminder`           | Jadwal segera dimulai       |
| `schedule_conflict`           | Bentrok dengan blokir waktu |

| Hari (`day_of_week`) | 0      | 1     | 2      | 3    | 4     | 5     | 6     |
| -------------------- | ------ | ----- | ------ | ---- | ----- | ----- | ----- |
| Teks                 | Minggu | Senin | Selasa | Rabu | Kamis | Jumat | Sabtu |
