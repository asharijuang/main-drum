'use strict';

(() => {
  const songs = [
    {
      drumTab: 'https://www.songsterr.com/a/wsa/lisa-gurenge-demon-slayer-op-drum-tab-s486959',
      title: 'Gurenge', artist: 'LiSA', genre: 'Anime', series: 'Demon Slayer',
      video: '9rvANJjWsWo', lesson: 'Drum cover lengkap dengan notasi',
      publisher: 'Art of Drumming HQ', access: 'PDF berbayar · 4 halaman',
      score: 'https://artofdrumminghq.com/products/gurenge-%E7%B4%85%E8%93%AE%E8%8F%AF-lisa-drum-sheet-music-score-transcription'
    },
    {
      drumTab: 'https://www.songsterr.com/a/wsa/ikimino-gakari-blue-bird-naruto-opening-drum-tab-s534591',
      title: 'Blue Bird', artist: 'Ikimonogakari', genre: 'Anime', series: 'Naruto Shippuden',
      video: 's7GAwvYUZJQ', lesson: 'Drum cover lengkap oleh Raymond Goh',
      publisher: 'COPYDRUM', access: 'Partitur berbayar',
      score: 'https://drumsetsheetmusic.com/products/blue-bird-naruto-shippuden-op-3-full-drum-transcription-drum-sheet-music-copydrum'
    },
    {
      drumTab: 'https://www.songsterr.com/a/wsa/kana-boon-silhouette-drum-tab-s3861376',
      title: 'Silhouette', artist: 'KANA-BOON', genre: 'Anime', series: 'Naruto Shippuden',
      video: 'ActZ40BcIR0', lesson: 'Drum cover dengan notasi oleh Gather Music',
      publisher: 'Sheet Music Plus', access: 'Aransemen pemula berbayar',
      score: 'https://www.sheetmusicplus.com/en/product/silhouette-23885324.html'
    },
    {
      drumTab: 'https://www.songsterr.com/a/wsa/white-stripes-seven-nation-army-drum-tab-s265',
      title: 'Seven Nation Army', artist: 'The White Stripes', genre: 'Rock',
      video: '9ZDBUv9tMQ0', lesson: 'Play-along dengan notasi dan audio drum',
      publisher: 'Drumscore', access: 'PDF berbayar · 2 halaman',
      score: 'https://drumscore.com/sheet-music/browse-by-artist/score/12768-the-white-stripes-7-nation-army-drum-sheet-music-tab'
    },
    {
      drumTab: 'https://www.songsterr.com/a/wsa/ac-dc-back-in-black-drum-tab-s1024',
      title: 'Back in Black', artist: 'AC/DC', genre: 'Rock',
      video: 'R9TAJzoDAGg', lesson: 'Audio drum dengan notasi oleh Duke Grooves',
      publisher: 'Andrew Rooney Drums', access: 'PDF gratis',
      score: 'https://andrewrooneydrums.com/wp-content/uploads/2020/04/back-in-black-1.pdf'
    },
    {
      drumTab: 'https://www.songsterr.com/a/wsa/nirvana-smells-like-teen-spirit-about-nirvana-version-drums-only-drum-tab-s3734745',
      title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Rock',
      video: 'FYHFPITGBlA', lesson: 'Video partitur oleh Drumistry',
      publisher: 'Drumscore', access: 'PDF berbayar · 2 halaman',
      score: 'https://bypass.drumscore.com/sheet-music/browse-by-artist/score/11848-nirvana-smells-like-teen-spirit-drum-sheet-music-tab'
    }
  ];

  for (const song of songs) {
    song.key = 'song_' + song.video;
    installPattern(song.key, practicePattern(song));
  }

  function renderSongs() {
    const results = $('#songCollectionCards');
    results.replaceChildren();
    const query = $('#collectionSearch').value.trim().toLowerCase();
    const genre = $('#collectionFilter').value;
    for (const song of songs) {
      if (genre !== 'all' && song.genre !== genre) continue;
      if (![song.title, song.artist, song.genre, song.series].join(' ').toLowerCase().includes(query)) continue;
      const card = document.createElement('article');
      card.className = 'collection-card';
      const title = document.createElement('h3');
      title.textContent = song.title;
      const meta = document.createElement('p');
      meta.textContent = [song.artist, song.genre, song.series].filter(Boolean).join(' · ');
      const button = document.createElement('button');
      button.textContent = 'Buka notasi latihan · 4 bar';
      button.addEventListener('click', () => window.openCollectionScore(song.key));
      card.append(title, meta, button);
      results.append(card);
    }
    $('#songCollectionSection').hidden = !results.childElementCount;
    return results.childElementCount;
  }

  window.renderCollectionSongs = renderSongs;
})();
