# Design Spec The Nail Palace

|                     |                                                                                  |
| ------------------- | -------------------------------------------------------------------------------- |
| **Status**          | Draf awal untuk ditinjau pemilik produk dan UI/UX                                |
| **Gaya**            | Modern minimalism                                                                |
| **Warna**           | Hitam dan putih saja (akromatik); **hanya tema terang**                          |
| **Komponen**        | shadcn/ui gaya `base-nova` (Base UI) di atas Tailwind CSS 4                      |
| **Dokumen terkait** | `PRD_Frontend_The_Nail_Palace.md` (perilaku), `CLAUDE.md` (aturan kerja agen AI) |

Dokumen ini adalah **spesifikasi awal** yang membuat prototipe terlihat konsisten. Tim UI/UX bebas menyempurnakannya; bagian 13 menjelaskan apa yang boleh diganti tanpa merusak kode data.

---

## 1. Prinsip desain

1. **Ruang kosong adalah bahan utama.** Jarak lega, satu tindakan utama per layar, tidak ada elemen dekoratif.
2. **Tipografi memimpin.** Hierarki dibangun dari ukuran, berat, dan jarak huruf, bukan dari warna atau kotak berlapis.
3. **Garis tipis, bukan bayangan.** Pemisah dan batas berupa garis 1 px. Tidak ada bayangan, gradien, atau efek kaca.
4. **Hitam putih bukan berarti polos.** Kontras yang tegas (hitam pekat di atas putih) dan satu aksen: tombol utama berwarna hitam penuh.
5. **Konten membawa warna.** Antarmuka monokrom; satu-satunya sumber warna adalah foto hasil nail art.
6. **Status tidak boleh hanya warna.** Karena tidak ada warna, status dibedakan dengan ikon + teks + bentuk (bagian 6).
7. **Tenang dan cepat.** Gerak minimal, tanpa animasi pemanis; keadaan memuat, kosong, dan galat dirancang sama seriusnya dengan keadaan normal.
8. **Seluler dulu untuk customer, padat dan terstruktur untuk admin.**

## 2. Tema dan warna

### 2.1 Aturan

- **Hanya tema terang.** Hapus blok `.dark` dari `src/styles.css`, tambahkan `color-scheme: light`, jangan memakai varian `dark:`.
- **Akromatik penuh.** Semua token berkroma 0. Tidak ada biru, merah, hijau, atau kuning di antarmuka.
- Komponen hanya boleh memakai kelas berbasis token (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). Dilarang nilai hex, `oklch(...)`, atau kelas warna Tailwind (`bg-gray-100`, `text-red-500`) di dalam komponen.

### 2.2 Token

Untuk abu-abu netral, luminans relatif sama dengan L³ (OKLCH), sehingga rasio kontras terhadap putih = 1,05 / (L³ + 0,05).

| Token                                                                                        | Nilai (OKLCH)                         | Perkiraan hex | Dipakai untuk                                                               | Kontras vs putih                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------- | ------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| `--background`                                                                               | `oklch(1 0 0)`                        | `#ffffff`     | Latar halaman                                                               | 1,0                                 |
| `--foreground`                                                                               | `oklch(0.145 0 0)`                    | `#0a0a0a`     | Teks utama, ikon, tombol utama                                              | 19,8:1                              |
| `--primary`                                                                                  | `oklch(0.145 0 0)`                    | `#0a0a0a`     | Tombol utama, slot terpilih, status terkonfirmasi                           | 19,8:1                              |
| `--primary-foreground`                                                                       | `oklch(0.985 0 0)`                    | `#fafafa`     | Teks di atas hitam                                                          | -                                   |
| `--secondary`, `--muted`, `--accent`                                                         | `oklch(0.97 0 0)`                     | `#f5f5f5`     | Latar lembut: baris disorot, kerangka memuat, tombol sekunder               | -                                   |
| `--secondary-foreground`, `--accent-foreground`, `--card-foreground`, `--popover-foreground` | `oklch(0.145 0 0)`                    | `#0a0a0a`     | Teks di atas latar lembut                                                   | 18,6:1 pada `--muted`               |
| `--muted-foreground`                                                                         | `oklch(0.45 0 0)`                     | `#5b5b5b`     | Teks pendukung, label, placeholder                                          | **7,4:1** (6,8:1 di atas `--muted`) |
| `--border`                                                                                   | `oklch(0.92 0 0)`                     | `#e5e5e5`     | Pemisah dan batas dekoratif (kartu, tabel)                                  | 1,3:1 (dekoratif)                   |
| `--input`                                                                                    | `oklch(0.65 0 0)`                     | `#8f8f8f`     | Batas kolom isian, kotak centang, sakelar                                   | **3,2:1** (syarat 3:1)              |
| `--ring`                                                                                     | `oklch(0.145 0 0)`                    | `#0a0a0a`     | Cincin fokus                                                                | 19,8:1                              |
| `--destructive`                                                                              | `oklch(0.145 0 0)`                    | `#0a0a0a`     | Batas dan teks galat (dibedakan oleh ikon dan ketebalan, bagian 5.4)        | 19,8:1                              |
| `--card`, `--popover`                                                                        | `oklch(1 0 0)`                        | `#ffffff`     | Kartu, dialog, menu                                                         | 1,0                                 |
| `--chart-1 .. 5`                                                                             | `0.145 / 0.35 / 0.55 / 0.75 / 0.9`    | gradasi abu   | Batang rincian di dashboard (dibedakan juga dengan label, bukan warna saja) | -                                   |
| `--sidebar`                                                                                  | `oklch(0.985 0 0)`                    | `#fafafa`     | Latar sidebar admin                                                         | -                                   |
| `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent-foreground`                   | `oklch(0.145 0 0)`                    | `#0a0a0a`     | Teks dan penanda aktif                                                      | -                                   |
| `--sidebar-primary-foreground`                                                               | `oklch(0.985 0 0)`                    | `#fafafa`     |                                                                             | -                                   |
| `--sidebar-accent`                                                                           | `oklch(0.94 0 0)`                     | `#eeeeee`     | Item aktif/disorot                                                          | -                                   |
| `--sidebar-border`, `--sidebar-ring`                                                         | `oklch(0.92 0 0)`, `oklch(0.145 0 0)` |               |                                                                             | -                                   |

