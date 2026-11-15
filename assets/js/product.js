/* Product page: the scroll-zoom story (square 3D frames) + the buy panel. */
(() => {
  const { $, $$, R, cart, wa, reduce } = window.JMCore;
  const { PRODUCTS } = window.JM;
  const story = $(".pstory");
  const p = PRODUCTS.find((x) => x.id === story.dataset.product);

  // ---------------------------------------------------------------- story
  const canvas = $(".pstory__canvas", story);
  const still = $(".pstory__still", story);
  const chapters = $$(".pstory__chapters li", story);
  const count = parseInt(story.dataset.frames, 10) || 72;
  const seq = story.dataset.seq;
  // scroll -> frame with dwell on each composition (frames are 0-based)
  const MAPS = {
    cake: { p: [0, 0.12, 0.3, 0.46, 0.54, 0.68, 0.74, 0.86, 0.92, 1], f: [0, 4, 30, 34, 46, 50, 58, 62, 68, 71] },
    tub: { p: [0, 0.12, 0.26, 0.4, 0.5, 0.64, 0.72, 0.84, 0.92, 1], f: [0, 4, 14, 32, 44, 48, 56, 60, 68, 71] },
    bag: { p: [0, 0.12, 0.3, 0.42, 0.52, 0.64, 0.72, 0.86, 1], f: [0, 4, 18, 22, 36, 40, 50, 55, 71] },
    cro: { p: [0, 0.12, 0.3, 0.42, 0.52, 0.64, 0.72, 0.86, 1], f: [0, 4, 18, 22, 34, 38, 50, 54, 71] },
    cup: { p: [0, 0.12, 0.3, 0.44, 0.54, 0.66, 0.74, 0.86, 1], f: [0, 4, 18, 34, 38, 50, 54, 62, 71] },
  };
  const map = MAPS[story.dataset.kind] || MAPS.cake;
  const frameAt = (t) => { for (let k = 1; k < map.p.length; k++) if (t <= map.p[k]) return map.f[k - 1] + (map.f[k] - map.f[k - 1]) * ((t - map.p[k - 1]) / (map.p[k] - map.p[k - 1])); return count - 1; };

  // fallback: no frames yet -> the product photo, zooming through the same chapters as you scroll
  const photo = story.dataset.img ? `${R}img/products/${story.dataset.img}.webp` : null;
  let stillOn = false;
  function useStill() {
    if (stillOn || !photo) return; stillOn = true;
    document.documentElement.classList.add("no-seq");
    still.src = photo; still.classList.add("pstory__still--photo");
    if (reduce || !window.gsap) return;
    gsap.timeline({ scrollTrigger: { trigger: story, start: "top top", end: "bottom bottom", scrub: 0.6 } })
      .fromTo(still, { scale: 1, yPercent: 0 }, { scale: 1.9, yPercent: 22, ease: "power1.inOut", duration: 0.4 })
      .to(still, { scale: 1.8, yPercent: -8, ease: "power1.inOut", duration: 0.25 })
      .to(still, { scale: 1.8, yPercent: -30, ease: "power1.inOut", duration: 0.15 })
      .to(still, { scale: 1, yPercent: 0, ease: "power2.inOut", duration: 0.2 });
  }
  still.addEventListener("error", useStill);

  if (reduce || !window.gsap || !canvas.getContext) {
    useStill();
    document.documentElement.classList.add("no-seq");
  } else {
    const s = new Sequence({
      canvas, count, readyAt: 19,
      src: (i) => `${R}frames/products/${seq}/${String(i + 1).padStart(4, "0")}.webp`,
      onReady: (failed) => { if (failed) useStill(); },
    });
    const yp = matchMedia("(max-width: 900px)").matches ? 0 : -50;
    const tl = gsap.timeline();
    tl.set({}, {}, 1);
    $$("[data-beat]", story).forEach((el) => {
      const [a, b] = el.dataset.beat.split(",").map(Number);
      const dur = 0.05;
      const kids = el.children;
      if (el.dataset.in === "0") {
        gsap.set(el, { autoAlpha: 1, yPercent: yp });
        gsap.from(kids, { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", delay: 0.6 });
        tl.to(el, { autoAlpha: 0, y: -50, duration: dur, ease: "power1.in" }, b - dur);
        return;
      }
      gsap.set(el, { yPercent: yp });
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, a)
        .fromTo(kids, { y: 60, autoAlpha: 0, filter: "blur(8px)" }, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: dur, stagger: 0.01, ease: "power3.out" }, a);
      if (b <= 1) tl.to(kids, { y: -40, autoAlpha: 0, duration: dur, stagger: 0.008, ease: "power2.in" }, b - dur).set(el, { autoAlpha: 0 }, b);
    });
    tl.to(".pstory__hint", { autoAlpha: 0, duration: 0.03 }, 0.04).to(".steam", { autoAlpha: 0, duration: 0.04 }, 0.1);
    const starts = chapters.map((li) => parseFloat(li.dataset.chapter));
    ScrollTrigger.create({
      trigger: story, start: "top top", end: "bottom bottom", scrub: true, animation: tl,
      onUpdate(self) {
        s.set(frameAt(self.progress));
        let on = 0; starts.forEach((v, i) => { if (self.progress >= v - 0.02) on = i; });
        chapters.forEach((li, i) => li.classList.toggle("is-on", i === on));
      },
    });
    chapters[0]?.classList.add("is-on");
  }

  // ---------------------------------------------------------------- buy panel
  const panel = $("[data-buy]");
  if (!panel) return;
  const qtyIn = $("[data-qty]", panel);
  const out = $("[data-price-out]", panel);
  const lineTotal = $("[data-line-total]", panel);
  const waBtn = $("[data-wa-product]", panel);
  const opt = () => $("input[type=radio]:checked", panel);
  const unitPrice = () => parseFloat(opt()?.dataset.price || panel.dataset.price);
  const qty = () => Math.max(1, Math.min(99, parseInt(qtyIn.value, 10) || 1));
  const label = p.name + (p.cat === "cheesecake" ? " ice-cream cheesecake" : "");
  function update() {
    qtyIn.value = qty();
    out.textContent = "R" + unitPrice();
    lineTotal.textContent = "R" + (unitPrice() * qty()).toLocaleString("en-ZA");
    const o = opt() ? ` (${opt().value})` : "";
    waBtn.href = wa(`Hi Just Moreish! I'd like to order ${qty()} × ${label}${o}. Estimated R${unitPrice() * qty()}.`);
    $$("[data-qty-set]", panel).forEach((b) => b.classList.toggle("is-on", +b.dataset.qtySet === qty()));
  }
  panel.addEventListener("click", (e) => {
    const st = e.target.closest("[data-step]"); const qs = e.target.closest("[data-qty-set]");
    if (st) { qtyIn.value = qty() + +st.dataset.step; update(); gsap?.fromTo(qtyIn, { scale: 1.25 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }); }
    if (qs) { qtyIn.value = qs.dataset.qtySet; update(); }
    if (e.target.closest("[data-add]")) {
      cart.add({ id: p.id, name: label, price: unitPrice(), qty: qty(), opt: opt()?.value || "" });
      const img = $(".pbuy__img img"); flyToCart(img);
    }
  });
  panel.addEventListener("change", update);
  qtyIn.addEventListener("input", () => { if (qtyIn.value) update(); });
  update();

  // a little clone of the product flies into the box icon
  function flyToCart(img) {
    if (!img || !window.gsap || reduce) return;
    const target = $(".cart-btn").getBoundingClientRect(); const r = img.getBoundingClientRect();
    const c = img.cloneNode(); Object.assign(c.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", objectFit: "cover", borderRadius: "22px", zIndex: 170, pointerEvents: "none" });
    document.body.appendChild(c);
    gsap.to(c, { left: target.left + target.width / 2 - 20, top: target.top + target.height / 2 - 20, width: 40, height: 40, borderRadius: "50%", duration: 0.9, ease: "power3.inOut", onComplete: () => c.remove() });
    gsap.to(c, { rotate: 20, duration: 0.9 });
  }
})();
