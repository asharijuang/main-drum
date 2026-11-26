/* Shared capture options and legacy short-clip API. Song Lab long recordings use
   song-core.js/song-lab.js; the old helper's 30-second limit is not the recorder limit. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./rhythm-core.js'));else root.DrumTranscription=factory(root.DrumCore);})(globalThis,function(core){
  'use strict';
  function displayOptions(target = 'other') {
    if (!['other', 'current'].includes(target)) throw Error('Pilihan sumber audio tidak valid.');
    return {
      video: { displaySurface: 'browser' },
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, suppressLocalAudioPlayback: false },
      preferCurrentTab: target === 'current',
      selfBrowserSurface: target === 'current' ? 'include' : 'exclude',
      monitorTypeSurfaces: 'exclude',
      systemAudio: 'exclude',
      surfaceSwitching: 'exclude'
    };
  }
  function captureConfig({ bpm = 65, grid = 4, bars = 2, mode = 'bands', sensitivity = 3, align = true } = {}) {
    bpm = Number(bpm); grid = Number(grid); bars = Number(bars); sensitivity = Number(sensitivity);
    if (!Number.isFinite(bpm) || bpm < 30 || bpm > 180) throw Error('BPM harus 30–180.');
    if (![2, 3, 4, 6].includes(grid) || ![1, 2, 4].includes(bars)) throw Error('Grid atau jumlah bar tidak valid.');
    if (!['sn', 'bands'].includes(mode) || ![2, 3, 4.5].includes(sensitivity)) throw Error('Mode deteksi tidak valid.');
    const duration = 240 / bpm * bars;
    if (duration > 30) throw Error('Potongan melebihi 30 detik. Kurangi jumlah bar atau naikkan BPM.');
    return { bpm, grid, bars, mode, sensitivity, align: !!align, duration };
  }
  function makeDraft(samples, rate, options, name = 'YouTube · DRAF AUDIO', source = 'Audio tab yang dipilih pengguna') {
    const config = captureConfig(options);
    if (!(samples instanceof Float32Array) || !Number.isFinite(rate) || rate < 8000 || rate > 384000) throw Error('Data audio tidak valid.');
    if (samples.length < rate * .2) throw Error('Audio terlalu pendek. Tangkap minimal sebagian satu beat.');
    if (samples.length > rate * 30 + 4096) throw Error('Potongan audio terlalu panjang.');
    let peak = 0;
    for (const value of samples) { if (!Number.isFinite(value)) throw Error('Data audio rusak.'); peak = Math.max(peak, Math.abs(value)); }
    if (peak < .0001) throw Error('Audio tab diam. Putar YouTube dan aktifkan Bagikan audio tab saat memilih sumber.');
    const hits = core.detectOnsets(samples, rate, config.sensitivity, config.mode);
    if (!hits.length) throw Error('Belum menemukan pukulan yang jelas. Coba kepekaan tinggi atau bagian dengan drum lebih jelas.');
    const offset = config.align ? hits[0].t : 0;
    const shifted = hits.map(hit => ({ ...hit, t: hit.t - offset }));
    const result = core.quantizeHits(shifted, config.bpm, config.grid, config.bars, name, source);
    const counts = {};
    let notes = 0;
    for (const part of Object.keys(core.DRUM_PARTS)) { counts[part] = result.pattern[part].length; notes += counts[part]; }
    if (!notes) throw Error('Semua pukulan jatuh di luar grid. Periksa BPM dan awal potongannya.');
    return { ...result, counts, notes, onsets: hits.length, offset, capturedSeconds: samples.length / rate, config };
  }
  return { displayOptions, captureConfig, makeDraft };
});