Perkiraan hex hanya untuk komunikasi dengan desainer; **sumber kebenaran adalah nilai OKLCH di `styles.css`**. Verifikasi kontras dengan alat pemeriksa sebelum menyetujui perubahan nilai.

Tambahan di luar palet: lapisan penutup dialog `oklch(0 0 0 / 0.4)`.

### 2.3 Blok CSS (untuk modul FE-0)

Ganti `:root` dan hapus `.dark` pada `src/styles.css`; sisanya (`@theme inline`, `@layer base`) tetap. Tambahkan `--radius` baru dan `color-scheme`.

```css
:root {
  color-scheme: light;

  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.145 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.145 0 0);
  --destructive: oklch(0.145 0 0);
  --border: oklch(0.92 0 0);
  --input: oklch(0.65 0 0);
  --ring: oklch(0.145 0 0);

  --chart-1: oklch(0.145 0 0);
  --chart-2: oklch(0.35 0 0);
  --chart-3: oklch(0.55 0 0);
  --chart-4: oklch(0.75 0 0);
  --chart-5: oklch(0.9 0 0);

  --radius: 0.5rem;

  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.145 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.94 0 0);
  --sidebar-accent-foreground: oklch(0.145 0 0);
  --sidebar-border: oklch(0.92 0 0);
  --sidebar-ring: oklch(0.145 0 0);
}
```

Hapus juga `@custom-variant dark (...)`.

## 3. Tipografi

- **Keluarga:** Inter Variable (sudah terpasang lewat `@fontsource-variable/inter`). Cadangan sistem. Satu keluarga untuk semuanya; hierarki dari ukuran dan berat.
- **Angka tabular** (`font-variant-numeric: tabular-nums`, kelas `tabular-nums`) untuk harga, jam, tanggal, jumlah, dan seluruh kolom tabel.
- **Kode booking** (`NP-20261110-A7K2`) memakai monospace sistem (`font-mono`), `tracking-wider`, agar mudah dibaca dan disalin.
- **Berat:** 400 (isi), 500 (label, navigasi, tombol), 600 (judul). Jangan memakai 700+ kecuali angka besar dashboard.

| Peran                     | Ukuran / tinggi baris        | Berat     | Jarak huruf       | Kelas Tailwind (acuan)                                    |
| ------------------------- | ---------------------------- | --------- | ----------------- | --------------------------------------------------------- |
| Display (beranda)         | 56 / 60 px (seluler 40 / 44) | 600       | -0,03 em          | `text-4xl md:text-6xl font-semibold tracking-tight`       |
| H1 (judul halaman)        | 36 / 40 (seluler 30 / 36)    | 600       | -0,02 em          | `text-3xl md:text-4xl font-semibold tracking-tight`       |
| H2 (bagian)               | 24 / 32                      | 600       | -0,01 em          | `text-2xl font-semibold tracking-tight`                   |
| H3 (judul kartu)          | 18 / 28                      | 600       | 0                 | `text-lg font-semibold`                                   |
| Isi                       | 16 / 24                      | 400       | 0                 | `text-base`                                               |
| Isi kecil / tabel         | 14 / 20                      | 400 - 500 | 0                 | `text-sm`                                                 |
| Keterangan                | 12 / 16                      | 500       | +0,01 em          | `text-xs`                                                 |
| Angka besar (dashboard)   | 36 / 40                      | 600       | -0,02 em          | `text-4xl font-semibold tabular-nums`                     |
| Label huruf kapital kecil | 12 / 16                      | 500       | +0,08 em, kapital | `text-xs uppercase tracking-widest text-muted-foreground` |

Panjang baris teks bacaan maksimal 65 karakter (`max-w-prose`). Rata kiri; tidak ada teks rata kanan-kiri.

## 4. Tata letak, jarak, dan bentuk

