'use strict';
importScripts('./rhythm-core.js','./song-core.js','./spectral-model.js');
let model=null;
self.onmessage=({data})=>{
  const {id,type}=data;
  try {
    let result;
    if(type==='tempo')result=DrumSong.estimateTempo(new Float32Array(data.samples),data.rate);
    else if(type==='train'){model=DrumSpectral.train(data.references);result={templates:model.templates.length,parts:[...new Set(model.templates.map(t=>t.inst))]};}
    else if(type==='analyze'){
      const samples=new Float32Array(data.samples),options=data.options;
      const localHits=options.mode==='spectral'?(model?DrumSpectral.transcribe(samples,data.rate,model,options):(()=>{throw Error('Model referensi belum disiapkan.');})()):options.mode==='multi'?DrumSong.bandHits(samples,data.rate,options.sensitivity):DrumCore.detectOnsets(samples,data.rate,options.sensitivity,options.mode==='sn'?'sn':'bands');
      const hits=localHits.map(h=>({...h,t:h.t+options.start}));
      const groove=DrumSong.summarizeGroove(hits,options),levels=DrumSong.lessonLevels(groove.pattern);
      const raw=DrumCore.quantizeHits(localHits,options.bpm,options.grid,options.outputBars||1,'Draf bagian asli (perkiraan)',options.source).pattern;
      raw.info='Draf hasil analisis bagian, bukan partitur terverifikasi. Instrumen di luar model bisa hilang atau tertukar.';levels[4]=raw;
      result={hits,groove,levels,engine:options.mode};
    }else throw Error('Tugas worker tidak dikenal.');
    self.postMessage({id,result});
  }catch(error){self.postMessage({id,error:error.message});}
};
