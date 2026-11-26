# YouTube study dan Song Lab

## Pilih sumber audio tanpa bergantung pada iframe

1. Jalankan `npm start`, buka `http://127.0.0.1:8765` pada Chrome/Edge desktop biasa.
2. Buka YouTube study. Video dan editor berada berdampingan di desktop; di ponsel disusun vertikal.
3. Jika iframe menolak video, tekan Buka YouTube di tab baru dan play di sana. Gunakan browser yang sama untuk app dan YouTube.
4. Pilih sumber Tab YouTube / tab browser lain, lalu Pilih tab audio. Pada dialog browser pilih Chrome Tab / Microsoft Edge Tab, klik tab yang benar, centang Share tab audio, lalu Share.
5. Untuk video yang berjalan dalam app, pilih sumber Video dalam tab app ini. Daftar tab selalu dikelola dialog browser, bukan oleh app.

## Capture panjang, analisis per bagian

Pilih batas rekaman 15/30 detik, 1/2/5 menit. Setelah meter bergerak, tekan Mulai tangkap. BPM tidak membatasi durasi capture. Selesai lebih cepat menyimpan audio yang sudah diterima; Batal membuang tangkapan itu. Audio tab diputus setelah selesai.

Hasil capture menjadi rekaman di Song Lab. Waveform, pemutar audio dan kandidat tempo membantu memilih bagian. Rekaman tidak harus dibagikan ulang setiap kali menganalisis bagian lain. File lokal sampai 5 menit/100 MB juga dapat diimpor.

Baca [panduan Song Lab](SONG-LAB.md) untuk tempo setengah/dobel, awal bar manual, groove berulang, model template, lima level dan latihan bersama backing lokal.

## Editor manual tetap tersedia

Workspace memakai editor yang sama dengan Editor pola. Berpindah tab mempertahankan draf dan tidak memuat ulang iframe. Tautkan ke video menambah referensi URL tanpa menghapus not. Simpan pola agar masuk ke koleksi browser.

Pemutar video, capture tab dan notasi tidak otomatis sinkron dengan waktu YouTube. Fitur latihan bersama menggunakan rekaman lokal yang sudah kamu pilih bagiannya. Jeda YouTube asli saat latihan agar audio tidak dobel.

## Batas

- URL saja tidak menyediakan notasi; audio harus ditangkap atau diimpor.
- Model default hanya tiga kelas. Pukulan lain dan timbre yang berbeda tetap bisa salah. Ini bukan partitur terverifikasi.
- Tempo dan awal bar harus diperiksa; app belum mengikuti tempo map atau birama selain 4/4.
- Data audio disimpan dalam memori tab. Unduh WAV sebelum refresh/menutup; pola saja disimpan ke localStorage.
- Hanya audio yang diproses, tanpa upload. Browser meminta video sebagai bagian dari izin screen capture, tetapi gambar tidak disimpan.
- Kalau dialog tidak muncul di browser dalam app, gunakan Chrome/Edge biasa. Sumber tanpa audio atau audio diam menghasilkan pesan, bukan notasi palsu.

Pengujian browser mencakup audio fixture, bukan dialog izin dan video YouTube asli. Referensi API: [getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).
