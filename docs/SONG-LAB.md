# Song Lab: rekam lagu, temukan groove, belajar lima level

## Alur utama

1. Jalankan `npm start`, buka app pada Chrome/Edge desktop, lalu YouTube study.
2. Pilih audio tab seperti sebelumnya. Rekaman tidak lagi dibatasi jumlah bar: pilih 15/30 detik, 1/2/5 menit, lalu Mulai tangkap. Selesai lebih cepat tetap tersedia.
3. Setelah capture selesai, audio tetap berada di Song Lab. Berbagi tab otomatis berhenti. Alternatifnya, impor file audio sampai 5 menit/100 MB.
4. Dengarkan rekaman dan periksa kandidat BPM. Tombol BPM ÷2 / ×2 membantu membandingkan tempo setengah atau dobel. Dukungan latihan saat ini 30–180 BPM dan 4/4.
5. Klik waveform atau isi Awal bar. Nama bagian Verse/Chorus/Fill dipilih manual; app belum mengenali struktur lagu otomatis.
6. Pilih analisis 4/8/16 bar. Rekaman tetap panjang, tetapi bagian yang dihitung lebih kecil. Akhir bagian dibatasi akhir rekaman.
7. Pilih model referensi kit, lalu Analisis bagian & buat 5 level. Proses berjalan di Web Worker agar editor tidak membeku.
8. Pilih level untuk melihat notasinya di player. Buka level di editor jika perlu dikoreksi. Simpan kelima level ke koleksi untuk sesi berikutnya.

## Panjang rekaman berbeda dari panjang pola

- **Rekaman:** maksimal 5 menit, mono PCM 48 kHz untuk capture tab. Memakai memori browser; tidak disimpan ke server.
- **Bagian analisis:** 4, 8, atau 16 bar, berdasarkan BPM yang kamu pilih.
- **Groove dasar:** satu bar wakil yang mirip dengan bar lain, bukan bar fill yang muncul sekali.
- **Level 1–4:** aransemen latihan satu bar, bukan transkripsi persis lagu.
- **Level 5:** draf 1/2/4 bar pertama bagian analisis, sesuai pilihan Draf lengkap. Karena model baru tiga kelas, “lengkap” hanya berarti semua event hasil model, bukan semua instrumen asli.

Perubahan BPM, grid, atau awal bagian membatalkan hasil level sebelumnya agar tidak dipakai untuk bagian yang berbeda. Analisis ulang setelah mengubahnya.

## Kandidat tempo dan awal bar

Tempo dihitung dari periodisitas onset envelope dengan autocorrelation. App menampilkan beberapa kandidat, termasuk setengah/dobel. Kekuatan periodisitas bukan persentase akurasi. Musisi bisa merasakan ketukan pada dua tingkat tempo yang berbeda.

Snap ke saran beat hanya mendekatkan awal pilihan ke denyut yang diperkirakan. Ia **belum tahu pasti hitungan 1 dalam bar**. Gunakan Awal ±1 beat dan dengarkan sambil menghitung. Lagu dengan perubahan tempo, swing, atau birama lain dapat meleset; grid saat ini belum mengikuti tempo map.

## Lima level

| Level | Latihan |
| --- | --- |
| 1 | Empat beat cymbal untuk merasakan denyut |
| 2 | Fondasi kick/snare dari pola, diringkas |
| 3 | Tambahkan cymbal sederhana untuk koordinasi |
| 4 | Tambahkan variasi kick/snare yang terdeteksi |
| 5 | Draf bagian lebih lengkap untuk diperiksa dan dikembangkan |

Ini desain pedagogis app, bukan kurikulum resmi Drumeo. Hasil yang salah bisa menghasilkan aransemen yang salah juga: dengarkan dan koreksi sebelum menjadikannya latihan utama. Tidak ada klaim bahwa setiap lagu cocok dengan pola rock 2/4.

## Latih bersama rekaman

Jeda YouTube aslinya, lalu tekan Latih bersama rekaman. Loop rekaman lokal dan pola drum dijadwalkan pada clock Web Audio yang sama. Volume rekaman bisa diubah terpisah.

Level 1–4 mengulang pola satu bar sambil bagian rekaman berjalan. Level 5 memakai panjang loop yang sesuai draf bagian. Jeda/stop player juga menghentikan backing track. Jika not terasa bergeser, periksa BPM dan awal bar; clock yang sama tidak memperbaiki BPM/awal yang salah.

## Model/algoritme akurasi

Default baru memakai pencocokan spektrum dengan **nonnegative least squares**, berdasarkan tiga sample referensi dari kit aktif: kick, snare dan hi-hat. Beberapa aktivasi dapat muncul pada waktu bersamaan, sehingga kick + hi-hat tidak harus dipaksa menjadi satu instrumen.

Ini model template kecil yang dihitung lokal, **bukan neural model atau LLM**. Referensi kit tidak mewakili semua timbre lagu. Tom 1/2/3, ride, crash dan artikulasi lain tetap perlu ditulis/koreksi manual. Kit yang tidak punya tiga referensi lengkap akan ditolak untuk mode ini. Mode frekuensi lama tersedia sebagai pembanding; multi-band masih eksperimen karena menambah false positive pada fixture evaluasi.

GPU tidak diperlukan untuk tahap ini. Pipeline dipisah ke worker agar model pretrained lokal yang lebih besar bisa dievaluasi selanjutnya. Menambahkan neural model tanpa evaluasi pada lagu nyata belum menjadi bukti peningkatan.

## Pengukuran

Jalankan:

```sh
npm run benchmark
```

Fixture memakai 12 detik campuran rekaman drum akustik CC0 dari kit bawaan. Pukulan RR2 menjadi data uji, RR1 menjadi referensi; bass tone dan distractor harmonik ditambahkan. Ada 73 event ground truth, termasuk pukulan bersamaan. Kecocokan dinilai berdasarkan instrumen dan toleransi onset 50 ms.

Hasil fixture pada implementasi ini: detektor lama F1 sekitar 0,783; model spektrum tiga kelas sekitar 0,917. Ini **bukan akurasi 91,7% pada YouTube** dan bukan benchmark pada lagu komersial. Referensi dan data uji masih berasal dari kit yang sama. Laporan dapat dibuat ulang dari repo; lihat `docs/benchmarks/controlled-fixture.json`.

Referensi metode: [NMF drum transcription](https://archives.ismir.net/ismir2007/paper/000353.pdf), [template-based transcription/separation](https://www.eurasip.org/Proceedings/Eusipco/Eusipco2009/contents/papers/1569182670.pdf). Implementasi ini versi kecil tersendiri, bukan reproduksi hasil penelitian tersebut.

## Menyimpan data

Kelima pola dapat disimpan ke localStorage. Audio tidak masuk localStorage karena jauh lebih besar. Gunakan Simpan rekaman WAV sebelum menutup/refresh, lalu impor lagi saat dibutuhkan. File cadangan pribadi sebaiknya di luar repo atau `.local/` yang diabaikan Git.

Uji browser mencakup impor rekaman, worker tempo/model, lima level, sinkronisasi backing, editor, penyimpanan, dan capture fixture lebih dari satu menit. Dialog berbagi serta sumber video YouTube disimulasikan; pemutaran YouTube asli pada perangkat pengguna tetap perlu diuji. Capture lima menit belum diuji sebagai sesi penuh lima menit; batas dan penanganan frame-nya diuji terpisah.
