// VICE TIDE Cover Studio — editor wiring.
// Live preview, layout / grade / WANTED controls, editable captions,
// per-panel upload + crop (zoom / shift), PNG export in three sizes.
(function () {
  'use strict';

  var state = window.ViceTide.defaultState();
  var preview = document.getElementById('preview');
  var statusEl = document.getElementById('status');
  var drawing = false;
  var queued = false;

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function drawPreview() {
    if (drawing) { queued = true; return; }
    drawing = true;
    var kind = state.layout;
    preview.width = 1280;
    preview.height = 720;
    window.ViceTide.drawCover(preview, state, kind, '').then(function () {
      drawing = false;
      setStatus('Preview: ' + layoutName(kind) + ' · ' + (state.grade === 'day' ? 'DAY' : 'NIGHT') + ' grade · ' + (state.wanted ? 'WANTED on' : 'WANTED off'));
      if (queued) { queued = false; drawPreview(); }
    }).catch(function (err) {
      drawing = false;
      setStatus('Preview error: ' + err.message);
    });
  }

  function layoutName(kind) {
    return { rush: 'Diagonal Rush', stack: 'Sunset Stack', boardwalk: 'Boardwalk' }[kind] || kind;
  }

  function bindText(id, key) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () { state[key] = el.value; drawPreview(); });
  }

  function buildPanelControls() {
    var list = document.getElementById('panels');
    if (!list) return;
    state.panels.forEach(function (panel, idx) {
      var row = document.createElement('div');
      row.className = 'panel-row';
      var label = document.createElement('div');
      label.className = 'panel-label';
      label.textContent = panel.tag || panel.id.toUpperCase();
      row.appendChild(label);

      var file = document.createElement('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.title = 'Upload a photo for this panel';
      file.addEventListener('change', function () {
        var f = file.files && file.files[0];
        if (!f) return;
        var url = URL.createObjectURL(f);
        panel.photo = url;
        drawPreview();
      });
      row.appendChild(file);

      function slider(text, min, max, step, get, set) {
        var wrap = document.createElement('label');
        wrap.className = 'slider';
        wrap.textContent = text + ' ';
        var s = document.createElement('input');
        s.type = 'range'; s.min = min; s.max = max; s.step = step; s.value = get();
        s.addEventListener('input', function () { set(parseFloat(s.value)); drawPreview(); });
        wrap.appendChild(s);
        row.appendChild(wrap);
      }
      slider('Zoom', 1, 2.2, 0.05, function () { return panel.zoom; }, function (v) { panel.zoom = v; });
      slider('Shift X', -120, 120, 2, function () { return panel.dx; }, function (v) { panel.dx = v; });
      slider('Shift Y', -120, 120, 2, function () { return panel.dy; }, function (v) { panel.dy = v; });

      var reset = document.createElement('button');
      reset.type = 'button';
      reset.textContent = 'Reset';
      reset.addEventListener('click', function () {
        panel.zoom = 1; panel.dx = 0; panel.dy = 0;
        buildPanelControls();
        drawPreview();
      });
      row.appendChild(reset);
      list.appendChild(row);
    });
  }

  function bindLayoutButtons() {
    document.querySelectorAll('[data-layout]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.layout = btn.getAttribute('data-layout');
        document.querySelectorAll('[data-layout]').forEach(function (b) { b.classList.toggle('active', b === btn); });
        drawPreview();
      });
    });
    var grade = document.getElementById('grade');
    if (grade) grade.addEventListener('click', function () {
      state.grade = state.grade === 'day' ? 'night' : 'day';
      grade.textContent = state.grade === 'day' ? 'Grade: DAY' : 'Grade: NIGHT';
      drawPreview();
    });
    var wanted = document.getElementById('wanted');
    if (wanted) wanted.addEventListener('click', function () {
      state.wanted = !state.wanted;
      wanted.textContent = state.wanted ? 'WANTED: ON' : 'WANTED: OFF';
      drawPreview();
    });
  }

  function download(canvas, name) {
    canvas.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus('Exported ' + name);
    }, 'image/png');
  }

  function bindExport() {
    document.querySelectorAll('[data-export]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-export');
        var size = window.ViceTide.exportSize(kind);
        var c = document.createElement('canvas');
        c.width = size.w; c.height = size.h;
        var layoutKind = kind === 'landscape' ? state.layout : kind;
        window.ViceTide.drawCover(c, state, layoutKind, '').then(function () {
          download(c, 'vice-tide-' + kind + '.png');
        }).catch(function (err) { setStatus('Export error: ' + err.message); });
      });
    });
  }

  function init() {
    bindText('title', 'title');
    bindText('script', 'script');
    bindText('quote', 'quote');
    bindText('strip', 'strip');
    buildPanelControls();
    bindLayoutButtons();
    bindExport();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(drawPreview);
    }
    drawPreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