- **Grid jarak 4 px.** Skala yang dipakai: 4, 8, 12, 16, 24, 32, 48, 64, 96 (kelas Tailwind `1, 2, 3, 4, 6, 8, 12, 16, 24`).
- **Wadah:** halaman customer `max-w-6xl` (1152 px) dengan `px-4 sm:px-6 lg:px-8`; alur pemesanan dan formulir `max-w-xl` (576 px) di tengah; admin: konten penuh dengan `p-4 md:p-6` di samping sidebar.
- **Titik henti:** 360, 640 (`sm`), 768 (`md`), 1024 (`lg`), 1280 (`xl`).
- **Irama vertikal customer:** antarbagian `py-16 md:py-24`; antarelemen dalam bagian `gap-6` sampai `gap-12`.
- **Radius:** `--radius` 0,5 rem (8 px). Tombol, kolom isian, kartu, dan dialog memakai radius dasar (`rounded-lg`); lencana dan chip jam `rounded-full`; gambar `rounded-md`. Tidak ada sudut tajam atau lingkaran besar sebagai dekorasi.
- **Batas:** 1 px `border-border` untuk pemisah dan kartu; kolom isian 1 px `border-input`. Satu kartu = satu batas; tidak ada kartu di dalam kartu.
- **Bayangan:** tidak ada. Lapisan (dialog, menu, toast) dibedakan dengan batas 1 px dan lapisan penutup.
- **Z-index:** menu < sheet/dialog < toast, memakai tumpukan bawaan komponen.

## 5. Komponen

Semua komponen dibuat dengan CLI shadcn (`bunx --bun shadcn@latest add <nama>`) lalu **hanya token dan varian yang disesuaikan**, bukan strukturnya. Ukuran sasaran sentuh: halaman customer minimal 44 px; admin minimal 32 px di desktop dan 40 px di layar sentuh.

### 5.1 Tombol

| Varian            | Tampilan                                                                                         | Pemakaian                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `default` (utama) | Latar hitam `--primary`, teks putih, tanpa batas                                                 | Satu tindakan utama per layar ("Pesan sekarang", "Kirim pemesanan", "Simpan") |
| `outline`         | Latar putih, batas 1 px `--input`, teks hitam                                                    | Tindakan sekunder; tindakan merusak                                           |
| `secondary`       | Latar `--muted`, teks hitam                                                                      | Tindakan tersier di toolbar                                                   |
| `ghost`           | Tanpa latar, disorot `--muted` saat hover                                                        | Ikon di tabel, navigasi                                                       |
| `link`            | Teks hitam bergaris bawah                                                                        | Tautan di dalam kalimat                                                       |
| `destructive`     | **Bukan merah.** Tampil seperti `outline` dengan ikon `Trash2` atau `XCircle` dan teks tebal 500 | Batalkan, hapus; selalu melalui dialog konfirmasi                             |

Ukuran: `sm` (32 px), `default` (36 px, admin), `lg` (44 px, customer). Tambahkan varian ukuran `xl` (48 px, `text-base`, `px-6`) untuk tombol utama di halaman customer. Keadaan menonaktifkan: opasitas 50 % dan `cursor-not-allowed`; tombol yang sedang memproses menampilkan ikon `Loader2` berputar dan tetap bertuliskan aksinya ("Mengirim...").

### 5.2 Kolom isian

- Tinggi 44 px (customer) / 36 px (admin); radius dasar; batas 1 px `--input`; placeholder `--muted-foreground`.
- Label di atas kolom, 14 px / 500; teks bantu 12 px `--muted-foreground` di bawah kolom.
- Fokus: cincin 2 px `--ring` dengan jarak 2 px (`focus-visible:ring-2 ring-offset-2`), tanpa mengubah warna batas.
- **Galat:** batas diubah menjadi **2 px hitam**, ditambah ikon `AlertCircle` dan pesan 14 px di bawah kolom (`role="alert"`). Galat tidak pernah hanya mengandalkan perubahan warna.
- Nomor HP memakai `inputmode="tel"`, `autocomplete="tel"`; nama `autocomplete="name"`. Pilihan jumlah kecil memakai `Select`; pilihan tanggal memakai `Calendar` dalam `Popover` (desktop) atau `Sheet` bawah (seluler).

### 5.3 Pemilih tanggal dan jam (inti pemesanan)

- **Kalender:** sel 40 px; hari terpilih berlatar hitam bulat-persegi (`rounded-md`) dengan teks putih; hari ini diberi titik kecil di bawah angka; hari di luar rentang (lampau, lewat batas hari ke depan) berwarna `--muted-foreground` dengan opasitas 40 % dan tidak dapat dipilih. Navigasi bulan dengan tombol ikon `ChevronLeft/Right` ber-`aria-label`.
- **Chip jam:** kisi 3 kolom (seluler) sampai 5 kolom (desktop), tinggi 44 px, `rounded-full`, batas 1 px `--input`, teks 14 px tabular ("10.00"). Terpilih: latar hitam, teks putih. Slot yang tidak tersedia **tidak ditampilkan** (backend hanya mengembalikan yang tersedia). Dikelompokkan dengan label "Pagi / Siang / Sore" bila lebih dari 8 slot.
- Memuat slot: 8 chip kerangka (abu `--muted`).

### 5.4 Pesan, galat, dan kabar

