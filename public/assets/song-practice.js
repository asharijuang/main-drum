'use strict';

// Four-bar beginner arrangements. Each column is an eighth note in 4/4.
// A track can contain several instruments at the same time across its rows.
const songPractice = {
  'Gurenge': {
    bpm: 78, focus: 'Jaga hi-hat tetap rata saat kick berpindah ke sela ketukan.',
    kick: ['x...xx..','x..xx...','x...xx..','x..xx...'],
    sn: ['..x...x.','..x...x.','..x...x.','..x..x..'], tom: ['........','........','........','......xx']
  },
  'Blue Bird': {
    bpm: 80, focus: 'Pertahankan snare di 2 dan 4, lalu pindah ke tom pada akhir frase.',
    kick: ['x..xx...','x...x..x','x..xx...','x...x...'],
    sn: ['..x...x.','..x...x.','..x...x.','..x..x..'], tom2: ['........','........','........','......xx']
  },
  'Silhouette': {
    bpm: 85, focus: 'Latih sepasang kick sebelum snare tanpa mempercepat tangan.',
    kick: ['xx..x...','x...xx..','xx..xx..','x...x...'],
    sn: ['..x...x.','..x...x.','..x...x.','..x...xx']
  },
  'Seven Nation Army': {
    bpm: 72, focus: 'Mulai dengan ketukan kaki yang stabil. Tambahkan snare saat memasuki bar ketiga.',
    kick: ['x.x.x.x.','x.x.x.x.','x...x...','x...x...'],
    hh: ['........','........','x.x.x.x.','x.x.x.x.'],
    sn: ['........','........','..x...x.','..x...xx'],
    floor: ['x.x.x.x.','x.x.x.x.','........','........']
  },
  'Back in Black': {
    bpm: 72, focus: 'Mainkan backbeat di 2 dan 4, lalu sisakan ruang sebelum kembali ke beat 1.',
    kick: ['x...x...','x..xx...','x...x...','x..xx...'],
    hh: ['xxxxxxxx','xxxxxxxx','xxxxxxxx','xxxxxx..'],
    sn: ['..x...x.','..x...x.','..x...x.','..x...x.']
  },
  'Smells Like Teen Spirit': {
    bpm: 80, focus: 'Buat perbedaan antara dua bar hi-hat pelan dan dua bar terakhir dengan crash.',
    kick: ['x..x.x..','xx..x...','x..x.x..','xx..x...'],
    hh: ['xxxxxxxx','xxxxxxxx','.xxxxxxx','.xxxxx..'],
    sn: ['..x...x.','..x...x.','..x...x.','..x..xxx'],
    crash: ['........','........','x.......','x.......']
  }
};

function practicePattern(song) {
  const {bpm, focus, ...parts} = songPractice[song.title];
  const tracks = {hh: Array(4).fill('xxxxxxxx'), ...parts};
  const pattern = {name: song.title + ' · latihan pemula', meter:'4/4', steps:32,
    perBeat:2, barSteps:8, labels:Array.from({length:32}, (_, i) => countLabel(i, 2)),
    bpm, info:'Aransemen latihan · 4 bar.', tip:focus, song};
  for (const [instrument, bars] of Object.entries(tracks)) {
    pattern[instrument] = [...bars.join('')].flatMap((hit, i) => hit === 'x' ? [i] : []);
  }
  return pattern;
}
