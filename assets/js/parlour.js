/* The Parlour: filter chips with a FLIP-style re-layout animation. */
(() => {
  const { $, $$, reduce } = window.JMCore;
  const grid = $("[data-grid]");
  const items = $$(".pcard, .shop-cta", grid);
  $$("[data-filter]").forEach((chip) => chip.addEventListener("click", () => {
    const f = chip.dataset.filter;
    $$("[data-filter]").forEach((c) => { const on = c === chip; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on); });
    const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    items.forEach((el) => {
      const show = f === "all" || el.dataset.cat === f || (f === "custom" && el.classList.contains("shop-cta"));
      el.classList.toggle("is-hidden", !show); el.style.display = show ? "" : "none";
    });
    if (reduce || !window.gsap) return;
    items.forEach((el) => {
      if (el.style.display === "none") return;
      const a = first.get(el), b = el.getBoundingClientRect();
      if (!a.width) { gsap.fromTo(el, { autoAlpha: 0, scale: 0.9, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: "expo.out" }); return; }
      gsap.fromTo(el, { x: a.left - b.left, y: a.top - b.top }, { x: 0, y: 0, duration: 0.8, ease: "expo.out" });
    });
    ScrollTrigger.refresh();
  }));
  // cards rise in a wave on first view
  if (window.gsap && !reduce) gsap.from(items, { y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: { each: 0.06, grid: "auto" }, scrollTrigger: { trigger: grid, start: "top 85%", once: true } });
})();