- **Alert** (pita sebaris): kotak dengan batas 1 px, ikon di kiri (`Info`, `AlertCircle`), judul tebal, isi 14 px. Alert galat memakai batas kiri 4 px hitam; alert informasi memakai batas 1 px biasa dan latar `--muted`.
- **Toast** (`sonner`): kartu putih, batas 1 px, ikon `CheckCircle2` (berhasil) / `AlertCircle` (galat), posisi bawah-tengah di seluler, kanan-bawah di desktop, hilang otomatis 4 detik (galat 8 detik). Toast hanya untuk konfirmasi tindakan; galat yang butuh keputusan memakai alert atau dialog.
- **Dialog konfirmasi** (`alert-dialog`): judul menyebut akibatnya ("Batalkan reservasi NP-...?"), isi menjelaskan konsekuensi, tombol aman di kiri ("Kembali"), tombol merusak di kanan (varian `destructive`). Fokus awal pada tombol aman.

### 5.5 Tabel dan daftar (admin)

- Baris 52 px, pemisah 1 px `--border`, tanpa garis vertikal, tanpa zebra; hover `--muted` pada `bg-muted/50`. Header 12 px huruf kapital `--muted-foreground`. Angka dan waktu rata kanan atau kiri konsisten dengan `tabular-nums`.
- Kolom waktu menampilkan dua baris: tanggal (500) dan jam (`--muted-foreground`).
- Di bawah 768 px tabel menjadi **daftar kartu** (satu kartu per baris, batas 1 px, jarak 8 px): waktu dan status di atas, pelanggan dan layanan di bawah.
- Paginasi di bawah: "Menampilkan 21 - 40 dari 134" dan tombol Sebelumnya / Berikutnya (`outline`).

### 5.6 Sheet, dialog, menu

- **Sheet** (panel detail reservasi, katalog): dari kanan, lebar 480 px (desktop), penuh dari bawah dengan sudut atas membulat di seluler. Header menempel (judul, tombol tutup), isi dapat digulir, footer menempel untuk tombol tindakan.
- **Dialog**: maksimal 448 px, radius `rounded-lg`, batas 1 px, tanpa bayangan. Mengunci fokus dan dapat ditutup dengan Esc.
- **Dropdown menu**: batas 1 px, item 36 px, ikon 16 px di kiri.

### 5.7 Kartu layanan (customer)

Kartu tanpa latar dan tanpa batas luar; gambar 4:5 (`rounded-md`, batas 1 px), di bawahnya nama (H3), durasi dan kategori (`--muted-foreground`, 14 px), harga (500, tabular). Seluruh kartu dapat difokus dan diklik. Hover: gambar `opacity-90`, nama bergaris bawah.

### 5.8 Lainnya

- **Tab** (jadwal: Jam operasional / Blokir): garis bawah 2 px hitam pada tab aktif, tanpa latar.
- **Sakelar dan kotak centang**: batas `--input`, aktif berlatar hitam dengan tanda putih.
- **Lencana sumber**: teks kecil "Online" atau "Admin" dengan batas 1 px `rounded-full`, tanpa latar.
- **Stepper pemesanan**: teks "Langkah 2 dari 4" + judul langkah, di bawahnya garis tipis 2 px dengan bagian terisi hitam. Bukan lingkaran bernomor.
- **Kerangka memuat**: blok `--muted`, radius mengikuti elemen, tanpa kilau; denyut halus (opasitas 1 -> 0,6) hanya bila gerak tidak dikurangi.

## 6. Lencana status reservasi

Lencana selalu berisi **ikon + teks**; bentuknya berbeda sehingga tetap terbaca dalam cetak abu-abu atau bagi pengguna buta warna. Tinggi 24 px, `rounded-full`, teks 12 px / 500, ikon 14 px.

| Status      | Teks                | Ikon (lucide) | Gaya                                                                                      |
| ----------- | ------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `pending`   | Menunggu konfirmasi | `Clock`       | Berongga: latar putih, batas 1 px hitam, teks hitam                                       |
| `confirmed` | Terkonfirmasi       | `CircleCheck` | Terisi: latar hitam, teks dan ikon putih                                                  |
| `completed` | Selesai             | `CheckCheck`  | Abu lembut: latar `oklch(0.93 0 0)`, tanpa batas, teks hitam                              |
| `cancelled` | Dibatalkan          | `CircleX`     | Berongga putus-putus: batas 1 px putus-putus `--input`, teks `--muted-foreground`         |
| `no_show`   | Tidak hadir         | `UserX`       | Abu lembut + batas putus-putus: latar `--muted`, batas 1 px putus-putus hitam, teks hitam |

Satu komponen `StatusBadge` di `components/common` memetakan nilai API ke tabel ini; tidak ada tempat lain yang menulis ulang gaya status. Penanda **"Bentrok jadwal"** (`schedule_conflict`) memakai ikon `TriangleAlert` dengan batas 2 px hitam dan teks tebal, dipasang di samping status.

Notifikasi: tiap jenis memakai ikon yang berbeda (`CalendarPlus`, `CalendarX`, `Hourglass`, `BellRing`, `TriangleAlert`) di dalam lingkaran 32 px berbatas 1 px.

## 7. Ikon dan gerak

- **Ikon:** hanya `lucide-react`; goresan 1,5 px; ukuran 16 px (teks, tombol), 20 px (navigasi), 24 px (keadaan kosong). Selalu mewarisi warna teks (`currentColor`). Ikon tanpa teks wajib `aria-label`; ikon dekoratif `aria-hidden`.
- **Gerak:** hanya untuk memberi petunjuk perubahan, 120 - 200 ms, `cubic-bezier(0.2, 0, 0, 1)`. Yang dianimasikan: opasitas, geser vertikal 4 px (muncul), tinggi akordeon. Tidak ada pantulan, skala berlebih, atau animasi dekoratif. Dengan `prefers-reduced-motion: reduce` semua transisi menjadi instan dan denyut kerangka dimatikan.

