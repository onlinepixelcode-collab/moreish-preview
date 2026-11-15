/* Coffee & Shakes: milkshake glasses fill up, get cream and a straw as they scroll in. */
(() => {
  const { $$, reduce } = window.JMCore;
  const shakes = $$(".shake");
  if (reduce || !window.ScrollTrigger) { shakes.forEach((s) => s.classList.add("is-in")); return; }
  ScrollTrigger.batch(shakes, { start: "top 85%", once: true, onEnter: (els) => els.forEach((el, i) => setTimeout(() => el.classList.add("is-in"), i * 160)) });
})();
