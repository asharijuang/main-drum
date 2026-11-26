'use strict';
(() => {
  const ui=id=>document.getElementById(id);
  let asset=null,analysis=null,tempo=null,worker=null,workerSerial=0,assetVersion=0,analysisVersion=0,activeLevel=0;
  let audioUrl=null,backing=null,backingGain=null;
  const requests=new Map();
  const referenceLoader=DrumAnalysisReferences.createLoader({baseUrl:document.baseURI});
  const labels=['Ikuti beat','Fondasi','Groove dasar','Variasi','Draf bagian'];
  function tell(text,error=false){ui('songStatus').textContent=text;ui('songStatus').classList.toggle('error',error);}
  function getWorker(){
    if(worker)return worker;worker=new Worker(new URL('./assets/song-worker.js',document.baseURI));
    worker.onmessage=({data})=>{const job=requests.get(data.id);if(!job)return;requests.delete(data.id);data.error?job.reject(Error(data.error)):job.resolve(data.result);};
    worker.onerror=event=>{for(const job of requests.values())job.reject(Error(event.message||'Worker analisis gagal.'));requests.clear();worker?.terminate();worker=null;};
    return worker;
  }
  function task(type,data,transfer=[]){return new Promise((resolve,reject)=>{const id=++workerSerial;requests.set(id,{resolve,reject});getWorker().postMessage({id,type,...data},transfer);});}
  function stopBacking(){if(backing){try{backing.stop();backing.disconnect();}catch{}backing=null;}backingGain=null;ui('songPractice').textContent='Latih bersama rekaman';}
  globalThis.DrumSongLab={setRecording,stopBacking,pausePreview:()=>ui('songAudio').pause()};
  function wavBlob(samples,rate){const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);const str=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};str(0,'RIFF');view.setUint32(4,36+samples.length*2,true);str(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return new Blob([buffer],{type:'audio/wav'});}
  async function setRecording(samples,rate,metadata={}){
    if(!(samples instanceof Float32Array)||samples.length/rate<.5||samples.length/rate>300.1)throw Error('Gunakan rekaman 0,5 detik sampai 5 menit.');
    let peak=0;for(const v of samples)peak=Math.max(peak,Math.abs(v));if(peak<.0001)throw Error('Rekaman diam. Periksa audio tab atau file yang dipilih.');
    const version=++assetVersion;++analysisVersion;stopBacking();ui('songAudio').pause();
    asset={samples,rate,duration:samples.length/rate,...metadata};analysis=null;tempo=null;activeLevel=0;
    if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(wavBlob(samples,rate));ui('songAudio').src=audioUrl;
    ui('songRecording').hidden=false;ui('songLevels').hidden=true;ui('songCandidates').replaceChildren();ui('songStart').value='0';ui('songName').value=metadata.name||(metadata.id?'YouTube '+metadata.id:'Rekaman latihan');
    ui('songMeta').textContent=asset.duration.toFixed(1)+' detik · '+rate.toLocaleString('id-ID')+' Hz · tersimpan di memori tab ini';
    drawWaveform();updateSelection();tell('Rekaman siap. Mencari kandidat tempo di background…');
    ui('songTempo').disabled=true;
    try{const mono=DrumSong.downsample(samples,rate,8000);const result=await task('tempo',{samples:mono.buffer,rate:8000},[mono.buffer]);if(assetVersion!==version)return;applyTempoResult(result);}
    catch(error){if(assetVersion===version)tell('Rekaman siap. '+error.message+' Isi BPM manual, pilih awal bar, lalu analisis bagian.',true);}
    finally{if(assetVersion===version)ui('songTempo').disabled=false;}
  }
  function applyTempoResult(result){tempo=result;const candidates=ui('songCandidates');candidates.replaceChildren();for(const candidate of result.candidates){const button=document.createElement('button');button.textContent=candidate.bpm+' BPM';button.disabled=candidate.bpm>180||candidate.bpm<30;button.addEventListener('click',()=>setTempo(candidate.bpm));candidates.append(button);}const supported=result.candidates.find(c=>c.bpm<=180&&c.bpm>=30);if(supported)setTempo(supported.bpm);ui('songTempoReport').textContent='Kandidat utama '+result.bpm+' BPM · kekuatan periodisitas '+result.strength+(result.variable?' · ritme mungkin berubah':'')+'. Ini bukan kepastian hitungan 1.';tell('Tempo perkiraan tersedia. Bandingkan setengah/dobel, lalu tentukan awal bar pada waveform.');}
  function invalidateAnalysis(){++analysisVersion;analysis=null;ui('songLevels').hidden=true;stopBacking();}
  function setTempo(value){invalidateAnalysis();ui('ytCaptureBpm').value=Math.max(30,Math.min(180,value));updateSelection();}
  function selection(){if(!asset)throw Error('Rekam atau impor audio dahulu.');const bpm=Number(ui('ytCaptureBpm').value),start=Number(ui('songStart').value),bars=Number(ui('songAnalyzeBars').value);if(!Number.isFinite(bpm)||bpm<30||bpm>180||!Number.isFinite(start)||start<0||start>=asset.duration)throw Error('Periksa BPM 30–180 dan waktu awal bagian.');return {bpm,start,end:Math.min(asset.duration,start+240/bpm*bars),grid:+ui('ytCaptureGrid').value,bars,outputBars:+ui('ytCaptureBars').value,mode:ui('ytCaptureMode').value,sensitivity:+ui('ytCaptureSensitivity').value,source:(asset.source||'Rekaman lokal')+' · '+ui('songName').value+' · '+ui('songSection').value+' @ '+start.toFixed(2)+'s'};}
  function updateSelection(){if(!asset)return;try{const s=selection();ui('songRange').textContent=s.start.toFixed(2)+' – '+s.end.toFixed(2)+' detik · '+((s.end-s.start)*s.bpm/240).toFixed(1)+' bar 4/4';}catch(error){ui('songRange').textContent=error.message;}drawWaveform();}
  function drawWaveform(){
    if(!asset)return;const canvas=ui('songWaveform'),width=Math.max(300,canvas.clientWidth||600),height=110;canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio;const context=canvas.getContext('2d');context.scale(devicePixelRatio,devicePixelRatio);context.fillStyle='#14231b';context.fillRect(0,0,width,height);const step=Math.max(1,Math.floor(asset.samples.length/width));context.strokeStyle='#85bb9c';context.beginPath();for(let x=0;x<width;x++){let peak=0;const at=x*step;for(let j=0;j<step;j+=Math.max(1,Math.floor(step/80)))peak=Math.max(peak,Math.abs(asset.samples[at+j]||0));context.moveTo(x,height/2-peak*height*.45);context.lineTo(x,height/2+peak*height*.45);}context.stroke();
    try{const {start,end}=selection();const a=start/asset.duration*width,b=end/asset.duration*width;context.fillStyle='#dcb67b33';context.fillRect(a,0,b-a,height);context.strokeStyle='#ffd59d';context.beginPath();context.moveTo(a,0);context.lineTo(a,height);context.stroke();}catch{}
  }
  async function prepareModel(){
    try{const {references,name}=await referenceLoader.load();return {...await task('train',{references}),referenceName:name};}
    catch(error){const failure=Error('Model referensi tidak dapat dimuat: '+error.message);failure.code='REFERENCE_LOAD';throw failure;}
  }
  async function analyze(){
    if(!asset)return;tell('Menganalisis bagian di background…');ui('songAnalyze').disabled=true;ui('songReferenceFallback').hidden=true;
    const ownVersion=++analysisVersion,version=assetVersion;
    try{const options=selection();if(options.end-options.start<.5)throw Error('Bagian terlalu pendek.');if(options.mode==='spectral'){tell('Memuat referensi analisis bawaan…');const trained=await prepareModel();ui('songEngine').textContent=trained.referenceName+' · '+trained.templates+' template kick/snare/hi-hat · terpisah dari sound playback. Tidak dilatih pada seluruh lagu.';}
      else ui('songEngine').textContent=options.mode==='multi'?'Multi-band eksperimen: dapat menambah false positive.':'Detektor frekuensi lama untuk perbandingan.';
      const samples=asset.samples.slice(Math.floor(options.start*asset.rate),Math.floor(options.end*asset.rate));
      const result=await task('analyze',{samples:samples.buffer,rate:asset.rate,options},[samples.buffer]);
      if(version!==assetVersion||ownVersion!==analysisVersion)return;
      analysis={...result,options,name:ui('songName').value,section:ui('songSection').value};renderLevels();
      tell(result.hits.length+' event perkiraan · '+result.groove.analyzedBars+' bar dianalisis · groove wakil dari bar '+result.groove.representativeBar+' · kemiripan pengulangan '+result.groove.repeatSimilarity+'. Lima level siap, bukan partitur terverifikasi.');
    }catch(error){if(version===assetVersion&&ownVersion===analysisVersion){tell('Analisis belum berhasil: '+error.message+(error.code==='REFERENCE_LOAD'?' Rekamanmu tetap aman. Coba lagi setelah server/file diperbaiki, atau gunakan detektor tanpa sample.':''),true);if(error.code==='REFERENCE_LOAD')ui('songReferenceFallback').hidden=false;}}
    finally{ui('songAnalyze').disabled=false;}
  }
  function patternFor(index){const p=coreCopy(analysis.levels[index]);p.name=analysis.name+' · '+analysis.section+' · L'+(index+1)+' '+labels[index];p.source=analysis.options.source;p.info=analysis.levels[index].info;return p;}
  function coreCopy(p){return DrumCore.cleanPattern(p);}
  function selectLevel(index){if(!analysis)return;activeLevel=index;const p=patternFor(index);installPattern('song_level_'+index,p,analysis.options.bpm);choose('song_level_'+index);document.querySelectorAll('[data-song-level]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.songLevel===index)));ui('songLevelInfo').textContent=p.info;}
  function renderLevels(){ui('songLevels').hidden=false;const host=ui('songLevelButtons');host.replaceChildren();analysis.levels.forEach((p,index)=>{const button=document.createElement('button');button.textContent=(index+1)+' · '+labels[index];button.dataset.songLevel=index;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>selectLevel(index));host.append(button);});selectLevel(0);}
  async function practice(){if(DrumYouTubeCapture.isCapturing){tell('Selesaikan capture sebelum latihan bersama.',true);return;}if(!asset||!analysis)return;if(backing){stop();return;}try{
      stop();ui('songAudio').pause();selectLevel(activeLevel);await play();if(!running)return;
      const s=analysis.options,barSeconds=240/s.bpm,available=Math.floor((s.end-s.start)/barSeconds+.001),wanted=activeLevel===4?analysis.levels[4].steps/analysis.levels[4].barSteps:s.bars,bars=Math.min(wanted,available);if(bars<1){stop();throw Error('Bagian perlu minimal satu bar penuh untuk loop bersama.');}
      const from=Math.round(s.start*asset.rate),length=Math.round(bars*barSeconds*asset.rate),buffer=ctx.createBuffer(1,length,asset.rate);buffer.copyToChannel(asset.samples.subarray(from,from+length),0);
      backing=ctx.createBufferSource();backing.buffer=buffer;backing.loop=true;backingGain=ctx.createGain();backingGain.gain.value=+ui('songBackingVolume').value;backing.connect(backingGain);backingGain.connect(ctx.destination);backing.start(pending[0]?.t||ctx.currentTime+.08);ui('songPractice').textContent='Hentikan latihan bersama';
      tell('Loop rekaman dan pola dimulai pada clock audio yang sama. Jeda YouTube aslinya agar tidak terdengar dobel. Jika bergeser, koreksi BPM dan awal bar.');
    }catch(error){tell(error.message,true);}}
  ui('songWaveform').addEventListener('click',event=>{if(!asset)return;invalidateAnalysis();const rect=event.currentTarget.getBoundingClientRect();ui('songStart').value=Math.max(0,Math.min(asset.duration-.1,(event.clientX-rect.left)/rect.width*asset.duration)).toFixed(2);updateSelection();});
  for(const id of ['songStart','songAnalyzeBars','ytCaptureBpm','ytCaptureGrid','ytCaptureMode','ytCaptureSensitivity','ytCaptureBars','songSection','songName'])ui(id).addEventListener('change',()=>{invalidateAnalysis();updateSelection();});
  ui('songBeatBack').addEventListener('click',()=>{invalidateAnalysis();ui('songStart').value=Math.max(0,+ui('songStart').value-60/(+ui('ytCaptureBpm').value||120)).toFixed(2);updateSelection();});
  ui('songBeatNext').addEventListener('click',()=>{if(!asset)return;invalidateAnalysis();ui('songStart').value=Math.min(asset.duration-.1,+ui('songStart').value+60/(+ui('ytCaptureBpm').value||120)).toFixed(2);updateSelection();});
  ui('songUseBeat').addEventListener('click',()=>{if(!tempo||!asset)return;invalidateAnalysis();const current=+ui('songStart').value;ui('songStart').value=Math.min(asset.duration-.1,tempo.firstBeat+Math.round(Math.max(0,current-tempo.firstBeat)/tempo.period)*tempo.period).toFixed(2);updateSelection();});
  ui('songTempo').addEventListener('click',async()=>{if(!asset)return;const version=assetVersion;ui('songTempo').disabled=true;tell('Menghitung kandidat tempo…');try{const mono=DrumSong.downsample(asset.samples,asset.rate);const result=await task('tempo',{samples:mono.buffer,rate:8000},[mono.buffer]);if(version===assetVersion)applyTempoResult(result);}catch(error){tell(error.message,true);}finally{ui('songTempo').disabled=false;}});
  ui('songHalfTempo').addEventListener('click',()=>setTempo(+ui('ytCaptureBpm').value/2));ui('songDoubleTempo').addEventListener('click',()=>setTempo(+ui('ytCaptureBpm').value*2));
  ui('songAnalyze').addEventListener('click',analyze);ui('songPractice').addEventListener('click',practice);
  ui('songReferenceFallback').addEventListener('click',()=>{invalidateAnalysis();ui('ytCaptureMode').value='bands';analyze();});
  ui('songBackingVolume').addEventListener('input',()=>{if(backingGain)backingGain.gain.setTargetAtTime(+ui('songBackingVolume').value,ctx.currentTime,.02);});
  ui('songUseLevel').addEventListener('click',()=>{if(!analysis)return;loadDraft(patternFor(activeLevel));status('#editorStatus','Level '+(activeLevel+1)+' dari rekaman. Ini aransemen latihan/draf, bukan transkripsi pasti.');showTool('youtube');});
  ui('songSaveLevels').addEventListener('click',()=>{if(!analysis)return;if(appData.patterns.length>95){tell('Koleksi hampir penuh. Hapus beberapa pola dahulu.',true);return;}for(let i=0;i<5;i++){const item={id:uid(),bpm:analysis.options.bpm,pattern:patternFor(i)};appData.patterns.unshift(item);installPattern('saved_'+item.id,item.pattern);}const ok=persist();renderLibrary();tell(ok?'Lima level disimpan ke koleksi browser. Rekaman audio tetap perlu dicadangkan terpisah.':'Penyimpanan browser gagal; ekspor pola untuk cadangan.',!ok);});
  ui('songPreview').addEventListener('click',()=>{if(DrumYouTubeCapture.isCapturing){tell('Selesaikan capture sebelum mendengarkan rekaman lokal.',true);return;}try{const s=selection();stop();const audio=ui('songAudio');audio.currentTime=s.start;audio.play().catch(error=>tell(error.message,true));}catch(error){tell(error.message,true);}});
  ui('songAudio').addEventListener('play',()=>{if(DrumYouTubeCapture.isCapturing)ui('songAudio').pause();});
  ui('songAudio').addEventListener('timeupdate',()=>{if(!asset||!ui('songLoop').checked)return;try{const s=selection(),audio=ui('songAudio');if(audio.currentTime>=s.end)audio.currentTime=s.start;}catch{}});
  ui('songDownload').addEventListener('click',()=>{if(asset)download(wavBlob(asset.samples,asset.rate),'drum-study-recording.wav');});
  ui('songImport').addEventListener('click',()=>ui('songFile').click());
  ui('songLoadExample').addEventListener('click',async()=>{
    if(DrumYouTubeCapture.isCapturing){tell('Selesaikan capture dahulu.',true);return;}
    ui('songLoadExample').disabled=true;tell('Memuat contoh WAV 120 BPM yang polanya sudah diketahui…');
    try{
      const response=await fetch(new URL('./examples/drum-test-120bpm-64s.wav',document.baseURI),{cache:'no-store'});
      if(!response.ok)throw Error('WAV contoh tidak ditemukan (HTTP '+response.status+'). Pastikan app dijalankan dari folder proyek terbaru.');
      const context=new AudioContext({sampleRate:48000});let buffer;try{buffer=await context.decodeAudioData(await response.arrayBuffer());}finally{await context.close();}
      const samples=new Float32Array(buffer.length);for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]+=data[i]/buffer.numberOfChannels;}
      await setRecording(samples,buffer.sampleRate,{name:'Contoh drum 120 BPM',source:'Contoh terkontrol Drum Companion · 64 detik'});
      setTempo(120);ui('songStart').value='0';ui('songAnalyzeBars').value='8';ui('ytCaptureGrid').value='4';ui('ytCaptureBars').value='4';ui('ytCaptureMode').value='spectral';updateSelection();
      tell('Contoh siap: 64 detik, 120 BPM, 4/4. Untuk pembanding, analisis 0–16 detik (8 bar). Hi-hat eighths; kick di 1/3; snare di 2/4. Klik Analisis bagian & buat 5 level.');
    }catch(error){tell('Contoh gagal dimuat: '+error.message,true);}finally{ui('songLoadExample').disabled=false;}
  });
  ui('songFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(DrumYouTubeCapture.isCapturing)throw Error('Selesaikan capture dahulu.');if(file.size>100*1024*1024)throw Error('File lebih dari 100 MB.');tell('Membaca rekaman audio…');const context=new AudioContext({sampleRate:48000});let buffer;try{buffer=await context.decodeAudioData(await file.arrayBuffer());}finally{await context.close();}if(buffer.duration>300)throw Error('Gunakan potongan audio maksimal 5 menit.');const samples=new Float32Array(buffer.length);for(let c=0;c<buffer.numberOfChannels;c++){const d=buffer.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]+=d[i]/buffer.numberOfChannels;}await setRecording(samples,buffer.sampleRate,{name:file.name.replace(/\.[^.]+$/,''),source:'File lokal '+file.name});}catch(error){tell(error.message,true);}event.target.value='';});
  new ResizeObserver(drawWaveform).observe(ui('songWaveform'));
  window.addEventListener('beforeunload',()=>{stopBacking();worker?.terminate();if(audioUrl)URL.revokeObjectURL(audioUrl);});
})();
