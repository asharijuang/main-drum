/* Dedicated analysis samples: independent of the selected playback sound kit. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DrumAnalysisReferences=factory();})(globalThis,function(){
  'use strict';
  function createLoader({baseUrl,fetcher=globalThis.fetch,createContext=()=>new AudioContext({sampleRate:22050})}={}){
    let cached=null;
    async function load(){
      if(cached)return cached;
      cached=(async()=>{
        const manifestUrl=new URL('./sounds/analysis-reference.json',baseUrl);
        if(!['http:','https:'].includes(manifestUrl.protocol))throw Error('Buka app lewat npm start dan http://127.0.0.1:8765 untuk memuat model referensi.');
        const manifestResponse=await fetcher(manifestUrl,{cache:'no-store'});
        if(!manifestResponse.ok)throw Error('Manifest model referensi tidak tersedia (HTTP '+manifestResponse.status+').');
        const manifest=await manifestResponse.json();
        if(!Array.isArray(manifest.samples)||manifest.samples.length!==3||new Set(manifest.samples.map(s=>s.inst)).size!==3||!['kick','sn','hh'].every(k=>manifest.samples.some(s=>s.inst===k)))throw Error('Manifest model harus berisi kick, snare, dan hi-hat.');
        const root=new URL('./',manifestUrl),context=createContext(),references=[];
        try{
          for(const entry of manifest.samples){
            if(typeof entry.file!=='string')throw Error('Path sample model tidak valid.');
            const url=new URL(entry.file,root);
            if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname))throw Error('Sample model harus berada di folder sounds.');
            const response=await fetcher(url,{cache:'no-store'});
            if(!response.ok)throw Error('Sample '+entry.inst+' tidak tersedia: '+entry.file+' (HTTP '+response.status+').');
            let buffer;try{buffer=await context.decodeAudioData(await response.arrayBuffer());}catch{throw Error('Sample '+entry.inst+' gagal dibaca sebagai audio.');}
            const length=Math.min(buffer.length,Math.round(buffer.sampleRate*.4)),samples=new Float32Array(length);
            for(let channel=0;channel<buffer.numberOfChannels;channel++){const audio=buffer.getChannelData(channel);for(let i=0;i<length;i++)samples[i]+=audio[i]/buffer.numberOfChannels;}
            references.push({inst:entry.inst,samples,rate:buffer.sampleRate});
          }
          return {references,name:String(manifest.name||'Referensi drum bawaan')};
        }finally{await context.close();}
      })();
      try{return await cached;}catch(error){cached=null;throw error;}
    }
    return {load};
  }
  return {createLoader};
});