## 8. Citra

- **Antarmuka monokrom, foto berwarna alami** (keputusan awal; lihat Q-07 di PRD). Foto layanan dan artist adalah satu-satunya warna di layar, sehingga hasil kerja studio menjadi pusat perhatian.
- Pengganti bila `image_url` kosong: kotak `--muted` dengan ikon `Sparkles` 24 px di tengah dan huruf awal nama layanan; bukan gambar generik.
- Rasio tetap (kartu 4:5, avatar artist 1:1) dengan `object-cover`, dimensi dideklarasikan (mencegah pergeseran tata letak), `loading="lazy"` di bawah lipatan, teks `alt` berisi nama layanan.
- **Satu saklar untuk versi hitam putih penuh:** semua gambar konten diberi kelas `media` pada pembungkusnya; menambahkan `.media img { filter: grayscale(1) }` di `styles.css` mengubah seluruh situs menjadi hitam putih tanpa menyentuh komponen. Gunakan bila UI/UX memutuskan demikian.
- Wordmark sementara: teks "THE NAIL PALACE" Inter 600, huruf kapital, `tracking-[0.2em]`, 14 px di header. Tanpa logo gambar sampai ada aset resmi.

## 9. Keadaan antarmuka

Setiap daftar, formulir, dan panel punya empat keadaan yang dirancang: **memuat, kosong, galat, normal**.

| Keadaan              | Rancangan                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Memuat**           | Kerangka yang meniru bentuk konten (baris tabel, kartu, chip); tata letak tidak bergeser saat data tiba. Tombol yang sedang berjalan menampilkan spinner dan tetap diberi teks. Indikator `aria-busy` pada kontainer |
| **Kosong**           | Ikon 24 px, judul pendek, satu kalimat penjelasan, dan satu tindakan jika ada ("Hapus filter", "Tambah layanan"). Contoh: "Belum ada reservasi pada rentang ini."                                                    |
| **Galat**            | Alert di tempat konten seharusnya berada: pesan manusiawi (tabel galat di PRD bagian 8) + tombol "Coba lagi". Tidak ada layar putih                                                                                  |
| **Batas laju (429)** | Alert dengan hitung mundur "Coba lagi dalam 42 detik"; tombol terkait nonaktif sampai habis                                                                                                                          |
| **Konflik (409)**    | Pesan kontekstual dekat tindakan; data yang sudah diisi dipertahankan                                                                                                                                                |
| **Tanpa izin (403)** | Halaman sederhana "Anda tidak memiliki akses" dengan tautan kembali                                                                                                                                                  |
| **Offline**          | Pita di bagian atas "Tidak dapat terhubung ke server" yang hilang sendiri saat pulih                                                                                                                                 |

## 10. Wireframe halaman

Wireframe adalah acuan struktur, bukan piksel. `[ ]` tombol, `( )` pilihan, `▮` elemen terisi hitam, `░` kerangka/latar lembut.

### 10.1 Beranda `/` (seluler dan desktop sama alurnya)

```
THE NAIL PALACE                 Layanan   Cek booking   [Pesan]
────────────────────────────────────────────────────────────────

   Nail art yang dirancang
   untuk Anda.                       (Display 56/60, 600)

   Studio nail art di Kota Jambi.    (muted, 18px, max-w-prose)
   Pilih layanan, pilih jam, selesai.

   [ Pesan sekarang ▮ ]  [ Cek booking ]

────────────────────────────────────────────────────────────────
 LAYANAN PILIHAN                           Lihat semua →
 ┌────────┐ ┌────────┐ ┌────────┐
 │ foto   │ │ foto   │ │ foto   │      (4:5, batas 1px)
 │ 4:5    │ │ 4:5    │ │ 4:5    │
 └────────┘ └────────┘ └────────┘
 Gel Polish   Nail Art   Pedicure
 1 j 30 mnt   2 j        1 j
 Rp150.000    Rp250.000  Rp120.000
────────────────────────────────────────────────────────────────
 Cara memesan:  1 Pilih layanan   2 Pilih jam   3 Isi data
────────────────────────────────────────────────────────────────
 © The Nail Palace · Kota Jambi
```

### 10.2 Wizard pemesanan `/pesan?langkah=2`

```
THE NAIL PALACE                                   [ ✕ Batal ]
────────────────────────────────────────────────
 Langkah 2 dari 4
 Pilih tanggal dan jam
 ▮▮▮▮▮▮▮▮▮▮▮▮░░░░░░░░░░░░                (garis 2px)

 Gel Polish · 1 j 30 mnt · Rp150.000   [Ubah]

 Tanggal
 ┌ Senin–Minggu  ‹  November 2026  › ────┐
 │  S  S  R  K  J  S  M                   │   (kalender)
 │  .  .  .  ·  ▮  .  .                   │
 └────────────────────────────────────────┘

 Jam tersedia · Selasa, 10 November 2026
 ( 09.00 ) ( 09.30 ) (▮10.00▮) ( 11.00 )
 ( 13.00 ) ( 13.30 ) ( 14.00 ) ( 15.30 )

 Pilih artist (opsional)                       ← tautan kecil

 [ Kembali ]                    [ Lanjut ▮ ]
```

