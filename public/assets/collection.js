'use strict';
(()=>{
 const host=document.getElementById('collectionCards'),search=document.getElementById('collectionSearch'),filter=document.getElementById('collectionFilter');
 function list(){host.replaceChildren();const songCount=renderCollectionSongs();const query=search.value.toLocaleLowerCase('id');for(const [key,p] of Object.entries(patterns)){if(p.song||['Anime','Rock'].includes(filter.value)||key==='draft'||filter.value==='saved'&&!key.startsWith('saved_')||filter.value==='built'&&key.startsWith('saved_'))continue;if(!(p.name+' '+(p.category||'')+' '+(p.info||'')).toLocaleLowerCase('id').includes(query))continue;const card=document.createElement('article'),h=document.createElement('h2'),meta=document.createElement('p'),info=document.createElement('p'),button=document.createElement('button');card.className='collection-card';h.textContent=p.name;meta.textContent=p.meter+' · '+(p.category||'Latihan dasar')+' · '+(p.level||'Pemula')+(p.bpm?' · '+p.bpm+' BPM':'');info.textContent=p.info;button.textContent='Buka notasi';button.addEventListener('click',()=>open(key));card.append(h,meta,info,button);host.append(card);}document.getElementById('collectionCount').textContent=(host.children.length+songCount)+' hasil';if(!host.children.length&&!songCount)host.textContent='Belum ada notasi yang cocok. Coba kata lain atau filter Semua.';}
 let previousSize;
 function open(key){previousSize=$('#playerDock').dataset.size;choose(key);const saved=appData.patterns.find(x=>'saved_'+x.id===key);if(saved||patterns[key].bpm)$('#bpm').value=saved?.bpm||patterns[key].bpm;document.body.classList.add('collection-reading');setPlayerSize('full',false);drawPages();document.getElementById('collectionBack').focus();}
 window.openCollectionScore = open;
 const baseNotation=notation;
 function drawPages(){const p=patterns[selected],barSteps=p.barSteps||(p.meter==='6/8'?6:p.perBeat*Number(p.meter.split('/')[0])),pages=document.getElementById('collectionSheet');activeRow = null;pages.style.removeProperty('--follow-space');pages.replaceChildren();setSongMedia(p.song);document.getElementById('collectionTitle').textContent=p.name;document.getElementById('collectionInfo').textContent=p.info+' '+p.tip;
 for(let start=0;start<p.steps;start+=barSteps){const end=Math.min(p.steps,start+barSteps),bar={...p,steps:end-start,labels:p.labels.slice(start,end),velocities:{}};for(const k of [...Object.keys(partNames),'soft','accent'])bar[k]=(p[k]||[]).filter(i=>i>=start&&i<end).map(i=>i-start);if(p.stick)bar.stick=p.stick.slice(start,end);for(const [key,v]of Object.entries(p.velocities||{})){const [inst,at]=key.split(':');if(+at>=start&&+at<end)bar.velocities[inst+':'+(+at-start)]=v;}if(!p.velocities)delete bar.velocities;baseNotation(bar);const row=document.createElement('section');row.className='sheet-row';row.dataset.bar=start/barSteps;const label=document.createElement('p');label.textContent='Bar '+(start/barSteps+1);const svg=$('#notation svg').cloneNode(true);svg.querySelector('#playhead')?.remove();row.append(label,svg);pages.append(row);}
   if (pages.children.length > 1) {
     const preview = pages.firstElementChild.cloneNode(true);
     preview.className = 'sheet-row loop-preview';
     preview.removeAttribute('data-bar');
     preview.querySelector('p').textContent = 'Berikutnya · kembali ke bar 1';
     preview.hidden = true;
     pages.append(preview);
   }
   baseNotation(p);
 }
 const sheet = $('#collectionSheet');
 let activeRow = null;

 // On desktop the notes column scrolls independently of the video.
 // On a phone the reader contains both columns and owns the scrollbar.
 function scoreScrollPanel() {
   const column = sheet.closest('.youtube-notes-column');
   return column.clientHeight && ['auto', 'scroll'].includes(getComputedStyle(column).overflowY)
     && reader.classList.contains('with-video') ? column : reader;
 }

 function followRow(row, index, pattern, barSteps) {
   const panel = scoreScrollPanel();
   const lastBar = Math.ceil(pattern.steps / barSteps) - 1;
   const barNumber = Math.floor(index / barSteps);
   const multiBar = lastBar > 0;
   if (activeRow !== row) {
     activeRow?.classList.remove('playing');
     row.classList.add('playing');
     activeRow = row;
   }
   if (multiBar) {
     // Extra room at both ends lets the first and last bars reach the center.
     const margin = Math.ceil(panel.clientHeight / 2) + 'px';
     if (sheet.style.getPropertyValue('--follow-space') !== margin) {
       sheet.style.setProperty('--follow-space', margin);
     }
     const preview = sheet.querySelector('.loop-preview');
     if (preview) preview.hidden = barNumber !== lastBar;
     const bounds = row.getBoundingClientRect();
     const middle = panel.getBoundingClientRect().top + panel.clientTop + panel.clientHeight / 2;
     const offset = bounds.top + bounds.height / 2 - middle;
     if (Math.abs(offset) > 1) panel.scrollTop += offset;
   }

   const svg = row.querySelector('svg');
   let cursor = svg.querySelector('.sheet-cursor');
   if (!cursor) {
     cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
     cursor.setAttribute('class', 'sheet-cursor');
     cursor.setAttribute('y1', '32');
     cursor.setAttribute('y2', '118');
     svg.append(cursor);
   }
   const rowSteps = Math.min(barSteps, pattern.steps - barNumber * barSteps);
   const x = scorePosition({steps:rowSteps}, index % barSteps);
   cursor.setAttribute('x1', x);
   cursor.setAttribute('x2', x);
   if (row.scrollWidth > row.clientWidth) {
     const viewport = row.getBoundingClientRect();
     const offset = cursor.getBoundingClientRect().left - viewport.left - viewport.width / 2;
     if (Math.abs(offset) > 1) row.scrollLeft += offset;
   }
 }

 const baseUpdate = updateScore;
 updateScore = function(index, bar) {
   baseUpdate(index, bar);
   if (index < 0 || sheet.hidden || !document.body.classList.contains('collection-reading')) return;
   const p = patterns[selected];
   const barSteps = p.barSteps || (p.meter === '6/8' ? 6 : p.perBeat * Number(p.meter.split('/')[0]));
   const row = sheet.children[Math.floor(index / barSteps)];
   if (row) followRow(row, index, p, barSteps);
 };
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
