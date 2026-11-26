# WAV pembanding yang polanya diketahui

File: `public/examples/drum-test-120bpm-64s.wav`.

- Durasi **64 detik**, **32 bar 4/4**, **120 BPM**.
- WAV PCM16, mono, 48 kHz. Tidak ada count-in; beat 1 mulai pada detik 0.
- Dibuat dari rekaman drum akustik Big Rusty Drums (Karoryfer Samples, CC0), dengan pola yang disusun untuk pengujian. Ini bukan lagu komersial.
- Menggunakan take RR2; referensi model memakai RR1. Tetap berasal dari kit yang sama, jadi tidak membuktikan akurasi pada lagu lain.

## Cara membandingkan

1. Buka YouTube study → Song Lab.
2. Tekan **Muat contoh 120 BPM**. Atau impor WAV dari folder `public/examples`.
3. Gunakan **120 BPM**, awal **0 detik**, grid **1/16**, analisis **8 bar**, mode **Referensi drum · 3 kelas**.
4. Tekan Analisis bagian & buat 5 level. Pembanding pertama adalah bagian **0–16 detik**.

Pola dasar 0–16 detik:

```text
Hitung   1 & 2 & 3 & 4 &
Hi-hat   x x x x x x x x
Kick     x - - - x - - -
Snare    - - x - - - x -
```

## Empat bagian file

| Waktu | Bar | Perubahan |
| --- | --- | --- |
| 0–16 detik | 1–8 | Groove dasar di atas |
| 16–32 detik | 9–16 | Tambah kick pada & setelah 3 |
| 32–48 detik | 17–24 | Hi-hat menjadi sixteenth; kick/snare tetap |
| 48–64 detik | 25–32 | Kembali ke groove dasar eighth |

`drum-test-120bpm-64s.json` menyertakan semua posisi pukulan sebenarnya, bukan hasil tebakan. File `.mid` adalah notasi MIDI acuannya. Generatornya dapat dijalankan ulang dengan `npm run example`.

## Cara membaca hasil debug

- **Contoh tidak dapat dimuat:** periksa alamat app, folder server dan file WAV. Belum menyangkut akurasi detektor.
- **Contoh terputar tetapi model error:** periksa pesan pemuatan referensi atau worker. Mengganti audio saja tidak menyelesaikan kegagalan memuat model.
- **Lima level muncul tetapi beberapa not salah:** jalur analisis bekerja; masalahnya kualitas deteksi/tempo/awal bar.
- **Contoh bekerja, lagu sendiri kurang tepat:** kemungkinan timbre dan campuran musik berbeda dari referensi. Itu masalah generalisasi model.

Jalankan app lewat `npm start` dari root proyek. Jika tombol contoh belum terlihat, simpan rekaman pribadi sebagai WAV terlebih dahulu, kemudian refresh halaman versi repo terbaru.
