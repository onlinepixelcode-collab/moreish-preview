/* Reusable canvas frame sequence: progressive (coarse-to-fine) loading, nearest-frame
   fallback while frames stream in, and a crossfade between neighbouring frames so the
   scrub stays smooth even with fewer frames. */
(function () {
  class Sequence {
    constructor({ canvas, count, src, onProgress, onReady, readyAt, crossfade = true, startAt = 0 }) {
      this.startAt = startAt;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.count = count;
      this.src = src;
      this.onProgress = onProgress || (() => {});
      this.onReady = onReady || (() => {});
      this.crossfade = crossfade;
      this.readyAt = readyAt || Math.min(count, Math.ceil(count / 4) + 2);
      this.pos = startAt; this.drawnKey = ""; this.raf = 0;
      this.resize = this.resize.bind(this);
      window.addEventListener("resize", this.resize, { passive: true });
      this.resize();
      this.load();
    }
    order() {
      const first = this.startAt || 0; const seen = new Set([first, 0, this.count - 1]); const out = [first, ...[0, this.count - 1].filter((x) => x !== first)];
      for (const s of [16, 8, 4, 2, 1]) for (let i = 0; i < this.count; i += s) if (!seen.has(i)) { seen.add(i); out.push(i); }
      return out;
    }
    load() {
      const gen = (this.gen = (this.gen || 0) + 1);
      this.frames = new Array(this.count); this.ok = new Uint8Array(this.count);
      const order = this.order(); let idx = 0, done = 0, ready = false, failed = 0;
      const next = () => {
        if (gen !== this.gen || idx >= order.length) return;
        const i = order[idx++]; const img = new Image(); let settled = false;
        const finish = (good) => {
          if (settled) return; settled = true; clearTimeout(t);
          if (gen !== this.gen) return;
          if (good) { this.frames[i] = img; this.ok[i] = 1; } else failed++;
          done++;
          if (!ready) {
            this.onProgress(Math.min(1, done / this.readyAt));
            if (done >= this.readyAt || done >= order.length) { ready = true; this.onReady(failed >= done); }
          }
          if (Math.abs(i - this.pos) < 2 || i === 0) this.request(true);
          next();
        };
        const t = setTimeout(() => finish(false), 15000);
        img.decoding = "async"; img.onload = () => finish(true); img.onerror = () => finish(false);
        img.src = this.src(i);
      };
      for (let k = 0; k < 6; k++) next();
    }
    setSource(src, count) { this.src = src; if (count) this.count = count; this.load(); }
    nearest(i) {
      if (this.ok[i]) return i;
      for (let d = 1; d < this.count; d++) {
        if (i - d >= 0 && this.ok[i - d]) return i - d;
        if (i + d < this.count && this.ok[i + d]) return i + d;
      }
      return -1;
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(this.canvas.clientWidth * dpr), h = Math.round(this.canvas.clientHeight * dpr);
      if (w && h && (this.canvas.width !== w || this.canvas.height !== h)) { this.canvas.width = w; this.canvas.height = h; }
      this.ctx.imageSmoothingQuality = "high";
      this.request(true);
    }
    set(pos) { this.pos = Math.max(0, Math.min(this.count - 1, pos)); this.request(false); }
    request(force) { this.force = this.force || force; if (!this.raf) this.raf = requestAnimationFrame(() => this.draw()); }
    blit(img, alpha) {
      const cw = this.canvas.width, ch = this.canvas.height;
      const ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
      let w, h; if (cr > ir) { w = cw; h = cw / ir; } else { h = ch; w = ch * ir; }
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    draw() {
      this.raf = 0;
      const a = Math.floor(this.pos), b = Math.min(this.count - 1, a + 1), t = this.pos - a;
      const ia = this.nearest(a); if (ia < 0) return;
      const useB = this.crossfade && t > 0.02 && this.ok[b] && ia === a && b !== a;
      const key = useB ? `${a}:${b}:${t.toFixed(2)}` : `${ia}`;
      if (key === this.drawnKey && !this.force) return;
      this.force = false; this.drawnKey = key;
      this.blit(this.frames[ia], 1);
      if (useB) this.blit(this.frames[b], t);
      this.ctx.globalAlpha = 1;
    }
  }
  window.Sequence = Sequence;
})();
