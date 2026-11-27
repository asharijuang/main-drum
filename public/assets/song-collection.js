'use strict';

(() => {
  const songs = [
    {
      title: 'Gurenge', artist: 'LiSA', genre: 'Anime', series: 'Demon Slayer',
      video: '9rvANJjWsWo', lesson: 'Drum cover lengkap dengan notasi',
      publisher: 'Art of Drumming HQ', access: 'PDF berbayar · 4 halaman',
      score: 'https://artofdrumminghq.com/products/gurenge-%E7%B4%85%E8%93%AE%E8%8F%AF-lisa-drum-sheet-music-score-transcription'
    },
    {
      title: 'Blue Bird', artist: 'Ikimonogakari', genre: 'Anime', series: 'Naruto Shippuden',
      video: 's7GAwvYUZJQ', lesson: 'Drum cover lengkap oleh Raymond Goh',
      publisher: 'COPYDRUM', access: 'Partitur berbayar',
      score: 'https://drumsetsheetmusic.com/products/blue-bird-naruto-shippuden-op-3-full-drum-transcription-drum-sheet-music-copydrum'
    },
    {
      title: 'Silhouette', artist: 'KANA-BOON', genre: 'Anime', series: 'Naruto Shippuden',
      video: 'ActZ40BcIR0', lesson: 'Drum cover dengan notasi oleh Gather Music',
      publisher: 'Sheet Music Plus', access: 'Aransemen pemula berbayar',
      score: 'https://www.sheetmusicplus.com/en/product/silhouette-23885324.html'
    },
    {
      title: 'Seven Nation Army', artist: 'The White Stripes', genre: 'Rock',
      video: '9ZDBUv9tMQ0', lesson: 'Play-along dengan notasi dan audio drum',
      publisher: 'Drumscore', access: 'PDF berbayar · 2 halaman',
      score: 'https://drumscore.com/sheet-music/browse-by-artist/score/12768-the-white-stripes-7-nation-army-drum-sheet-music-tab'
    },
    {
      title: 'Back in Black', artist: 'AC/DC', genre: 'Rock',
      video: 'R9TAJzoDAGg', lesson: 'Audio drum dengan notasi oleh Duke Grooves',
      publisher: 'Andrew Rooney Drums', access: 'PDF gratis',
      score: 'https://andrewrooneydrums.com/wp-content/uploads/2020/04/back-in-black-1.pdf'
    },
    {
      title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Rock',
      video: 'FYHFPITGBlA', lesson: 'Video partitur oleh Drumistry',
      publisher: 'Drumscore', access: 'PDF berbayar · 2 halaman',
      score: 'https://bypass.drumscore.com/sheet-music/browse-by-artist/score/11848-nirvana-smells-like-teen-spirit-drum-sheet-music-tab'
    }
  ];

  const dialog = $('#songReader');
  function openSong(song) {
    stop();
    $('#songReaderTitle').textContent = song.title + ' · ' + song.artist;
    $('#songReaderInfo').textContent = song.lesson;
    const video = document.createElement('iframe');
    video.title = song.lesson + ' · ' + song.title;
    video.allowFullscreen = true;
    video.referrerPolicy = 'strict-origin-when-cross-origin';
    video.src = 'https://www.youtube-nocookie.com/embed/' + song.video;
    $('#songReaderVideo').replaceChildren(video);
    const score = makeLink(song.access + ' · ' + song.publisher, song.score);
    const youtube = makeLink('Buka di YouTube', 'https://www.youtube.com/watch?v=' + song.video);
    $('#songReaderLinks').replaceChildren(score, youtube);
    dialog.showModal();
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
      button.textContent = 'Buka lagu';
      button.addEventListener('click', () => openSong(song));
      card.append(title, meta, button);
      results.append(card);
    }
    $('#songCollectionSection').hidden = !results.childElementCount;
    return results.childElementCount;
  }

  $('#closeSongReader').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => $('#songReaderVideo').replaceChildren());
  window.renderCollectionSongs = renderSongs;
})();
