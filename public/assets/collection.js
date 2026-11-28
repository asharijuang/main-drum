'use strict';
(()=>{
 const host=document.getElementById('collectionCards'),search=document.getElementById('collectionSearch'),filter=document.getElementById('collectionFilter');
 function list(){host.replaceChildren();const songCount=renderCollectionSongs();const query=search.value.toLocaleLowerCase('id');for(const [key,p] of Object.entries(patterns)){if(p.song||['Anime','Rock'].includes(filter.value)||key==='draft'||filter.value==='saved'&&!key.startsWith('saved_')||filter.value==='built'&&key.startsWith('saved_'))continue;if(!(p.name+' '+(p.category||'')+' '+(p.info||'')).toLocaleLowerCase('id').includes(query))continue;const card=document.createElement('article'),h=document.createElement('h2'),meta=document.createElement('p'),info=document.createElement('p'),button=document.createElement('button');card.className='collection-card';h.textContent=p.name;meta.textContent=p.meter+' · '+(p.category||'Latihan dasar')+' · '+(p.level||'Pemula')+(p.bpm?' · '+p.bpm+' BPM':'');info.textContent=p.info;button.textContent='Buka notasi';button.addEventListener('click',()=>open(key));card.append(h,meta,info,button);host.append(card);}document.getElementById('collectionCount').textContent=(host.children.length+songCount)+' hasil';if(!host.children.length&&!songCount)host.textContent='Belum ada notasi yang cocok. Coba kata lain atau filter Semua.';}
 let previousSize;
 function open(key){previousSize=$('#playerDock').dataset.size;choose(key);const saved=appData.patterns.find(x=>'saved_'+x.id===key);if(saved||patterns[key].bpm)$('#bpm').value=saved?.bpm||patterns[key].bpm;document.body.classList.add('collection-reading');setPlayerSize('full',false);drawPages();document.getElementById('collectionBack').focus();}
 window.openCollectionScore = open;
 const baseNotation=notation;
 function drawPages(){const p=patterns[selected],barSteps=p.barSteps||(p.meter==='6/8'?6:p.perBeat*Number(p.meter.split('/')[0])),pages=document.getElementById('collectionSheet');pages.replaceChildren();setSongMedia(p.song);document.getElementById('collectionTitle').textContent=p.name;document.getElementById('collectionInfo').textContent=p.info+' '+p.tip;
 for(let start=0;start<p.steps;start+=barSteps){const end=Math.min(p.steps,start+barSteps),bar={...p,steps:end-start,labels:p.labels.slice(start,end),velocities:{}};for(const k of [...Object.keys(partNames),'soft','accent'])bar[k]=(p[k]||[]).filter(i=>i>=start&&i<end).map(i=>i-start);if(p.stick)bar.stick=p.stick.slice(start,end);for(const [key,v]of Object.entries(p.velocities||{})){const [inst,at]=key.split(':');if(+at>=start&&+at<end)bar.velocities[inst+':'+(+at-start)]=v;}if(!p.velocities)delete bar.velocities;baseNotation(bar);const row=document.createElement('section');row.className='sheet-row';row.dataset.bar=start/barSteps;const label=document.createElement('p');label.textContent='Bar '+(start/barSteps+1);const svg=$('#notation svg').cloneNode(true);svg.querySelector('#playhead')?.remove();row.append(label,svg);pages.append(row);}baseNotation(p);}
 const baseUpdate=updateScore;updateScore=function(index,bar){baseUpdate(index,bar);if(index<0||!document.body.classList.contains('collection-reading'))return;const p=patterns[selected],n=p.barSteps||(p.meter==='6/8'?6:p.perBeat*Number(p.meter.split('/')[0]));document.querySelectorAll('.sheet-row').forEach((row,i)=>row.classList.toggle('playing',i===Math.floor(index/n)));const active=document.querySelector('.sheet-row.playing');if(active){let line=active.querySelector('.sheet-cursor');if(!line){line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('class','sheet-cursor');line.setAttribute('y1','32');line.setAttribute('y2','118');active.querySelector('svg').append(line);}const width=Math.max(850,140+n*36),x=92+(index%n)*Math.max(710,n*36)/n;line.setAttribute('x1',x);line.setAttribute('x2',x);}};
 function closeReader() {
   stop();
   setSongMedia(null);
   document.body.classList.remove('collection-reading');
   setPlayerSize(previousSize, false);
   if (document.fullscreenElement === $('#playerDock')) document.exitFullscreen().catch(()=>{});
   search.focus();
 }
 const reader = $('.collection-reader');
 let pdfUrl;
 function clearPDF() {
   $('#pdfView').replaceChildren();
   if (pdfUrl) URL.revokeObjectURL(pdfUrl);
   pdfUrl = null;
   $('#scoreFile').value = '';
   $('#returnScore').hidden = true;
   $('#collectionSheet').hidden = false;
   $('#scoreLegend').hidden = false;
 }
 function setSongMedia(song) {
   clearPDF();
   reader.classList.toggle('with-video', Boolean(song));
   reader.classList.remove('score-only');
   $('#songMedia').hidden = !song;
   $('#scoreOnly').hidden = !song;
   $('#scoreOnly').textContent = 'Perbesar notasi';
   $('#songScoreFiles').hidden = !song;
   const host = $('#referenceVideo');
   host.replaceChildren();
   if (!song) return;
   $('#referenceTitle').textContent = song.lesson;
   const url = 'https://www.youtube.com/watch?v=' + song.video;
   const button = document.createElement('button');
   button.textContent = 'Muat video YouTube';
   button.onclick = () => {
     const iframe = document.createElement('iframe');
     iframe.src = 'https://www.youtube-nocookie.com/embed/' + song.video + '?playsinline=1';
     iframe.allowFullscreen = true;
     iframe.referrerPolicy = 'strict-origin-when-cross-origin';
     iframe.title = song.title + ' · video referensi';
     host.replaceChildren(iframe);
   };
   host.append(button);
   $('#referenceLinks').replaceChildren(makeLink('Buka langsung di YouTube', url),
     makeLink('Cari video lain', 'https://www.youtube.com/results?search_query=' +
       encodeURIComponent(song.artist + ' ' + song.title + ' drum cover sheet music')));
   $('#scorePublisher').replaceChildren(makeLink('Baca track drum di Songsterr', song.drumTab), makeLink('Partitur penerbit · ' + song.access + ' · ' + song.publisher, song.score));
 }
 $('#scoreOnly').onclick = () => {
   const enlarged = reader.classList.toggle('score-only');
   $('#scoreOnly').textContent = enlarged ? 'Tampilkan video' : 'Perbesar notasi';
 };
 $('#returnScore').onclick = clearPDF;
 $('#scoreFile').onchange = () => {
   const file = $('#scoreFile').files[0];
   if (!file) return;
   clearPDF();
   pdfUrl = URL.createObjectURL(file);
   const frame = document.createElement('iframe');
   frame.src = pdfUrl;
   frame.title = 'Partitur PDF · ' + file.name;
   $('#pdfView').append(frame, makeLink('Buka PDF di tab baru', pdfUrl));
   $('#collectionSheet').hidden = true;
   $('#scoreLegend').hidden = true;
   $('#returnScore').hidden = false;
 };
 const dock = $('#playerDock');
 $('#collectionBack').addEventListener('click', closeReader);
 $('#collectionFullscreen').hidden = !document.fullscreenEnabled;
 $('#collectionFullscreen').addEventListener('click', async () => {
   if (document.fullscreenElement === dock) await document.exitFullscreen();
   else await dock.requestFullscreen().catch(()=>{});
 });
 document.addEventListener('fullscreenchange', () => {
   $('#collectionFullscreen').textContent = document.fullscreenElement === dock ? 'Keluar layar penuh' : 'Layar penuh';
 });
 $('#pattern').addEventListener('change', () => {
   if (document.body.classList.contains('collection-reading')) drawPages();
 });
 search.addEventListener('input', list);
 filter.addEventListener('change', list);
 $('#tool-collection').addEventListener('collection-open', list);
 document.addEventListener('keydown', e => {
   if (e.key === 'Escape' && document.body.classList.contains('collection-reading')) closeReader();
 });
 if (location.hash === '#koleksi') document.addEventListener('DOMContentLoaded', () => showTool('collection', true), {once:true});
})();