Langkah 3 (data diri): kolom Nama, Nomor HP (bantu: "Contoh: 0812 3456 7890"), Catatan, Tautan gambar referensi; di kanan atas ringkasan layanan dan jam pada layar lebar. Langkah 4 (tinjau): daftar definisi (Layanan, Tanggal & jam, Artist, Harga, Nama, Nomor HP) dan satu tombol utama "Kirim pemesanan".

### 10.3 Berhasil `/pesan/berhasil`

```
 ✓  Pemesanan terkirim

 Kode booking Anda
 ┌────────────────────────────────┐
 │  NP-20261110-A7K2     [ Salin ]│    (mono, 28px, batas 1px)
 └────────────────────────────────┘
 Status: (Clock Menunggu konfirmasi)

 Gel Polish · Selasa, 10 November 2026 · 10.00 WIB

 ┌ Info ──────────────────────────────────────┐
 │ Pemilik akan mengonfirmasi pesanan Anda.   │
 │ Simpan kode ini bersama nomor HP Anda      │
 │ untuk mengecek atau membatalkan pesanan.   │
 └────────────────────────────────────────────┘

 [ Cek status pesanan ]     [ Kembali ke beranda ]
```

### 10.4 Cek booking `/cek-booking`

```
 Cek booking
 Masukkan kode dan nomor HP yang Anda gunakan saat memesan.

 Kode booking   [ NP-20261110-A7K2        ]
 Nomor HP       [ 0812 3456 7890          ]
 [ Cari pesanan ▮ ]

 ──── hasil ────
 (Terkonfirmasi)                       NP-20261110-A7K2
 Gel Polish
 Selasa, 10 November 2026 · 10.00 – 11.30 WIB
 Artist: Owner          Rp150.000
 [ ⚠ Jadwal Anda terpengaruh ... pemilik akan menghubungi Anda ]  (bila bentrok)
 [ Batalkan pemesanan ]  (outline + ikon)
```

### 10.5 Kerangka admin

```
┌ sidebar 240 ──────┐ ┌ top bar 56 ───────────────────────────────┐
│ THE NAIL PALACE   │ │ Reservasi                 🔔(3)  Owner ▾   │
│                   │ ├────────────────────────────────────────────┤
│ ▌Dashboard        │ │                                            │
│  Reservasi        │ │   konten halaman (p-6)                     │
│  Layanan          │ │                                            │
│  Artist           │ │                                            │
│  Jadwal           │ │                                            │
│  Notifikasi (3)   │ │                                            │
│  Ekspor           │ │                                            │
│ ───────────────── │ │                                            │
│  Pengaturan       │ │                                            │
│  Keluar           │ │                                            │
└───────────────────┘ └────────────────────────────────────────────┘
```

Seluler: sidebar menjadi sheet dari kiri yang dibuka tombol menu di top bar. Item aktif: batang kiri 2 px hitam + latar `--sidebar-accent` + berat 600.

### 10.6 Reservasi `/admin/reservasi`

```
 Reservasi                                   [ + Reservasi baru ▮ ]
 [Hari ini] [Besok] [7 hari] [Menunggu konfirmasi]
 [🔍 Cari nama, HP, kode ]  [Tanggal ▾] [Status ▾] [Artist ▾]  Hapus filter

 WAKTU              PELANGGAN      LAYANAN      ARTIST   STATUS        HARGA
 ───────────────────────────────────────────────────────────────────────────
 Sel, 10 Nov        Siti R.        Gel Polish   Owner    (Terkonfirmasi) Rp150.000
 10.00              Online
 ───────────────────────────────────────────────────────────────────────────
 Sel, 10 Nov        Budi S.        Nail Art     Owner    (Menunggu...)   Rp250.000
 13.00              Admin          ⚠ Bentrok jadwal
 ───────────────────────────────────────────────────────────────────────────
 Menampilkan 1 – 20 dari 34                    [ Sebelumnya ] [ Berikutnya ]
```

Panel detail (sheet kanan):

```
 NP-20261110-A7K2                                          ✕
 (Menunggu konfirmasi)   Online · dibuat 8 Nov 08.00
 ───────────────────────────────────────────────
 Siti Rahayu · +62 812 3456 7890   [ WhatsApp ↗ ]
 Gel Polish · Rp150.000
 Selasa, 10 November 2026 · 10.00 – 11.30 · Owner
 Catatan customer: …
 Catatan admin:   [ textarea ]           [ Simpan catatan ]
 ───────────────────────────────────────────────
 [ Konfirmasi ▮ ]  [ Jadwalkan ulang ]  [ ✕ Batalkan ]
```

### 10.7 Dashboard `/admin`

