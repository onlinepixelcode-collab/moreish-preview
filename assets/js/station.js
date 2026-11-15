/* Live Stations: an interactive, pre-rendered (Blender Cycles) kiosk.
   Load -> the camera glides in (intro film). Tap a glowing hotspot -> the camera flies to it
   (its own film) and that station's menu pops up. Close / tap the scene / Esc -> the film plays in
   reverse. Tabs inside every menu jump straight to another one. */
(() => {
  const { $, $$, R, reduce } = window.JMCore;
  const stage = $("[data-kiosk]");
  const canvas = $(".kiosk__canvas", stage);
  const ctx = canvas.getContext("2d", { alpha: false });
  const still = $(".kiosk__still", stage);
  const spotsWrap = $("[data-hotspots]", stage);
  const spots = $$(".hotspot", stage);
  const intro = $("[data-kiosk-intro]");
  const hint = $("[data-kiosk-hint]", stage);
  const loading = $("[data-kiosk-loading]", stage);
  const COUNTS = { intro: 48, menu: 36, coffee: 36, gelato: 36, croissants: 36, cheesecakes: 36 };
  let IMG_W = 1920, IMG_H = 1200;
  const cache = {}; let ok = true;
  const src = (seq, i) => `${R}frames/station/${seq}/${String(i + 1).padStart(4, "0")}.webp`;

  function load(seq, onDone) {
    if (cache[seq]) { cache[seq].done ? onDone && onDone() : onDone && cache[seq].cbs.push(onDone); return; }
    const c = (cache[seq] = { imgs: new Array(COUNTS[seq]), n: 0, failed: 0, done: false, cbs: onDone ? [onDone] : [] });
    let idx = 0;
    const next = () => {
      if (idx >= COUNTS[seq]) return;
      const i = idx++; const img = new Image(); img.decoding = "async";
      img.onload = () => { c.imgs[i] = img; if (i === 0 && img.naturalWidth) { IMG_W = img.naturalWidth; IMG_H = img.naturalHeight; resize(); } fin(); };
      img.onerror = () => { c.failed++; fin(); };
      img.src = src(seq, i);
      function fin() { c.n++; if (c.n === COUNTS[seq]) { c.done = true; c.cbs.forEach((f) => f && f()); } else next(); }
    };
    for (let k = 0; k < 6; k++) next();
  }

  // ------------------------------------------------------------ drawing (cover on desktop, contain on mobile)
  const isCover = () => matchMedia("(min-width: 901px) and (orientation: landscape)").matches;
  let view = { s: 1, ox: 0, oy: 0, dpr: 1 };
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = stage.clientWidth, h = stage.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.imageSmoothingQuality = "high";
    const s = isCover() ? Math.max(w / IMG_W, h / IMG_H) : Math.min(w / IMG_W, h / IMG_H);
    view = { s, ox: (w - IMG_W * s) / 2, oy: (h - IMG_H * s) / 2, dpr };
    placeSpots(); redraw();
  }
  let cur = { seq: "intro", pos: COUNTS.intro - 1 };
  function frame(seq, i) {
    const c = cache[seq]; if (!c) return null;
    for (let d = 0; d < COUNTS[seq]; d++) { if (c.imgs[i - d]) return c.imgs[i - d]; if (c.imgs[i + d]) return c.imgs[i + d]; }
    return null;
  }
  function blit(img, a) { const { s, ox, oy, dpr } = view; ctx.globalAlpha = a; ctx.drawImage(img, ox * dpr, oy * dpr, IMG_W * s * dpr, IMG_H * s * dpr); }
  function redraw() {
    const a = Math.floor(cur.pos), t = cur.pos - a;
    const A = frame(cur.seq, a); if (!A) return;
    ctx.globalAlpha = 1; ctx.fillStyle = "#E9E2D8"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    blit(A, 1);
    const B = t > 0.02 && cache[cur.seq].imgs[a + 1]; if (B) blit(B, t);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ hotspots (positions projected from the 3D scene)
  let HOT = { menu: [0.13, 0.45], coffee: [0.49, 0.47], gelato: [0.6, 0.49], croissants: [0.42, 0.55], cheesecakes: [0.51, 0.57] };
  fetch(`${R}assets/js/station-hotspots.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) { HOT = { ...HOT, ...j }; placeSpots(); } }).catch(() => {});
  function placeSpots() {
    const { s, ox, oy } = view;
    spots.forEach((b) => { const [x, y] = HOT[b.dataset.spot]; b.style.left = `${ox + x * IMG_W * s}px`; b.style.top = `${oy + y * IMG_H * s}px`; });
  }

  // ------------------------------------------------------------ fly-to / back / switch
  let busy = false, open = null, lastSpot = null;
  const filmOk = (seq) => ok && !reduce && cache[seq]?.done && cache[seq].failed < 4;
  function play(seq, from, to, duration, done) {
    if (!filmOk(seq)) { cur = { seq: "intro", pos: COUNTS.intro - 1 }; redraw(); done && done(); return; }
    cur.seq = seq; const o = { p: from };
    gsap.to(o, { p: to, duration, ease: "power2.inOut", onUpdate: () => { cur.pos = o.p; redraw(); }, onComplete: done });
  }
  const markTabs = (name) => $$("[data-goto]", stage).forEach((b) => b.classList.toggle("is-on", b.dataset.goto === name));
  function showMenu(name) {
    const m = $(`[data-menu="${name}"]`, stage); open = m; markTabs(name); m.scrollTop = 0;
    m.setAttribute("aria-hidden", "false"); m.classList.add("is-open");
    if (window.gsap && !reduce) {
      gsap.fromTo(m, { autoAlpha: 0, y: 40, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "expo.out" });
      gsap.from($$("li, h2, h3, .kmenu__lede, footer > *", m), { y: 18, autoAlpha: 0, duration: 0.5, stagger: 0.03, ease: "power3.out", delay: 0.1 });
    } else m.style.opacity = 1;
    setTimeout(() => m.focus({ preventScroll: true }), 50);
  }
  function hideMenu(cb) {
    const m = open; open = null; if (!m) return cb && cb();
    m.setAttribute("aria-hidden", "true");
    if (window.gsap && !reduce) gsap.to(m, { autoAlpha: 0, y: 30, scale: 0.96, duration: 0.3, ease: "power2.in", onComplete: () => { m.classList.remove("is-open"); cb && cb(); } });
    else { m.classList.remove("is-open"); m.style.opacity = 0; cb && cb(); }
  }
  function go(name) {
    if (busy) return; busy = true; lastSpot = name; stage.classList.add("is-flying");
    gsap.to([spotsWrap, intro, hint], { autoAlpha: 0, duration: 0.3 });
    const fly = () => play(name, 0, COUNTS[name] - 1, 1.6, () => { busy = false; stage.classList.remove("is-flying"); stage.classList.add("is-detail"); showMenu(name); });
    if (!ok || cache[name]?.done) fly();
    else { loading.classList.add("is-on"); load(name, () => { loading.classList.remove("is-on"); fly(); }); }
  }
  function back(then) {
    if (busy || !lastSpot) return; busy = true; stage.classList.remove("is-detail");
    const from = lastSpot;
    hideMenu(() => play(from, COUNTS[from] - 1, 0, then ? 1.0 : 1.3, () => {
      busy = false; lastSpot = null; cur = { seq: "intro", pos: COUNTS.intro - 1 }; redraw();
      if (typeof then === "string") { go(then); return; }
      gsap.to([spotsWrap, intro, hint], { autoAlpha: 1, duration: 0.5 });
      $(`[data-spot="${from}"]`, stage)?.focus({ preventScroll: true });
    }));
  }
  function switchTo(name) {
    if (busy) return;
    if (!lastSpot) return go(name);
    if (name === lastSpot) return;
    load(name); back(name);
  }

  spots.forEach((b) => {
    b.addEventListener("click", () => go(b.dataset.spot));
    b.addEventListener("pointerenter", () => load(b.dataset.spot)); // warm up its film on hover
    b.addEventListener("focus", () => load(b.dataset.spot));
  });
  $$("[data-back]", stage).forEach((b) => b.addEventListener("click", () => back()));
  $$("[data-goto]", stage).forEach((b) => b.addEventListener("click", () => switchTo(b.dataset.goto)));
  [canvas, still].forEach((el) => el.addEventListener("click", () => { if (stage.classList.contains("is-detail")) back(); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) back(); });

  // ------------------------------------------------------------ start: glide in, then reveal hotspots
  addEventListener("resize", resize, { passive: true });
  resize();
  gsap.set([spotsWrap, hint], { autoAlpha: 0 });
  gsap.set(intro.children, { autoAlpha: 0, y: 30 });
  const reveal = () => {
    gsap.to(intro.children, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "expo.out" });
    gsap.to(spotsWrap, { autoAlpha: 1, duration: 0.01, delay: 0.3 });
    gsap.from(spots, { scale: 0, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: "back.out(2.5)", delay: 0.4 });
    gsap.to(hint, { autoAlpha: 1, duration: 0.6, delay: 1.2 });
    ["menu", "coffee", "gelato", "croissants", "cheesecakes"].forEach((s, i) => setTimeout(() => load(s), 800 + i * 600));
  };
  loading.classList.add("is-on");
  let started = false;
  const begin = () => {
    if (started) return; started = true; loading.classList.remove("is-on");
    if (!cache.intro || cache.intro.failed > 10) { ok = false; stage.classList.add("no-film"); reveal(); return; }
    canvas.style.opacity = 1; play("intro", 0, COUNTS.intro - 1, reduce ? 0 : 2.8, reveal);
  };
  load("intro", begin);
  setTimeout(() => { if (!started) { ok = !!cache.intro?.n && cache.intro.failed < 10; begin(); } }, 9000);
})();
