(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Header: estado ao rolar (1 leitura por frame) ---------- */
  const header = $('#siteHeader');
  let scrollQueued = false;
  const updateHeader = () => {
    header.classList.toggle('scrolled', scrollY > 30);
    scrollQueued = false;
  };
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateHeader); }
  }, { passive: true });
  updateHeader();

  /* ---------- Menu mobile (classe .open; estilos ficam no CSS) ---------- */
  const toggle = $('.nav-toggle');
  const links = $('#navLinks');
  if (toggle && links) {
    const setMenu = (open) => {
      links.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };
    toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 981px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- Links de e-mail ----------
     "mailto:" só funciona quando há um app de e-mail configurado no aparelho
     (no Mac/iPhone sempre há o Mail; no Windows/Linux quase nunca).
     Então: copia o endereço, avisa, e no computador sem app abre o Gmail na web. */
  const toast = $('#toast');
  let toastTimer = 0;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback para navegadores sem Clipboard API (ou http)
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignora */ }
      ta.remove();
      return ok;
    }
  };

  const ua = navigator.userAgent;
  const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || ua) || /iPhone|iPad|iPod|Macintosh/.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  // delegado: funciona também nas cópias criadas pelo carrossel infinito
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-email]');
    if (!link || e.defaultPrevented) return;
    const email = link.dataset.email;
    copyText(email).then((ok) => {
      showToast(ok ? `E-mail copiado: ${email}` : email);
    });

    // Apple e celulares têm app de e-mail: deixa o mailto seguir normalmente
    if (isApple || isMobile) return;

    e.preventDefault();
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    window.open(gmail, '_blank', 'noopener');
  });

  /* ---------- Entrada do hero ---------- */
  setTimeout(() => {
    $('#heroTitle')?.classList.add('play');
    $('#heroFoot')?.classList.add('in');
  }, 120);

  /* ---------- Parallax do logo (só desktop, 1 escrita por frame) ---------- */
  const render = $('#heroRender');
  if (render && finePointer && !reduceMotion) {
    let tx = 0, ty = 0, queued = false;
    addEventListener('mousemove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 18;
      ty = (e.clientY / innerHeight - 0.5) * 18;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        render.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        queued = false;
      });
    }, { passive: true });
  }

  /* ---------- Reveal ao rolar ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Painel do robô: scanner com rastro orgânico ----------
     As máscaras são desenhadas em baixa resolução (MASK_SCALE) e esticadas
     pelo CSS: as bordas já são suaves, então o resultado é igual e o
     toDataURL() de cada frame fica ~8x mais barato. */
  (function robotScanner() {
    const panel = $('#robotVisual');
    const front = $('#robotFront');
    const reveal = $('#robotBlueprint');
    if (!panel || !front || !reveal || reduceMotion || !finePointer) return;

    const MAX_POINTS = 70, HEAD_R = 0.22, NOISE_AMP = 0.32, BLOB_PTS = 24,
          FADE = 0.93, SAMPLE = 9, MASK_SCALE = 0.35;
    const TAU = Math.PI * 2;

    const fCanvas = document.createElement('canvas');
    const rCanvas = document.createElement('canvas');
    const fCtx = fCanvas.getContext('2d');
    const rCtx = rCanvas.getContext('2d');

    let w = 0, h = 0, baseR = 140, headR = 0, time = 0;
    let trail = [], last = null, hovering = false, running = false;
    let clientX = 0, clientY = 0;

    const setMask = (el, url) => { el.style.webkitMaskImage = url; el.style.maskImage = url; };

    function resize() {
      w = panel.clientWidth; h = panel.clientHeight;
      baseR = Math.min(w, h) * HEAD_R;
      for (const c of [fCanvas, rCanvas]) {
        c.width = Math.max(1, Math.round(w * MASK_SCALE));
        c.height = Math.max(1, Math.round(h * MASK_SCALE));
      }
      fCtx.setTransform(MASK_SCALE, 0, 0, MASK_SCALE, 0, 0);
      rCtx.setTransform(MASK_SCALE, 0, 0, MASK_SCALE, 0, 0);
      trail = []; last = null;
      startLoop();
    }

    function drawBlob(ctx, cx, cy, r, t, seed) {
      if (r < 2) return;
      const amp = r * NOISE_AMP;
      ctx.beginPath();
      let px0 = 0, py0 = 0, pxPrev = 0, pyPrev = 0, m0x = 0, m0y = 0;
      for (let i = 0; i <= BLOB_PTS; i++) {
        const a = ((i % BLOB_PTS) / BLOB_PTS) * TAU;
        const noise = (Math.sin(a * 3 + t * 1.4 + seed) * 0.45 +
                       Math.sin(a * 5 - t * 0.9 + seed * 2.3) * 0.3 +
                       Math.cos(a * 2 + t * 1.8 + seed * 0.7) * 0.25) * amp;
        const px = cx + Math.cos(a) * (r + noise);
        const py = cy + Math.sin(a) * (r + noise);
        if (i === 0) { px0 = px; py0 = py; }
        else {
          const mx = (pxPrev + px) / 2, my = (pyPrev + py) / 2;
          if (i === 1) { ctx.moveTo(mx, my); m0x = mx; m0y = my; }
          else ctx.quadraticCurveTo(pxPrev, pyPrev, mx, my);
        }
        pxPrev = px; pyPrev = py;
      }
      // fecha a curva contornando o primeiro ponto
      ctx.quadraticCurveTo(px0, py0, m0x, m0y);
      ctx.closePath();
      ctx.fill();
    }

    function tick() {
      headR += ((hovering ? baseR : 0) - headR) * (hovering ? 0.14 : 0.05);

      if (hovering && headR > 5) {
        const rect = panel.getBoundingClientRect();
        const x = clientX - rect.left, y = clientY - rect.top;
        if (!last || Math.hypot(x - last.x, y - last.y) > SAMPLE) {
          trail.push({ x, y, r: headR, alpha: 1, seed: Math.random() * 100 });
          last = { x, y };
          if (trail.length > MAX_POINTS) trail.shift();
        }
      }

      for (const p of trail) { p.alpha *= FADE; p.r *= 0.996; }
      trail = trail.filter((p) => p.alpha > 0.01);
      time += 0.016;

      // máscara da camada da frente: tudo branco menos os blobs
      fCtx.globalCompositeOperation = 'source-over';
      fCtx.globalAlpha = 1;
      fCtx.fillStyle = '#fff';
      fCtx.fillRect(0, 0, w, h);
      fCtx.globalCompositeOperation = 'destination-out';

      // máscara do blueprint: só os blobs
      rCtx.clearRect(0, 0, w, h);
      rCtx.fillStyle = '#fff';

      for (const p of trail) {
        fCtx.globalAlpha = rCtx.globalAlpha = p.alpha;
        drawBlob(fCtx, p.x, p.y, p.r, time, p.seed);
        drawBlob(rCtx, p.x, p.y, p.r, time, p.seed);
      }
      rCtx.globalAlpha = 1;

      setMask(front, `url(${fCanvas.toDataURL()})`);
      setMask(reveal, `url(${rCanvas.toDataURL()})`);

      if (hovering || trail.length || headR > 0.5) requestAnimationFrame(tick);
      else running = false;
    }

    function startLoop() {
      if (!running) { running = true; requestAnimationFrame(tick); }
    }

    new ResizeObserver(resize).observe(panel);
    panel.addEventListener('mouseenter', (e) => {
      clientX = e.clientX; clientY = e.clientY;
      hovering = true; panel.classList.add('active'); startLoop();
    });
    panel.addEventListener('mousemove', (e) => { clientX = e.clientX; clientY = e.clientY; }, { passive: true });
    panel.addEventListener('mouseleave', () => {
      hovering = false; panel.classList.remove('active'); startLoop();
    });
  })();

  /* ---------- Fundo do hero: "pixel liquid" ----------
     Otimizações em relação à versão anterior:
     - o canvas tem exatamente COLS×ROWS pixels e o CSS amplia
       (image-rendering: pixelated) → 1 putImageData por frame em vez de
       3.600 fillRect + 3.600 strings rgb();
     - cores vêm de uma tabela pré-calculada (LUT);
     - senos que dependem só da linha ou só da coluna são calculados
       uma vez por linha/coluna, não por célula;
     - a animação pausa quando o hero sai da tela ou a aba fica oculta. */
  (function heroPixelLiquid() {
    const canvas = $('#heroLiquidBg');
    if (!canvas) return;

    const COLS = 80, ROWS = 45, RIPPLE_LIFE = 4.5;
    // Mesmas cores da versão original. Obs.: o original usava '#bd9726ff' (8 dígitos),
    // que o parser antigo lia como rgb(151, 38, 255) — é essa a cor que aparecia na tela.
    const PALETTE = [[11, 7, 16], [21, 0, 41], [36, 0, 70], [90, 24, 154], [151, 38, 255]];

    canvas.width = COLS;
    canvas.height = ROWS;
    const ctx = canvas.getContext('2d', { alpha: false });
    const img = ctx.createImageData(COLS, ROWS);
    const px = img.data;
    for (let i = 3; i < px.length; i += 4) px[i] = 255;

    // LUT com 4096 tons interpolados na paleta (mesma fórmula do colorFor original)
    const STEPS = 4095;
    const LUT = new Uint8ClampedArray((STEPS + 1) * 3);
    for (let i = 0; i <= STEPS; i++) {
      const s = (i / STEPS) * (PALETTE.length - 1);
      const k = Math.min(Math.floor(s), PALETTE.length - 1);
      const f = s - k, a = PALETTE[k], b = PALETTE[Math.min(k + 1, PALETTE.length - 1)];
      for (let c = 0; c < 3; c++) LUT[i * 3 + c] = Math.round(a[c] + (b[c] - a[c]) * f);
    }

    const NX = Float32Array.from({ length: COLS }, (_, x) => x / COLS);
    const NY = Float32Array.from({ length: ROWS }, (_, y) => y / ROWS);
    const warpY = new Float32Array(COLS), maskX = new Float32Array(COLS);
    const warpX = new Float32Array(ROWS), maskY = new Float32Array(ROWS);
    const smoothed = new Float32Array(COLS * ROWS);

    let time = 0, lastRipple = -1, running = false, visible = true;
    const ripples = [];

    function draw() {
      time += 0.015;
      while (ripples.length && time - ripples[0].born >= RIPPLE_LIFE) ripples.shift();

      for (let x = 0; x < COLS; x++) {
        const nx = NX[x];
        warpY[x] = Math.cos(nx * 4 - time * 0.25) * 0.25 + Math.cos(nx * 9 + time * 0.15) * 0.12;
        maskX[x] = Math.sin(nx * 4 + time * 0.05);
      }
      for (let y = 0; y < ROWS; y++) {
        const ny = NY[y];
        warpX[y] = Math.sin(ny * 4 + time * 0.3) * 0.25 + Math.sin(ny * 9 - time * 0.12) * 0.12;
        maskY[y] = Math.cos(ny * 4.2 - time * 0.04);
      }

      for (let y = 0, idx = 0; y < ROWS; y++) {
        const ny = NY[y], wx = warpX[y], my = maskY[y];
        for (let x = 0; x < COLS; x++, idx++) {
          const nx = NX[x];
          let v = Math.sin((nx + wx) * 10 + (ny + warpY[x]) * 4 + time * 0.4) * (0.55 + maskX[x] * my * 0.35);

          for (let r = 0; r < ripples.length; r++) {
            const rp = ripples[r], age = time - rp.born;
            const dx = nx - rp.x, dy = ny - rp.y;
            v += Math.sin(Math.sqrt(dx * dx + dy * dy) * 8 - age * 3) * (1 - age / RIPPLE_LIFE) * 0.2;
          }

          let value = (v + 0.9) / 1.8;
          value = value > 0 ? Math.pow(value, 2.6) : 0;
          const s = smoothed[idx] += (value - smoothed[idx]) * 0.15;

          const li = (s >= 1 ? STEPS : s <= 0 ? 0 : (s * STEPS + 0.5) | 0) * 3;
          const p = idx * 4;
          px[p] = LUT[li]; px[p + 1] = LUT[li + 1]; px[p + 2] = LUT[li + 2];
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function loop() {
      if (!running) return;
      draw();
      requestAnimationFrame(loop);
    }
    function setRunning(on) {
      if (reduceMotion) return;
      if (on && !running) { running = true; requestAnimationFrame(loop); }
      else if (!on) running = false;
    }

    if (reduceMotion) {
      // quadro estático: converge a suavização antes de desenhar
      for (let i = 0; i < 40; i++) draw();
      return;
    }

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      setRunning(visible && !document.hidden);
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));

    if (finePointer) {
      canvas.parentElement.addEventListener('mousemove', (e) => {
        if (time - lastRipple < 0.45) return;
        lastRipple = time;
        const rect = canvas.getBoundingClientRect();
        ripples.push({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, born: time });
        if (ripples.length > 14) ripples.shift();
      }, { passive: true });
    }

    setRunning(true);
  })();


  /* ---------- Carrossel de apoiadores (infinito) ----------
     As placas são duplicadas antes e depois da lista original; quando a
     rolagem para numa cópia, o script pula sem animação para a placa
     equivalente da lista original, então nunca chega ao fim.
     Mouse: arrasta com inércia. Celular: dedo. Teclado: ← →.
     Clicar numa placa lateral traz ela para o centro; na central, abre o link. */
  document.querySelectorAll('[data-rail]').forEach((rail) => {
    const track = rail.querySelector('.sponsor-track');
    if (!track || !track.children.length) return;
    const prev = rail.querySelector('[data-dir="-1"]');
    const next = rail.querySelector('[data-dir="1"]');
    const bar = rail.querySelector('.rail-progress span');
    const count = rail.querySelector('.rail-count');
    const pad2 = (n) => String(n).padStart(2, '0');

    // numera as originais e cria uma cópia antes e outra depois
    const originals = [...track.children];
    const n = originals.length;
    originals.forEach((it, i) => it.querySelector('.sponsor-name')?.setAttribute('data-n', pad2(i + 1)));
    const makeClones = () => originals.map((it) => {
      const c = it.cloneNode(true);
      c.classList.add('is-clone');
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
      if (c.matches('a')) c.setAttribute('tabindex', '-1');
      return c;
    });
    track.prepend(...makeClones());
    track.append(...makeClones());
    const items = [...track.children];          // 3 × n

    let step = 1, active = -1, frame = 0, settleTimer = 0, busy = false;

    const centerOf = (i) => items[i].offsetLeft + items[i].offsetWidth / 2 - track.clientWidth / 2;

    // pula sem animação (usado para "dar a volta")
    const jump = (left) => {
      track.classList.add('dragging');           // desliga snap e smooth por um instante
      track.scrollLeft = left;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!down) track.classList.remove('dragging');
      }));
    };

    function layout() {
      const per = parseFloat(getComputedStyle(rail).getPropertyValue('--per-view')) || 4;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      const w = track.clientWidth;
      const itemW = Math.max(120, (w - gap * (per - 1)) / per);
      rail.style.setProperty('--item-w', `${itemW}px`);
      step = itemW + gap;
      const real = active < 0 ? 0 : active % n;
      jump(centerOf(n + real));                  // mantém a placa atual no centro
      render();
    }

    function render() {
      frame = 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0, best = Infinity;
      items.forEach((it, i) => {
        const d = (it.offsetLeft + it.offsetWidth / 2 - center) / step;
        const a = Math.min(Math.abs(d), 2);
        it.style.setProperty('--sc', `${1 - a * 0.07}`);
        it.style.setProperty('--op', `${Math.max(0.4, 1 - a * 0.32)}`);
        it.style.setProperty('--gs', `${Math.min(1, a)}`);
        if (Math.abs(d) < best) { best = Math.abs(d); nearest = i; }
      });
      if (nearest !== active) {
        items[active]?.classList.remove('is-active');
        items[nearest].classList.add('is-active');
        active = nearest;
      }
      const real = active % n;
      if (bar) {
        bar.style.setProperty('--thumb', `${100 / n}%`);
        bar.style.setProperty('--thumb-x', `${real * 100}%`);
      }
      if (count) count.innerHTML = `<b>${pad2(real + 1)}</b> / ${pad2(n)}`;
    }

    // quando a rolagem para numa cópia, volta para a lista do meio
    function settle() {
      if (down) return;
      busy = false;
      if (active < n) jump(track.scrollLeft + n * step);
      else if (active >= 2 * n) jump(track.scrollLeft - n * step);
    }
    track.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(render);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 140);
    }, { passive: true });

    const goTo = (i) => {
      track.scrollTo({ left: centerOf(Math.max(0, Math.min(items.length - 1, i))), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    // evita clicar rápido demais e passar das cópias antes de "dar a volta"
    const nudge = (dir) => { if (busy) return; busy = true; goTo(active + dir); setTimeout(() => { busy = false; }, 500); };
    prev?.addEventListener('click', () => nudge(-1));
    next?.addEventListener('click', () => nudge(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
    });

    // arrastar com o mouse (toque usa a rolagem nativa)
    let down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, lastT = 0, vel = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false;
      startX = lastX = e.clientX; startScroll = track.scrollLeft;
      lastT = performance.now(); vel = 0;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('dragging'); }
      if (!moved) return;
      let left = startScroll - dx;
      // dá a volta durante o arraste também
      const set = n * step, base = centerOf(n);
      if (left < base - set * 0.5) { left += set; startScroll += set; }
      else if (left > base + set * 1.5) { left -= set; startScroll -= set; }
      track.scrollLeft = left;
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      const target = Math.round((track.scrollLeft - vel * 220 - centerOf(0)) / step);
      track.classList.remove('dragging');
      goTo(target);                               // inércia + centraliza
    });

    // clique: arraste não abre link; placa lateral vem para o centro
    track.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
      const i = items.indexOf(e.target.closest('.sponsor'));
      if (i > -1 && i !== active) { e.preventDefault(); e.stopPropagation(); goTo(i); }
    }, true);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    new ResizeObserver(layout).observe(track);
    layout();
  });
})();