```
 Dashboard                  [7 hari] [30 hari] [Bulan ini] [Kustom ▾]

 ┌ Total reservasi ┐ ┌ Pendapatan ┐ ┌ Rasio online ┐ ┌ Tidak hadir ┐
 │ 34              │ │ Rp4.250.000│ │ 72%          │ │ 8%          │
 │ 26 – 30 Nov     │ │ selesai    │ │ dari semua   │ │ dari yang   │
 └─────────────────┘ └────────────┘ └──────────────┘ └─────────────┘
 ┌ Rata-rata konfirmasi ┐
 │ 18 menit             │      (— dan "Belum ada data" bila null)
 └──────────────────────┘

 Rincian status
 Terkonfirmasi  ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮ 16
 Selesai        ▮▮▮▮▮▮▮▮▮▮ 10
 Menunggu       ▮▮▮ 3
 Dibatalkan     ▮▮ 3
 Tidak hadir    ▮ 2
```

### 10.8 Jadwal `/admin/jadwal`

```
 Jadwal      [Jam operasional]  Blokir waktu
 ─────────────────────────────────────────────
 Senin     (●) Buka  09.00 – 17.00   Istirahat 12.00 – 13.00
 Selasa    (●) Buka  09.00 – 17.00   Istirahat 12.00 – 13.00
 …
 Minggu    ( ) Tutup
 [ Salin Senin ke hari kerja ]            [ Simpan perubahan ▮ ]
 Perubahan hanya berlaku untuk jadwal ke depan.
```

Blokir waktu: daftar + "Blokir waktu baru" (dialog: seluruh studio atau artist, mulai, selesai, alasan) -> dialog konflik berisi daftar reservasi terdampak dengan tautan WhatsApp dan tombol "Tetap blokir".

### 10.9 Notifikasi `/admin/notifikasi`

```
 Notifikasi                      ( ) Belum dibaca   [ Tandai semua dibaca ]
 ──────────────────────────────────────────────
 ▮ (CalendarPlus) Reservasi baru                       2 menit lalu
     Siti memesan Gel Polish pada Selasa, 10 November… (NP-…)
 ──────────────────────────────────────────────
   (Hourglass) Reservasi belum dikonfirmasi            1 jam lalu
```

Item belum dibaca ditandai titik hitam di kiri dan judul 600; item terbaca judul 400 dan `--muted-foreground`.

## 11. Bahasa dan penulisan

- Bahasa Indonesia baku yang hangat; menyapa dengan **"Anda"**; kalimat pendek; huruf kapital hanya di awal kalimat (sentence case), judul bagian tidak berhuruf kapital semua kecuali label kecil.
- Tombol berawal kata kerja: "Pesan sekarang", "Kirim pemesanan", "Batalkan pemesanan", "Simpan perubahan". Hindari "Submit", "OK", "Ya/Tidak" tanpa konteks.
- Tanpa tanda seru, emoji, atau bahasa gaul. Galat menjelaskan apa yang terjadi dan apa yang bisa dilakukan, maksimal dua kalimat.
- Format: tanggal "Selasa, 10 November 2026"; ringkas "10 Nov 2026"; jam "10.00" (titik, 24 jam) dengan "WIB" pada ringkasan penting; durasi "1 j 30 mnt"; uang "Rp150.000"; telepon tampil "+62 812 3456 7890".
- Istilah baku: **reservasi** (admin) dan **pemesanan** (customer), **jadwal ulang**, **blokir waktu**, **jam operasional**, **kode booking**. Nama status sesuai Lampiran A PRD.

| Konteks                  | Teks                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| Kosong, daftar reservasi | "Belum ada reservasi pada rentang ini."                                     |
| Slot habis               | "Tidak ada jadwal tersedia pada tanggal ini, coba tanggal lain."            |
| Slot terisi saat kirim   | "Jadwal tersebut baru saja terisi. Silakan pilih jam lain."                 |
| Tidak ditemukan (publik) | "Reservasi tidak ditemukan. Periksa kode booking dan nomor HP Anda."        |
| Batas laju               | "Terlalu banyak percobaan. Coba lagi dalam 42 detik."                       |
| Konfirmasi batal         | "Batalkan reservasi NP-20261110-A7K2? Tindakan ini tidak dapat dibatalkan." |
| Sesi habis               | "Sesi berakhir, silakan masuk lagi."                                        |
| Jaringan                 | "Tidak dapat terhubung ke server. Periksa koneksi Anda."                    |

## 12. Aksesibilitas

Target WCAG 2.2 AA. Daftar periksa per halaman:

- [ ] Seluruh fungsi dapat dipakai dengan papan ketik; urutan Tab mengikuti urutan visual; tidak ada jebakan fokus di luar dialog.
- [ ] Fokus selalu terlihat (cincin 2 px hitam, jarak 2 px) pada semua elemen interaktif.
- [ ] Teks memenuhi kontras 4,5:1 (14 px ke bawah) dan 3:1 (besar); batas kolom isian dan kontrol 3:1.
- [ ] Setiap isian punya `<label>`; galat dikaitkan dengan `aria-describedby`; ringkasan galat formulir menerima fokus setelah kirim gagal.
- [ ] Hasil asinkron (toast, jumlah hasil, hitung mundur) diumumkan lewat `aria-live="polite"`; galat penting `role="alert"`.
- [ ] Status dan penanda tidak mengandalkan warna (ikon + teks + bentuk, bagian 6).
- [ ] Sasaran sentuh >= 44 px pada halaman customer.
- [ ] Gambar punya `alt`; ikon dekoratif `aria-hidden`; tombol ikon punya `aria-label`.
- [ ] Dialog dan sheet: judul (`aria-labelledby`), fokus berpindah masuk dan kembali ke pemicu saat ditutup, Esc menutup.
- [ ] Kalender dan pemilih jam dapat dioperasikan dengan panah, Home/End, Enter.
- [ ] Mendukung perbesaran 200 % tanpa gulir horizontal dan `prefers-reduced-motion`.
- [ ] `<html lang="id">`; satu `<h1>` per halaman; penanda landmark (`header`, `nav`, `main`).

