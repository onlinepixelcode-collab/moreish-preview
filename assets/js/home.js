/* Home: the scroll-scrubbed hero film + pinned horizontal flavour gallery. */
(() => {
  const { $, $$, R, reduce } = window.JMCore;
  const html = document.documentElement;
  const canvas = $("#seq"), still = $("#still"), bar = $("#storyBar");
  const mq = matchMedia("(max-width: 767px), (orientation: portrait)");
  const setName = () => (mq.matches ? "mobile" : "desktop");
  const src = (name) => (i) => `${R}frames/${name}/${String(i + 1).padStart(4, "0")}.webp`;
  still.src = src(setName())(159);
  // the film plays in reverse: line-up -> push in to the meringue -> layers part -> back together -> hero
  const MAP_P = [0, 0.1, 0.3, 0.42, 0.5, 0.64, 0.86, 1];
  const MAP_F = [159, 155, 107, 97, 77, 61, 3, 0];
  const frameAt = (p) => { for (let k = 1; k < MAP_P.length; k++) if (p <= MAP_P[k]) return MAP_F[k - 1] + (MAP_F[k] - MAP_F[k - 1]) * ((p - MAP_P[k - 1]) / (MAP_P[k] - MAP_P[k - 1])); return 0; };

  if (reduce || !window.gsap || !canvas.getContext) { html.classList.add("no-seq"); }
  else {
    let current = setName();
    const seq = new Sequence({ canvas, count: 160, readyAt: 41, startAt: 159, src: src(current), onReady: (f) => f && html.classList.add("no-seq") });
    mq.addEventListener("change", () => { const n = setName(); if (n !== current) { current = n; still.src = src(n)(159); seq.setSource(src(n), 160); } });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.set({}, {}, 1);
    $$("[data-beat]").forEach((el) => {
      const [a, b] = el.dataset.beat.split(",").map(Number); const d = 0.045;
      if (el.dataset.in === "0") { gsap.set(el, { autoAlpha: 1 }); tl.to(el, { autoAlpha: 0, y: -50, duration: d, ease: "power1.in" }, b - d); return; }
      tl.fromTo(el, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: d }, a);
      if (el.matches(".callouts, .tags")) tl.fromTo(el.children, { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: d, stagger: 0.012 }, a);
      if (b <= 1) tl.to(el, { autoAlpha: 0, y: -46, duration: d, ease: "power1.in" }, b - d);
    });
    ScrollTrigger.create({
      trigger: "#story", start: "top top", end: "bottom bottom", scrub: true, animation: tl,
      onUpdate(self) { seq.set(frameAt(self.progress)); bar.style.transform = `scaleX(${self.progress})`; },
    });
    // hero entrance once the curtain lifts
    const enter = () => gsap.fromTo(".beat--first > *", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: "expo.out", stagger: 0.12 });
    document.addEventListener("jm:revealed", enter, { once: true });
    setTimeout(() => { if (gsap.getProperty(".beat--first h1", "opacity") === 0) enter(); }, 2600);
    gsap.set(".beat--first > *", { autoAlpha: 0 });
  }

  // ---------------- pinned horizontal flavours (desktop), native swipe on touch
  const track = $("[data-htrack]");
  if (track && window.gsap && !reduce) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: "#flavours", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
      // cards tilt in as they travel
      $$(".pcard", track).forEach((c) => gsap.fromTo(c, { rotate: 4, y: 40 }, { rotate: 0, y: 0, ease: "none",
        scrollTrigger: { trigger: c, containerAnimation: tween, start: "left right", end: "left 55%", scrub: true } }));
    });
    mm.add("(max-width: 900px)", () => { track.style.overflowX = "auto"; track.style.width = "100%"; track.setAttribute("data-rail", ""); track.style.scrollSnapType = "x mandatory"; });
  }
})();
