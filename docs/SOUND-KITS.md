# Mengganti sound bundle drum

App sekarang memainkan **rekaman WAV one-shot**. Synthesizer lama hanya dipakai untuk metronom dan cadangan saat kit atau pad tidak tersedia. Semua sample dan mapping dipisah dari kode UI.

## Cara paling mudah: impor lewat app

1. Jalankan `npm start`, lalu buka app di Chrome/Edge.
2. Buka **Sound kits** di sidebar atau tombol **Sound kit** pada player bawah.
3. Pada **Folder kit**, pilih folder yang berisi file `.sfz` dan semua sample-nya.
4. Pilih mapping SFZ yang diinginkan, lalu tekan **Gunakan kit ini**.
5. Coba tombol Kick, Snare, Hi-hat, dan seterusnya. Periksa pesan pad yang belum tersedia.

Impor ini tidak menyalin file ke repo atau mengunggahnya. File disimpan dalam memori tab; setelah refresh, pilih folder lagi. Kit bawaan yang dipilih diingat di browser. ZIP harus diekstrak sebelum diimpor.

## Ganti secara permanen tanpa mengubah JavaScript

1. Salin folder `public/sounds/custom-template` menjadi `public/sounds/kit-ku`.
2. Masukkan **one-shot**, bukan loop, ke folder `samples/`:

```text
public/sounds/kit-ku/
  kit.sfz
  samples/
    kick.wav
    snare.wav
    hihat.wav
    tom.wav
    tom2.wav
    floor.wav
    ride.wav
    crash.wav
```

3. Jika nama file berbeda, edit hanya `sample=...` di `kit.sfz`.
4. Tambahkan entri ke array `kits` di `public/sounds/kits.json`:

```json
{
  "id": "kit-ku",
  "name": "Kit Akustik Saya",
  "sfz": "kit-ku/kit.sfz",
  "credit": "Nama pembuat dan lisensi sample"
}
```

Pertahankan entri bawaan dan koma JSON yang benar. Untuk menjadikannya default baru, ubah nilai `default` menjadi `kit-ku`. Pilihan tersimpan browser tetap diprioritaskan; pilih kit baru sekali dari dropdown.

5. Refresh app, buka **Sound kits**, lalu pilih kit tersebut.
6. Jika mengganti isi WAV pada nama file yang sama, tekan **Muat ulang kit**. Tidak perlu mengubah kode atau restart server.

## Format yang dipakai

**SFZ + WAV** adalah format mapping instrumen dan sample yang digunakan banyak sampler, bukan format audio buatan app. SFZ berupa teks; WAV berisi bunyinya. File SFZ di repo ini juga bisa dibuka pada sampler SFZ lain.

- Rekomendasi sample: **WAV PCM 16-bit atau 24-bit**, mono/stereo, **44.1 kHz atau 48 kHz**.
- FLAC, MP3, atau OGG bisa dibaca jika browser mendukungnya, tetapi WAV paling mudah untuk dipindahkan antar sampler. Presisi awal pukulan juga lebih mudah dipertahankan dengan PCM.
- Trim bagian hening sebelum pukulan. Biarkan ekor cymbal terdengar alami. Hindari sample yang sudah clipping.
- Maksimum app: 128 sample unik, 100 MB data file kit, 200 MB audio terdekode, 30 detik per sample. Setiap file impor dibatasi 30 MB.
- Default metronom tetap bunyi klik sintetis yang jelas; mengganti kit tidak mengubah klik.

