// VICE TIDE Cover Studio — cover renderer.
// Draws the GTA-style multi-panel cover on a canvas 2d context.
// No network: every asset is a file under app/ (photos, title.png, script.png, fonts).
// Classic script (not a module) so it also runs from file:// shot pages.
(function () {
  'use strict';

  var PANEL_DEFS = [
    { id: 'hero',     photo: 'photos/hero.jpg',     tag: 'THE RINGLEADER', chip: 'TIDEWATER MARINA · 5:58 PM' },
    { id: 'wheelman', photo: 'photos/wheelman.jpg', tag: 'THE WHEELMAN',   chip: 'PALM BOULEVARD · 6:12 PM' },
    { id: 'boat',     photo: 'photos/boat.jpg',     tag: '',               chip: 'HARBOUR LIGHTS · 6:47 PM' },
    { id: 'lookout',  photo: 'photos/lookout.jpg',  tag: 'THE LOOKOUT',    chip: 'ROOFTOP 9 · 7:02 PM' },
    { id: 'insider',  photo: 'photos/insider.jpg',  tag: 'THE INSIDER',    chip: 'MARINA DEL SOL · 7:20 PM' },
    { id: 'pilot',    photo: 'photos/pilot.jpg',    tag: 'THE PILOT',      chip: 'HELIPAD 4 · 7:31 PM' },
    { id: 'nightcar', photo: 'photos/nightcar.jpg', tag: '',               chip: 'MIDNIGHT RUN · 2:14 AM' }
  ];

  function defaultState() {
    return {
      title: 'VICE TIDE',
      script: 'the tide takes all',
      quote: 'A SUNSET YOU CAN STEAL',
      quoteSource: 'THE LEONIDA LEDGER',
      strip: 'FIVE CREW · ONE TIDE · COMING SOON',
      layout: 'rush',
      grade: 'day',
      wanted: true,
      panels: PANEL_DEFS.map(function (p) {
        // Default crops: the row-2 portraits are shifted down so their faces
        // sit below the title band instead of behind it.
        var crop = { zoom: 1, dx: 0, dy: 0 };
        if (p.id === 'hero') crop = { zoom: 1, dx: 0, dy: -25 };
        if (p.id === 'pilot') crop = { zoom: 1, dx: 0, dy: 50 };
        if (p.id === 'insider') crop = { zoom: 1, dx: 0, dy: 40 };
        return { id: p.id, photo: p.photo, tag: p.tag, chip: p.chip, zoom: crop.zoom, dx: crop.dx, dy: crop.dy };
      })
    };
  }

  // Panel geometry for one aspect. Returns { panels: [{id, poly}], title, script, quote, strip, star, wanted }.
  // poly is [x1,y1, x2,y1, x2,y2, x1,y2] with a diagonal slant applied per row.
  function layoutGeometry(kind, W, H) {
    var g = { panels: [], title: null, script: null, quote: { x: 0, y: 0, h: 0 }, strip: { x: 0, y: 0, h: 0 }, star: null, wanted: null };
    var rows, i, r, p;
    if (kind === 'rush') {
      // Landscape 1280x720. Quote bar top, bottom strip bottom, two panel rows.
      g.quote = { x: 0, y: 0, h: 36 };
      g.strip = { x: 0, y: H - 56, h: 56 };
      rows = [
        { y1: 36, y2: 330, sTop: 0, sBot: -28, cells: [['hero', 0, 640], ['wheelman', 640, 950], ['boat', 950, 1280]] },
        { y1: 330, y2: H - 56, sTop: -28, sBot: -56, cells: [['lookout', 0, 320], ['insider', 320, 640], ['pilot', 640, 960], ['nightcar', 960, 1280]] }
      ];
      g.title = { cx: W / 2, y: 250, w: 980 };
      g.script = { cx: W / 2, y: 468, w: 580 };
      g.star = { cx: W - 92, cy: H - 132, r: 62 };
      g.wanted = { x: W - 168, y: 48 };
    } else if (kind === 'stack') {
      g.quote = { x: 0, y: 0, h: 36 };
      g.strip = { x: 0, y: H - 56, h: 56 };
      rows = [
        { y1: 36, y2: 330, sTop: 0, sBot: -20, cells: [['hero', 0, 1280]] },
        { y1: 330, y2: 500, sTop: -20, sBot: -40, cells: [['boat', 0, 640], ['nightcar', 640, 1280]] },
        { y1: 500, y2: H - 56, sTop: -40, sBot: -60, cells: [['wheelman', 0, 320], ['lookout', 320, 640], ['insider', 640, 960], ['pilot', 960, 1280]] }
      ];
      g.title = { cx: W / 2, y: 240, w: 980 };
      g.script = { cx: W / 2, y: 458, w: 580 };
      g.star = { cx: W - 92, cy: H - 132, r: 62 };
      g.wanted = { x: W - 168, y: 48 };
    } else if (kind === 'boardwalk') {
      g.quote = { x: 0, y: 0, h: 36 };
      g.strip = { x: 0, y: H - 56, h: 56 };
      rows = [
        { y1: 36, y2: H - 56, sTop: 0, sBot: -28, cells: [['hero', 0, 460], ['wheelman', 460, 760], ['insider', 760, 1040], ['boat', 1040, 1280]] },
        { y1: 36, y2: H - 56, sTop: 0, sBot: -28, cells: [] }
      ];
      // Boardwalk is vertical strips: hero tall left, then 3 columns split in two.
      rows = [
        { y1: 36, y2: H - 56, sTop: 0, sBot: -28, cells: [['hero', 0, 460]] },
        { y1: 36, y2: 350, sTop: 0, sBot: -14, cells: [['wheelman', 460, 760], ['insider', 760, 1040], ['boat', 1040, 1280]] },
        { y1: 350, y2: H - 56, sTop: -14, sBot: -28, cells: [['lookout', 460, 760], ['pilot', 760, 1040], ['nightcar', 1040, 1280]] }
      ];
      g.title = { cx: W / 2, y: 240, w: 980 };
      g.script = { cx: W / 2, y: 458, w: 580 };
      g.star = { cx: W - 92, cy: H - 132, r: 62 };
      g.wanted = { x: W - 168, y: 48 };
    } else if (kind === 'square') {
      // 1080x1080 export: hero top, title middle, two rows of three panels.
      g.quote = { x: 0, y: 0, h: 40 };
      g.strip = { x: 0, y: H - 64, h: 64 };
      rows = [
        { y1: 40, y2: 520, sTop: 0, sBot: -24, cells: [['hero', 0, 1080]] },
        { y1: 520, y2: 780, sTop: -24, sBot: -48, cells: [['wheelman', 0, 360], ['boat', 360, 720], ['lookout', 720, 1080]] },
        { y1: 780, y2: H - 64, sTop: -48, sBot: -72, cells: [['insider', 0, 360], ['pilot', 360, 720], ['nightcar', 720, 1080]] }
      ];
      g.title = { cx: W / 2, y: 430, w: 940 };
      g.script = { cx: W / 2, y: 620, w: 540 };
      g.star = { cx: W - 96, cy: H - 150, r: 66 };
      g.wanted = { x: W - 176, y: 52 };
    } else { // portrait 1024x1280
      g.quote = { x: 0, y: 0, h: 44 };
      g.strip = { x: 0, y: H - 72, h: 72 };
      rows = [
        { y1: 44, y2: 560, sTop: 0, sBot: -24, cells: [['hero', 0, 1024]] },
        { y1: 560, y2: 840, sTop: -24, sBot: -48, cells: [['wheelman', 0, 512], ['boat', 512, 1024]] },
        { y1: 840, y2: 1080, sTop: -48, sBot: -68, cells: [['lookout', 0, 512], ['insider', 512, 1024]] },
        { y1: 1080, y2: H - 72, sTop: -68, sBot: -88, cells: [['pilot', 0, 512], ['nightcar', 512, 1024]] }
      ];
      g.title = { cx: W / 2, y: 460, w: 900 };
      g.script = { cx: W / 2, y: 660, w: 520 };
      g.star = { cx: W - 100, cy: H - 160, r: 68 };
      g.wanted = { x: W - 180, y: 56 };
    }
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      for (var j = 0; j < r.cells.length; j++) {
        var c = r.cells[j];
        g.panels.push({
          id: c[0],
          poly: [c[1] + r.sTop, r.y1, c[2] + r.sTop, r.y1, c[2] + r.sBot, r.y2, c[1] + r.sBot, r.y2]
        });
      }
    }
    return g;
  }

  var imageCache = {};
  function loadImage(src) {
    if (imageCache[src]) return imageCache[src];
    var p = new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { reject(new Error('cannot load ' + src)); };
      im.src = src;
    });
    imageCache[src] = p;
    return p;
  }

  function drawPanelPhoto(ctx, img, poly, panel) {
    // Bounding box of the polygon.
    var xs = [poly[0], poly[2], poly[4], poly[6]], ys = [poly[1], poly[3], poly[5], poly[7]];
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var bw = x1 - x0, bh = y1 - y0;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0], poly[1]); ctx.lineTo(poly[2], poly[3]);
    ctx.lineTo(poly[4], poly[5]); ctx.lineTo(poly[6], poly[7]);
    ctx.closePath();
    ctx.clip();
    // Cover-fit with zoom + shift (dx, dy in pixels of the panel box).
    // Every panel photo gets the app's sunset grade: a saturation + contrast
    // lift, so the cover reads as a punchy poster instead of a flat photo.
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(bw / iw, bh / ih) * (panel.zoom || 1);
    var dw = iw * scale, dh = ih * scale;
    var dx = x0 + (bw - dw) / 2 + (panel.dx || 0);
    var dy = y0 + (bh - dh) / 2 + (panel.dy || 0);
    ctx.filter = 'saturate(1.6) contrast(1.06) brightness(1.00)';
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    ctx.restore();
    // Panel frame: thin dark seam + hairline.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0], poly[1]); ctx.lineTo(poly[2], poly[3]);
    ctx.lineTo(poly[4], poly[5]); ctx.lineTo(poly[6], poly[7]);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(12,4,24,0.95)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    return { x0: x0, y0: y0, bw: bw, bh: bh };
  }

  function chip(ctx, text, x, y, font, fg, bg, maxX) {
    ctx.save();
    ctx.font = font;
    var w = ctx.measureText(text).width + 18;
    var h = 26;
    // Keep the chip fully on the canvas: the diagonal panel edges can push a
    // chip's anchor off-canvas, which used to clip the tag text.
    if (x < 2) x = 2;
    if (maxX !== undefined && x + w > maxX) x = Math.max(2, maxX - w);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 9, y + h / 2 + 1);
    ctx.restore();
    return w;
  }

  function drawStarburst(ctx, cx, cy, r, lines) {
    ctx.save();
    ctx.beginPath();
    var spikes = 16;
    for (var i = 0; i < spikes * 2; i++) {
      var rr = (i % 2 === 0) ? r : r * 0.78;
      var a = (Math.PI * i) / spikes - Math.PI / 2;
      var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#f5b81e';
    ctx.fill();
    ctx.strokeStyle = '#7a4a00';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2a0a3a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 15px Oswald, sans-serif';
    ctx.fillText(lines[0], cx, cy - 16);
    ctx.font = '700 13px Oswald, sans-serif';
    ctx.fillText(lines[1], cx, cy + 2);
    ctx.font = '700 12px Oswald, sans-serif';
    ctx.fillText(lines[2], cx, cy + 19);
    ctx.restore();
  }

  function drawBarcode(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#111111';
    var bx = x + 6, seed = 7;
    while (bx < x + w - 8) {
      seed = (seed * 37 + 11) % 97;
      var bw = 1 + (seed % 4);
      if (seed % 3 !== 0) ctx.fillRect(bx, y + 5, bw, h - 10);
      bx += bw + 2;
    }
    ctx.restore();
  }

  function titleImageFor(state) {
    // Default title uses the PIL-rendered gradient PNG; an edited title is drawn live.
    return state.title === 'VICE TIDE' ? 'title.png' : null;
  }

  function scriptImageFor(state) {
    return state.script === 'the tide takes all' ? 'script.png' : null;
  }

  async function drawCover(canvas, state, kind, basePath) {
    basePath = basePath || '';
    var W = canvas.width, H = canvas.height;
    var ctx = canvas.getContext('2d');
    var g = layoutGeometry(kind, W, H);
    var scale = W / 1280; // geometry is authored at 1280 wide for landscape; square/portrait use their own W
    if (kind === 'square') scale = W / 1080;
    if (kind === 'portrait') scale = W / 1024;

    // Background.
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#160a2e');
    bg.addColorStop(0.55, '#2b0f3d');
    bg.addColorStop(1, '#12081f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Panels. Tags and location chips are collected here and drawn AFTER the
    // title, so the title never buries a cast member's label.
    var byId = {};
    state.panels.forEach(function (p) { byId[p.id] = p; });
    var labels = [];
    for (var i = 0; i < g.panels.length; i++) {
      var gp = g.panels[i];
      var panel = byId[gp.id];
      if (!panel) continue;
      var img;
      try { img = await loadImage(basePath + panel.photo); } catch (e) { continue; }
      var box = drawPanelPhoto(ctx, img, gp.poly, panel);
      var fs = Math.max(13, Math.round(17 * scale));
      var cfs = Math.max(11, Math.round(14 * scale));
      if (panel.tag) {
        labels.push({ text: panel.tag, x: box.x0 + 8, y: box.y0 + 8, font: '700 ' + fs + 'px Oswald, sans-serif', fg: '#ffffff', bg: 'rgba(0,0,0,0.72)' });
      }
      labels.push({ text: panel.chip, x: box.x0 + 8, y: box.y0 + box.bh - 34, font: '600 ' + cfs + 'px Oswald, sans-serif', fg: '#ffd76a', bg: 'rgba(0,0,0,0.72)' });
    }

    // Tide band: a diagonal wet-reflection sheen across the whole cover.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.42);
    var band = ctx.createLinearGradient(0, -70, 0, 70);
    band.addColorStop(0, 'rgba(255,120,60,0)');
    band.addColorStop(0.5, 'rgba(255,150,80,0.26)');
    band.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.fillStyle = band;
    ctx.fillRect(-W, -70, W * 2, 140);
    ctx.fillStyle = 'rgba(255,220,160,0.28)';
    ctx.fillRect(-W, -4, W * 2, 3);
    ctx.restore();

    // Quote bar.
    ctx.save();
    ctx.fillStyle = 'rgba(14,5,26,0.94)';
    ctx.fillRect(0, g.quote.y, W, g.quote.h);
    ctx.fillStyle = '#ffd76a';
    ctx.font = '700 ' + Math.max(13, Math.round(19 * scale)) + 'px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var q = '★★★★★  "' + state.quote + '" — ' + state.quoteSource;
    ctx.fillText(q, W / 2, g.quote.y + g.quote.h / 2 + 1);
    ctx.restore();

    // Title + script (PNG when default, live text when edited).
    var tImg = titleImageFor(state);
    var tw = g.title.w, th = tw * 427 / 1720;
    if (tImg) {
      try {
        var ti = await loadImage(basePath + tImg);
        ctx.drawImage(ti, g.title.cx - tw / 2, g.title.y, tw, th);
      } catch (e) { /* fall through to text */ tImg = null; }
    }
    if (!tImg) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var tf = '700 ' + Math.round(th * 0.95) + 'px Oswald, sans-serif';
      ctx.font = tf;
      var tg = ctx.createLinearGradient(0, g.title.y, 0, g.title.y + th);
      tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.45, '#ffd678'); tg.addColorStop(1, '#ff5a00');
      ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.fillStyle = tg;
      ctx.fillText(state.title, g.title.cx, g.title.y + th / 2);
      ctx.restore();
    }
    var sImg = scriptImageFor(state);
    var sw = g.script.w, sh = sw * 211 / 1129;
    if (sImg) {
      try {
        var si = await loadImage(basePath + sImg);
        ctx.drawImage(si, g.script.cx - sw / 2, g.script.y, sw, sh);
      } catch (e) { sImg = null; }
    }
    if (!sImg) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = Math.round(sh * 0.9) + 'px Pacifico, cursive';
      ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff8fb2';
      ctx.fillText(state.script, g.script.cx, g.script.y + sh / 2);
      ctx.restore();
    }

    // Cast labels on top of the title, clamped to the canvas.
    for (var li = 0; li < labels.length; li++) {
      var lb = labels[li];
      chip(ctx, lb.text, lb.x, lb.y, lb.font, lb.fg, lb.bg, W - 4);
    }

    // WANTED chip.
    if (state.wanted) {
      chip(ctx, 'WANTED ★★★★★', g.wanted.x, g.wanted.y, '700 ' + Math.max(13, Math.round(17 * scale)) + 'px Oswald, sans-serif', '#ffffff', '#b3001b', W - 4);
    }

    // Starburst seal.
    drawStarburst(ctx, g.star.cx, g.star.cy, g.star.r * scale, ['VOL. 06', 'FRESH INK', 'EST. 2026']);

    // Bottom strip.
    ctx.save();
    ctx.fillStyle = 'rgba(14,5,26,0.94)';
    ctx.fillRect(0, g.strip.y, W, g.strip.h);
    ctx.fillStyle = '#f5b81e';
    ctx.fillRect(0, g.strip.y, W, 3);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 ' + Math.max(15, Math.round(24 * scale)) + 'px Oswald, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.strip, 24, g.strip.y + g.strip.h / 2 + 1);
    drawBarcode(ctx, W - 150, g.strip.y + 10, 126, g.strip.h - 20);
    ctx.restore();

    // Grade overlay.
    ctx.save();
    if (state.grade === 'night') {
      ctx.fillStyle = 'rgba(8,8,52,0.20)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,46,136,0.05)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = 'rgba(255,140,40,0.10)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    return canvas;
  }

  function exportSize(kind) {
    if (kind === 'square') return { w: 1080, h: 1080 };
    if (kind === 'portrait') return { w: 1024, h: 1280 };
    return { w: 1280, h: 720 };
  }

  window.ViceTide = {
    defaultState: defaultState,
    drawCover: drawCover,
    exportSize: exportSize,
    panelDefs: PANEL_DEFS
  };
})();