## 13. Serah terima dengan tim UI/UX

Prototipe ini dibuat agar desainer dapat mengganti tampilannya dengan risiko kecil.

**Boleh diubah bebas oleh desainer**

- Token di `src/styles.css` (warna, `--radius`, skala tipografi), termasuk memperkenalkan warna bila diputuskan (lihat 15).
- Varian dan gaya di `src/components/ui/*` (struktur tetap, gaya berubah).
- Komponen tampilan di `src/features/*/components/*` dan `src/components/common/*`, selama **props tetap sama** atau perubahan props dicatat.
- Tata letak halaman di `src/routes/*` (komposisi), selama hook data yang dipanggil tetap.

**Jangan diubah tanpa berdiskusi dengan pembuat fungsional**

- `src/features/*/{api,queries,schemas}.ts`, `src/lib/**`, penjaga auth, parameter pencarian route (kontrak URL), dan nama kunci query.
- Perilaku yang tercantum di PRD (urutan wizard, dialog konflik blokir, transisi status yang ditawarkan, penanganan galat).

**Pemetaan token (nama sama di desain dan kode)**

| Variabel desain / Figma                 | CSS                             | Kelas Tailwind                           |
| --------------------------------------- | ------------------------------- | ---------------------------------------- |
| `color/background`                      | `--background`                  | `bg-background`                          |
| `color/foreground`                      | `--foreground`                  | `text-foreground`                        |
| `color/primary`                         | `--primary`                     | `bg-primary`, `text-primary-foreground`  |
| `color/muted`, `color/muted-foreground` | `--muted`, `--muted-foreground` | `bg-muted`, `text-muted-foreground`      |
| `color/border`, `color/input`           | `--border`, `--input`           | `border-border`, `border-input`          |
| `color/ring`                            | `--ring`                        | `ring-ring`                              |
| `radius/base`                           | `--radius`                      | `rounded-lg` (turunan: `sm`, `md`, `xl`) |
| `font/sans`                             | `--font-sans`                   | `font-sans`                              |

**Cara bekerja bersama:** desainer menyerahkan keputusan sebagai perubahan token atau berkas komponen; pembuat fungsional tidak memindahkan atau mengganti nama berkas di luar modulnya (aturan di `CLAUDE.md`). Perubahan yang menyentuh perilaku dibahas lebih dulu dan dicatat di PRD.

## 14. Aturan untuk agen AI

Lakukan:

- Baca bagian 2 sampai 6 sebelum membuat komponen apa pun; ambil nilai dari token, bukan dari ingatan.
- Gunakan komponen shadcn yang ada; tambah dengan CLI; sesuaikan lewat varian dan token.
- Gunakan `StatusBadge` untuk semua status, `EmptyState`, `ErrorState`, dan pemformat dari `lib/format.ts`.
- Rancang empat keadaan (memuat, kosong, galat, normal) untuk setiap data yang dimuat dari API.
- Tulis semua teks antarmuka dalam bahasa Indonesia sesuai bagian 11.

Jangan:

- Menambah warna, gradien, bayangan, atau mode gelap. Jangan memakai kelas warna bawaan Tailwind.
- Membuat pustaka UI lain, grafik pihak ketiga, atau animasi dekoratif.
- Membawa informasi hanya lewat warna.
- Menulis nilai piksel, hex, atau OKLCH langsung di komponen.
- Menyalin contoh Radix UI; proyek ini memakai Base UI (prop `render`, bukan `asChild`).
- Menggunakan `dangerouslySetInnerHTML`.

## 15. Pertanyaan desain terbuka

| ID   | Pertanyaan                                                                               | Default saat ini                                       |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| D-01 | Apakah galat boleh memakai satu warna fungsional (merah) walau palet hitam putih?        | Tidak; galat dibedakan oleh ikon, teks, dan batas 2 px |
| D-02 | Foto layanan tetap berwarna, atau seluruh situs hitam putih (saklar `.media`, bagian 8)? | Berwarna alami                                         |
| D-03 | Logo dan identitas: wordmark teks sementara cukup?                                       | Ya, sampai ada aset resmi                              |
| D-04 | Perlukah huruf tampilan kedua (mis. serif) untuk judul beranda agar lebih berkarakter?   | Tidak; satu keluarga Inter                             |
| D-05 | Kepadatan admin: nyaman (baris 52 px) atau padat (40 px)?                                | Nyaman; tabel mendukung kelas kepadatan satu tempat    |
| D-06 | Bentuk kontrol: radius 8 px atau lebih tajam (4 px)?                                     | 8 px (`--radius: 0.5rem`)                              |
| D-07 | Nada bahasa: "Anda" formal-hangat atau "kamu" santai?                                    | "Anda"                                                 |
