# Drum Companion

Buku drum interaktif dan studio latihan untuk drummer pemula, dengan materi berbahasa Indonesia. Baca materi sambil memainkan pola, hubungkan e-drum melalui MIDI, lalu buat dan simpan notasi sendiri.

## Jalankan lokal

Gunakan **Node.js 20 atau lebih baru**. App tidak memakai dependency runtime, API key, atau database server.

```sh
git clone <URL-REPO-KAMU>
cd <FOLDER-REPO>
npm start
```

Buka **http://127.0.0.1:8765** di Chrome atau Edge desktop. Di Windows, bisa juga klik `mulai-drum-app.cmd`. Tidak perlu `npm install` untuk menjalankan app. Jalankan `npm ci` bila ingin memverifikasi lockfile seperti pada CI.

Untuk port lain:

```sh
node scripts/server.cjs 9000
```

Halaman statis ada di `public/index.html`. File ini bisa dibuka langsung, tetapi localhost disarankan untuk akses MIDI. Server hanya mendengarkan pada komputer lokal.

## Fitur

- Buku 16 bab: drum kit, hitungan, birama, notasi, rudiment, groove, fill, dan latihan mendengar.
- Player notasi yang selalu terlihat, dengan ukuran Mini, Setengah, dan Penuh.
- Metronom, BPM, suara drum sintetis, ghost note, sticking dan pemilihan instrumen.
- Editor 4/4 untuk 1–4 bar dengan eighth, sixteenth, triplet dan sextuplet.
- MIDI detector, pad learning, velocity, count-in satu bar dan rekaman menjadi notasi.
- Simpan pola lokal, pencarian judul, ekspor Standard MIDI File/JSON dan impor JSON.
- YouTube study dengan bagian A–B, tap tempo dan pencatatan manual.
- Draf ritme dari file audio lokal, serta timer dan jurnal latihan.

## Batas fitur

| Fitur | Yang tersedia |
| --- | --- |
| MIDI | Note-on, velocity, mapping dan kuantisasi. Belum mendeteksi sticking kanan/kiri, hi-hat CC atau choke. |
| Pencarian lagu | Pola bawaan, koleksi lokal dan tautan sumber luar. Belum ada katalog partitur lagu lengkap. |
| YouTube | Pemutar dan alat belajar manual. Belum mentranskripsi audio langsung dari link atau menyinkronkan player notasi dengan video. |
| Audio ke notasi | Detektor onset sederhana, bukan pemisah instrumen AI. Hasil berupa draf yang harus diperiksa. |
| Akun & cloud | Tidak tersedia. Data disimpan di browser perangkat ini. |

YouTube dan pencarian sumber luar memerlukan internet. App tidak memisahkan audio dari YouTube. Analisis file audio dilakukan lokal, maksimal 30 MB dan potongan empat bar/30 detik. MIDI memerlukan izin browser; beberapa browser/perangkat tidak mendukung Web MIDI.

## Struktur repo

```text
public/
  index.html              Halaman app
  assets/
    styles.css            Tampilan responsif
    app.js                UI, playback, MIDI dan studio
    rhythm-core.js        Fungsi ritme murni, dipakai app dan tes
scripts/server.cjs        Server lokal tanpa dependency
test/                     Tes logika musik dan HTTP
docs/guides/              Buku PDF
.github/workflows/        Pemeriksaan otomatis pada push / pull request
```

## Pemeriksaan

```sh
npm run check
npm test
```

Tes mencakup kuantisasi, velocity, note-on MIDI, ekspor SMF, validasi pola, parsing YouTube, tap tempo, deteksi onset, dan server. Riwayat pengujian browser versi awal mencakup editor, koleksi, impor/ekspor, MIDI simulasi, WAV sintetis, timer dan tampilan ponsel. E-drum fisik belum diuji; tes otomatis tidak membuktikan kompatibilitas semua perangkat.

## Data pengguna

Pola, mapping dan jurnal memakai `localStorage`. Data `file://` dan `http://127.0.0.1:8765` berbeda. Gunakan ekspor/impor JSON untuk memindahkan pola. Cadangkan pola sebelum menghapus data browser. File rekaman dan pola pribadi tidak perlu dimasukkan ke Git; gunakan folder `.local/` yang diabaikan Git.

## Push pertama ke GitHub

Buat repo kosong di GitHub, tanpa README tambahan. Dari folder proyek:

```sh
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin HEAD
```

Jika remote `origin` sudah ada, lewati perintah `remote add`. `HEAD` memakai branch yang sedang aktif, misalnya `main` atau `master`. Jika belum ada commit, jalankan `git add .` lalu `git commit -m "Initial Drum Companion app"` dahulu. Jangan menyertakan token GitHub dalam URL remote atau file proyek.

## Lisensi

Lisensi belum ditentukan (`UNLICENSED`); repo tidak otomatis memberikan izin penggunaan ulang. Tentukan lisensi sebelum membagikannya sebagai proyek open source. Hak atas video dan partitur eksternal tetap mengikuti sumbernya.

## Referensi browser

- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
