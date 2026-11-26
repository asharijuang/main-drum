/* Reuse one editor in the video workspace; moving it preserves notes and handlers. */
'use strict';
(() => {
  const editor = document.querySelector('#tool-editor');
  const home = document.createComment('Editor home outside YouTube workspace');
  editor.before(home);
  let active = false;
  let previousPlayerSize = 'half';
  const originalShowTool = showTool;

  function leaveYouTube() {
    if (!active) return;
    active = false;
    home.after(editor);
    editor.setAttribute('role', 'tabpanel');
    editor.setAttribute('aria-labelledby', 'tab-editor');
    editor.removeAttribute('aria-label');
    editor.hidden = false;
    document.querySelector('#tool-youtube').hidden = true;
    document.querySelector('#tab-youtube').setAttribute('aria-selected', 'false');
    document.querySelector('#tab-youtube').tabIndex = -1;
    document.querySelector('#tab-editor').setAttribute('aria-selected', 'true');
    document.querySelector('#tab-editor').tabIndex = 0;
    document.body.classList.remove('youtube-study');
    if (document.querySelector('#playerDock').dataset.size === 'mini') setPlayerSize(previousPlayerSize);
  }

  showTool = function (key, scroll = false) {
    if (key !== 'youtube') leaveYouTube();
    originalShowTool(key, scroll);
    if (key !== 'youtube') return;
    if (!active) {
      previousPlayerSize = document.querySelector('#playerDock').dataset.size;
      setPlayerSize('mini');
      active = true;
      document.querySelector('#youtubeEditorHost').append(editor);
      editor.setAttribute('role', 'group');
      editor.removeAttribute('aria-labelledby');
      editor.setAttribute('aria-label', 'Editor notasi video');
      document.body.classList.add('youtube-study');
    }
    // The original tab switch hides the ordinary Editor tab; it remains visible here.
    editor.hidden = false;
    document.querySelector('#workspace').scrollIntoView({ block: 'start' });
  };

  document.querySelector('#focusMode').addEventListener('click', leaveYouTube);
  document.querySelector('#practiceLink').addEventListener('click', leaveYouTube);
  document.querySelectorAll('.toc a').forEach(link => link.addEventListener('click', leaveYouTube));

  const host = document.querySelector('#youtubeFrame');
  const placeholder = document.querySelector('#youtubeEmpty');
  new MutationObserver(() => { placeholder.hidden = !host.hidden; }).observe(host, { attributes: true, attributeFilter: ['hidden'] });
})();