Referensi: [Intro to SFZ](https://sfzformat.com/tutorials/basics/) dan [SFZ drum basics](https://sfzformat.com/tutorials/drum_basics/).

## Contoh SFZ paling sederhana

```sfz
<control> default_path=samples/
<global> loop_mode=one_shot pitch_keytrack=0 amp_veltrack=100
<group> key=36 volume=-2
<region> sample=kick.wav
<group> key=38 volume=-3
<region> sample=snare.wav
```

`key` mengikuti nomor General MIDI, bukan nama tombol keyboard:

| Pad app | Key yang dikenali | Rekomendasi |
| --- | --- | --- |
| Kick | 35, 36 | 36 |
| Snare | 38, 40 | 38 |
| Hi-hat | 42, 44, 46 | 42 |
| Tom 1 (tinggi) | 48, 50 | 48 |
| Tom 2 (sedang) | 45, 47 | 45 |
| Tom 3 (rendah/floor) | 41, 43 | 43 |
| Ride | 51, 53, 59 | 51 |
| Crash | 49, 52, 55, 57 | 49 |

App menyatukan varian key tersebut ke pad yang sama. Jangan memasukkan beberapa artikulasi hi-hat yang bertumpuk pada velocity yang sama jika tidak ingin semuanya berbunyi bersama. Kontrol buka/tutup hi-hat berbasis CC belum tersedia.

## Volume, ghost note, dan variasi pukulan

`volume` menggunakan dB: `-6` lebih pelan daripada `0`. `pan=-100` kiri, `0` tengah, `100` kanan. Gain tetap mengikuti velocity pukulan; ghost note akan lebih pelan.

Untuk timbre ghost note yang berbeda, gunakan velocity layer:

```sfz
<group> key=38
<region> sample=snare-soft.wav lovel=1 hivel=44
<region> sample=snare-hard.wav lovel=45 hivel=127
```

Untuk dua rekaman yang dimainkan bergantian, gunakan round-robin:

```sfz
<group> key=36
<region> sample=kick-1.wav seq_length=2 seq_position=1
<region> sample=kick-2.wav seq_length=2 seq_position=2
```

Round-robin membantu mengurangi kesan pukulan robotik yang selalu identik. Lengkapi semua `seq_position` dalam setiap velocity layer.

## Cakupan SFZ dalam app

Ini **subset SFZ khusus drum**, bukan pengganti engine SFZ lengkap.

Didukung: `<control>`, `<global>`, `<master>`, `<group>`, `<region>`, `default_path`, `sample`, satu `key` (atau `lokey` = `hikey`), `lovel`, `hivel`, `volume`, `pan`, `seq_length`, `seq_position`, `group`, `off_by`, `loop_mode=one_shot`, `pitch_keytrack=0`, dan skala sederhana `amp_veltrack`.

`group`/`off_by` memberi choke pendek. Mode envelope/choke SFZ yang lebih rinci belum diimplementasikan. Opcode nonkritis lain diberi peringatan, bukan dianggap didukung. `#include`, `#define`, rentang nada, pitch tracking, dan loop selain one-shot ditolak dengan pesan. Sample harus berada dalam folder mapping atau subfoldernya; mapping yang menunjuk keluar dengan `../` perlu dirapikan dahulu.

File `.sf2`, `.sf3`, `.nki`, `.h2drumkit`, atau plugin VST tidak bisa diimpor langsung. Untuk pack one-shot WAV biasa, buat mapping dari template di atas. Untuk SFZ kompleks, salin sample yang diperlukan dan buat satu mapping sederhana.

## Kit bawaan dan sumber sample

**Big Rusty · Acoustic Starter** memakai 13 rekaman dari [Big Rusty Drums, Karoryfer Samples](https://github.com/sfzinstruments/karoryfer.big-rusty-drums), berlisensi **CC0-1.0**. Kit kecil ini bukan seluruh library aslinya.

- Kick, snare dan hi-hat punya dua variasi round-robin.
- Snare punya layer soft dan hard.
- Semua instrumen memakai sample akustik close mic.
- FLAC asli dikonversi menjadi WAV PCM16 48 kHz. Gain puncak disamakan per instrumen; dua layer snare memakai gain yang sama agar dinamika relatifnya tetap ada.
- Sumber file, commit upstream dan perubahan dicatat di `public/sounds/rusty-starter/sources.json`. Lisensi disertakan di folder yang sama.

Untuk mencari pack lain, mulai dari [daftar instrumen drum SFZ](https://sfzinstruments.github.io/drums/). Format SFZ tidak otomatis berarti semua pack gratis untuk dibagikan. Simpan lisensi dan kredit bundle; jangan push sample ke GitHub jika izin redistribusinya tidak ada.

## Jika tidak berbunyi

- Klik **Mainkan** atau tombol tes pad agar browser mengizinkan audio.
- Periksa volume, metronom, dan opsi suara pola drum.
- Baca pesan **Sound kits**: nama file yang hilang ditampilkan di sana.
- Pastikan huruf besar/kecil nama file sama, terutama saat nanti dihosting di Linux.
- Gunakan `npm start` jika kit bawaan tidak dapat dimuat dari `file://`.
- Jika muncul **Suara darurat**, app sedang memakai synthesizer cadangan, bukan rekaman WAV.

## E-drum dengan tiga tom

Diagram, editor, MIDI recorder, ekspor MIDI, dan sound kit sekarang membedakan Tom 1, Tom 2, dan Tom 3. Tom 1 bernada tinggi, Tom 2 sedang, dan Tom 3 rendah. Ketiga tom memakai rekaman berbeda.

Default Tom 1/2/3 pada Roland TD-07 adalah 48/45/43; Yamaha DTX400 menggunakan 48/47/43. App menerima kedua variasi Tom 2. Ini contoh model tertentu, bukan jaminan semua modul memakai nomor sama. Gunakan pad learn untuk pengaturan lain. Mapping pribadi tetap diprioritaskan; tekan Reset mapping jika ingin kembali ke default app.

Ekspor MIDI memakai 48/45/43. Data pola lama tetap didukung: field tom = Tom 1, tom2 = Tom 2, floor = Tom 3. File PDF lama tetap menjadi referensi dasar dan belum diterbitkan ulang dalam pembaruan app ini.

Sumber: [Roland TD-07 note map](https://support.roland.com/hc/en-us/articles/24553430488091-TD-07-Default-MIDI-Note-Map), [Yamaha DTX400 MIDI reference](https://data.yamaha.com/files/download/other_assets/6/328196/dtx400k430k450k_en_mr_a0.pdf).
