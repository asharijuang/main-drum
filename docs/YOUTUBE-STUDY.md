# Menonton sambil mencatat notasi

1. Jalankan `npm start`, buka app, lalu pilih **YouTube study**.
2. Tempel link YouTube dan tekan **Buka video**. Tekan play pada pemutar YouTube.
3. Di desktop/tablet, video tampil di kiri dan editor di kanan. Kedua panel bisa discroll terpisah.
4. Isi kotak pukulan di kanan sambil mendengarkan. Pilih judul, grid, dan jumlah bar seperti pada Editor pola biasa.
5. Tekan **Tautkan ke video** untuk menyertakan URL video pada pola. Tindakan ini mempertahankan not yang sudah ditulis.
6. Tekan **Dengarkan draf**, **Simpan pola**, atau ekspor MIDI/JSON tanpa keluar dari workspace video.

## Catatan tidak dibuat ulang saat berpindah tampilan

Workspace ini menggunakan editor yang sama dengan tab **Editor pola**. Catatan, nilai input dan tombolnya dipertahankan saat editor dipindahkan. Berpindah tab tidak memuat ulang iframe video. Mengganti video atau menekan Putar A–B memang memuat ulang bagian pemutar.

Saat membuka workspace, player bawah diringkas menjadi Mini untuk memberi ruang pada video dan editor. Kamu tetap bisa memilih Setengah atau Penuh. Saat keluar, ukuran player sebelumnya dikembalikan jika kamu belum mengganti ukuran secara manual.

Pada layar ponsel, video dan editor disusun vertikal supaya kotak not tetap bisa dibaca. Grid tetap dapat digeser mendatar untuk pola panjang.

## Alat belajar yang tersedia

- A dan B: tentukan awal dan akhir bagian dalam detik. Tekan Putar A–B lagi untuk mengulangnya.
- Tap beat: ketuk beberapa kali, lalu gunakan BPM perkiraan untuk player notasi.
- Editor: snare, kick, hi-hat, Tom 1/2/3, ride dan crash, termasuk ghost note.
- Penyimpanan: gunakan Simpan pola agar catatan masuk ke koleksi lokal browser.

Video menggunakan pemutar resmi YouTube berupa iframe. Jika pemilik video menolak embed, gunakan tautan Buka video di YouTube. Player notasi belum tersinkron dengan posisi video.

## Generator draf dari audio YouTube yang sedang diputar

Generator mendengarkan audio tab pilihanmu setelah kamu memberi izin browser. Ini alur yang benar-benar memproses audio, bukan pola contoh yang ditempelkan ke semua link. URL saja belum cukup untuk membuat notasi.

1. Buka app lewat `npm start` di Chrome/Edge desktop, lalu buka YouTube study.
2. Tempel link dan putar video. Jika embed ditolak, putar di tab YouTube terpisah.
3. Pada Generator notasi, isi BPM. Bisa memakai Tap beat lalu Pakai BPM; nilai itu juga masuk ke generator. Jumlah bar dapat dipilih 1, 2, atau 4; total potongan maksimal 30 detik.
4. Tekan **Hubungkan audio**. Pilih tab browser yang benar dan aktifkan **Bagikan audio tab / Share tab audio**. Jika video ada dalam app, pilih tab app ini. Browser juga meminta video untuk fitur berbagi layar, tetapi app hanya memproses audio, tidak menyimpan atau mengunggah gambar tab.
5. Pastikan meter suara bergerak. Pada bagian musik yang diinginkan, tekan **Mulai tangkap**. Tidak ada count-in otomatis: capture dimulai dari saat tombol ditekan.
6. Rekaman berhenti sesuai jumlah bar/BPM. Tekan Selesai lebih cepat untuk potongan pendek, atau Batal untuk membuang capture. Izin berbagi dihentikan setelah selesai.
7. App mendeteksi serangan bunyi, membulatkan waktunya ke grid, dan menampilkan ringkasan draf. Catatan lamamu masih utuh.
8. Tekan **Gunakan di editor · ganti draf saat ini** untuk memasukkan hasil ke editor kanan. Dengarkan, koreksi, lalu Simpan pola atau ekspor MIDI/JSON.

Tombol Batal juga tersedia saat memilih sumber atau setelah audio tersambung. Catatan yang sudah tersimpan tidak dihapus. Jika generator gagal, editor tidak diganti. Pola app dan monitor MIDI dibisukan selama capture agar tidak ikut terekam dari tab yang sama.

### Mode dan batas akurasi

- **Tebak kick / snare / hi-hat:** perkiraan berdasarkan energi serangan pada rentang frekuensi rendah, menengah, dan tinggi.
- **Semua onset ke snare:** semua serangan yang terdeteksi ditulis pada snare; lebih mudah untuk memeriksa ritme dahulu.
- **Jadikan onset pertama sebagai awal bar:** menggeser hit pertama ke 1. Ini tidak membuktikan hit itu downbeat lagu. Matikan jika sudah memulai capture tepat pada 1 dan ingin mempertahankan jaraknya.

Ini detektor sinyal sederhana, bukan model AI pemisah instrumen atau transkripsi partitur penuh. Bass, vokal dan gitar dapat terbaca sebagai pukulan; pukulan bersamaan bisa terlewat. Tom 1/2/3, crash, ride, sticking R/L dan dinamika musikal belum dikenali dengan andal. Untuk lagu penuh, kerjakan bagian pendek satu per satu. BPM diisi pengguna, bukan hasil estimasi otomatis generator.

Audio diproses dalam browser, tanpa API key/server transkripsi. Capture hanya berasal dari sumber yang kamu pilih; app tidak dapat membuktikan bahwa tab pilihanmu sesuai URL referensi. Pastikan sumbernya benar.

### Jika capture tidak berjalan

- Gunakan localhost/HTTPS dan Chrome/Edge desktop. Dukungan audio tab bergantung pada browser/OS; browser di dalam aplikasi mungkin tidak menyediakannya.
- Pilih **tab browser**, lalu centang **Share tab audio**. Memilih sebuah window/layar bisa tidak membawa audio.
- Jika meter diam, putar video dan periksa sumber. Audio yang diam tidak akan dijadikan notasi palsu.
- Jika izin ditolak atau dibatalkan, Hubungkan audio dapat dicoba lagi. Jangan memakai mikrofon untuk alur ini.

Pengujian otomatis memakai MediaStream audio sintetis melalui AudioWorklet yang sesungguhnya. Dialog berbagi browser dan video YouTube disimulasikan agar tes dapat diulang; pengujian ini belum membuktikan semua kombinasi video/browser/OS.

Referensi: [Screen Capture / getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor).
