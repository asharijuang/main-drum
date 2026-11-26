'use strict';
(() => {
  const ui = id => document.getElementById(id);
  let capture = null;
  let pending = false;
  let token = 0;
  let locked = [];
  const api = { isCapturing: false };
  globalThis.DrumYouTubeCapture = api;

  function message(text, error = false) {
    ui('ytCaptureStatus').textContent = text;
    ui('ytCaptureStatus').classList.toggle('error', error);
  }
  function buttons() {
    ui('ytConnectAudio').disabled = pending || !!capture;
    ui('ytBeginCapture').disabled = pending || !capture || api.isCapturing;
    ui('ytFinishCapture').disabled = !api.isCapturing;
    ui('ytCancelCapture').disabled = !pending && !capture;
    ui('ytCaptureTarget').disabled = pending || !!capture;
    ui('ytOpenExternal').disabled = pending || api.isCapturing;
    ui('ytCancelCapture').textContent = api.isCapturing ? 'Batalkan tangkapan' : pending ? 'Batalkan pemilihan' : 'Ganti / putuskan sumber';
  }
  function lockApp(on) {
    if (on) {
      const ids = ['play','reset','pattern','previewDraft','recordMidi','startSession','loadYoutube','applySegment','bpm','slower','faster','ytCaptureBpm','ytCaptureGrid','ytCaptureBars','ytCaptureMode','ytCaptureSensitivity','ytCaptureUseBpm','ytCaptureDuration','songFile','songImport','songAnalyze','songPractice','songPreview','songTempo'];
      locked = ids.map(id => ({ node: ui(id), disabled: ui(id)?.disabled }));
      for (const { node } of locked) if (node) node.disabled = true;
      if (ui('midiMonitor')) { locked.push({ node: ui('midiMonitor'), disabled: ui('midiMonitor').disabled, checked: ui('midiMonitor').checked }); ui('midiMonitor').checked = false; ui('midiMonitor').disabled = true; }
    } else {
      for (const { node, disabled, checked } of locked) if (node) { node.disabled = disabled; if (checked !== undefined) node.checked = checked; }
      locked = [];
    }
  }
  function release() {
    const old = capture;
    capture = null;
    api.isCapturing = false;
    if (old) {
      clearInterval(old.meterTimer);
      clearTimeout(old.watchdog);
      old.node.port.onmessage = null;
      try { old.source.disconnect(); old.node.disconnect(); old.mute.disconnect(); } catch {}
      for (const track of old.stream.getTracks()) { track.onended = null; track.stop(); }
      old.context.close().catch(() => {});
    }
    lockApp(false);
    ui('ytLevel').value = 0;
    ui('ytCaptureSource').textContent = 'Audio terputus · tidak ada tab yang sedang direkam';
    buttons();
  }
  async function connectAudio() {
    if (pending || capture) return;
    const id = youtubeId(ui('youtubeUrl').value) || videoId;
    if (recording || session) { message('Akhiri rekaman MIDI atau sesi latihan sebelum menangkap audio.', true); return; }
    if (!isSecureContext || !navigator.mediaDevices?.getDisplayMedia || !globalThis.AudioWorkletNode) { message('Fitur ini memerlukan Chrome/Edge desktop melalui localhost atau HTTPS. Buka dengan npm start; jangan lewat file:// atau browser dalam app yang tidak mendukung capture.', true); return; }
    const ownToken = ++token;
    pending = true; buttons();
    const target = ui('ytCaptureTarget').value;
    message(target === 'other' ? 'Pada dialog browser, buka Chrome Tab / Microsoft Edge Tab, pilih tab YouTube yang sudah diputar, lalu centang Bagikan audio tab dan tekan Bagikan.' : 'Pada dialog browser, pilih tab app ini dan aktifkan Bagikan audio tab. Pastikan video di dalam app sudah bisa diputar.');
    let stream, context;
    try {
      const streamPromise = navigator.mediaDevices.getDisplayMedia(DrumTranscription.displayOptions(target));
      stop();
      stream = await streamPromise;
      if (ownToken !== token) { stream.getTracks().forEach(track => track.stop()); return; }
      if (!stream.getAudioTracks().length) throw Error('Sumber tidak membawa audio. Pilih tab browser dan aktifkan Bagikan audio tab.');
      context = new AudioContext({ sampleRate: 48000 });
      await context.resume();
      await context.audioWorklet.addModule(new URL('./assets/capture-processor.js', document.baseURI));
      if (ownToken !== token) { stream.getTracks().forEach(track => track.stop()); await context.close(); return; }
      const source = context.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(context, 'drum-tab-capture', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      const analyser = context.createAnalyser(); analyser.fftSize = 1024;
      const mute = context.createGain(); mute.gain.value = 0;
      source.connect(analyser); analyser.connect(node); node.connect(mute); mute.connect(context.destination);
      const state = { stream, context, source, node, analyser, mute, chunks: [], frames: 0, id, config: null, recording: false };
      capture = state;
      ui('ytCaptureSource').textContent = 'Sumber terpilih: ' + (stream.getVideoTracks()[0]?.label || stream.getAudioTracks()[0].label || 'tab yang dipilih');
      const meter = new Float32Array(analyser.fftSize);
      state.meterTimer = setInterval(() => {
        if (capture !== state) return;
        analyser.getFloatTimeDomainData(meter);
        let sum = 0; for (const v of meter) sum += v * v;
        ui('ytLevel').value = Math.min(1, Math.sqrt(sum / meter.length) * 6);
        if (state.recording) {
          const duration = state.frames / context.sampleRate;
          ui('ytCaptureProgress').value = Math.min(1, duration / state.config.duration);
          ui('ytCaptureTime').textContent = duration.toFixed(1) + ' / ' + state.config.duration.toFixed(1) + ' detik';
        }
      }, 100);
      node.port.onmessage = ({ data }) => {
        if (capture !== state) return;
        if (data.type === 'chunk' && state.recording) { const chunk = new Float32Array(data.samples); state.chunks.push(chunk); state.frames += chunk.length; }
        else if (data.type === 'done' && state.recording) finish(state);
      };
      node.onprocessorerror = () => { if (capture === state) { release(); message('Pemroses audio berhenti. Hubungkan ulang sumber audio.', true); } };
      for (const track of stream.getTracks()) track.onended = () => {
        if (capture !== state) return;
        if (state.recording) node.port.postMessage({ type: 'stop' });
        else { release(); message('Berbagi audio dihentikan. Hubungkan ulang untuk mencoba lagi.'); }
      };
      message('Audio terhubung. Putar bagian YouTube yang diinginkan; pastikan meter bergerak. Tekan Mulai tangkap. BPM dicari setelah rekaman selesai.');
    } catch (error) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (context && context.state !== 'closed') context.close().catch(() => {});
      if (ownToken === token) message(error.name === 'NotAllowedError' ? 'Izin berbagi dibatalkan atau ditolak. Catatanmu tetap aman; tekan Hubungkan audio untuk mencoba lagi.' : 'Tidak bisa menangkap audio: ' + error.message, true);
    } finally { if (ownToken === token) { pending = false; buttons(); } }
  }
  function begin() {
    if (!capture || api.isCapturing) return;
    if (recording || session) { message('Akhiri rekaman MIDI atau sesi latihan dahulu.', true); return; }
    const options = {duration:Number(ui('ytCaptureDuration').value)};if(![15,30,60,120,300].includes(options.duration)){message('Pilih durasi rekaman yang valid.',true);return;}globalThis.DrumSongLab?.pausePreview();
    stop();
    capture.config = options;
    capture.chunks = []; capture.frames = 0; capture.recording = true;
    api.isCapturing = true;
    lockApp(true);
    ui('ytCaptureProgress').value = 0;
    ui('ytCaptureTime').textContent = '0.0 / ' + options.duration.toFixed(1) + ' detik';
    capture.node.port.postMessage({ type: 'start', frames: Math.round(options.duration * capture.context.sampleRate) });
    const state = capture;
    state.watchdog = setTimeout(() => { if (capture === state) { release(); message('Audio tidak selesai diterima. Hubungkan ulang dan pastikan YouTube tetap diputar.', true); } }, options.duration * 1000 + 6000);
    message('Menangkap audio YouTube… Pola drum app dijeda agar tidak ikut direkam. Editor lama tetap aman sampai kamu memakai hasilnya.');
    buttons();
  }
  async function finish(state) {
    if (capture !== state || !state.recording) return;
    state.recording = false;
    const samples = new Float32Array(state.frames);
    let at=0;for(const chunk of state.chunks){samples.set(chunk,at);at+=chunk.length;}
    const rate=state.context.sampleRate,id=state.id,analysisToken=token;
    release();message('Rekaman selesai. Menyiapkan waveform dan kandidat tempo…');
    await new Promise(resolve=>setTimeout(resolve,0));if(analysisToken!==token)return;
    try{await DrumSongLab.setRecording(samples,rate,{id,source:'Audio tab pilihan pengguna'+(id?' · https://www.youtube.com/watch?v='+id:'')});message('Rekaman tersimpan di Song Lab. Pilih bagian dan awal bar, lalu buat lima level latihan.');}
    catch(error){message('Rekaman belum dapat digunakan: '+error.message,true);}
  }
  ui('ytConnectAudio').addEventListener('click', connectAudio);
  ui('ytOpenExternal').addEventListener('click', () => {
    const id = youtubeId(ui('youtubeUrl').value) || videoId;
    if (!id) { message('Isi link YouTube yang valid dahulu. Untuk sumber tab lain, kamu bisa langsung memakai Pilih tab audio.', true); return; }
    window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener,noreferrer');
    if (!capture) ui('ytCaptureTarget').value = 'other';
    message(capture ? 'Tab YouTube dibuka. Sumber audio saat ini tetap sama; tekan Ganti / putuskan sumber lalu pilih tab baru.' : 'Putar video di tab YouTube yang baru dibuka. Kembali ke tab app ini, lalu tekan Pilih tab audio dan pilih tab YouTube tersebut.');
  });
  ui('ytUseLocalAudio').addEventListener('click', () => ui('songFile').click());
  ui('ytBeginCapture').addEventListener('click', begin);
  ui('ytFinishCapture').addEventListener('click', () => { if (capture?.recording) capture.node.port.postMessage({ type: 'stop' }); });
  ui('ytCancelCapture').addEventListener('click', () => { token++; pending = false; release(); message('Capture dibatalkan. Tidak ada catatan yang diganti.'); });
  ui('ytCaptureUseBpm').addEventListener('click', () => { ui('ytCaptureBpm').value = bpm(); });
  ui('useTapTempo').addEventListener('click', () => { if (!api.isCapturing) ui('ytCaptureBpm').value = bpm(); });
  ui('ytCaptureBpm').value = bpm();
  window.addEventListener('beforeunload', release);
  buttons();
})();
