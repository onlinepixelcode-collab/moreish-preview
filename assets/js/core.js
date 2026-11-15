/* Just Moreish — shared behaviour for every page:
   page transitions, smooth scroll, theme, nav/menu, cursor, magnetic buttons,
   scroll reveals, marquee, rails, the box (cart) and WhatsApp ordering. */
(() => {
  const root = document.documentElement;
  const R = window.JM_ROOT || "";
  const { SITE, PRODUCTS } = window.JM;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = !!window.gsap;
  if (reduce) root.classList.add("reduced");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [SplitText] : []));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------------------------------------------------------------- WhatsApp
  const wa = (msg) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  const pageMsg = {
    home: "Hi Just Moreish! I'd like to order some ice-cream cheesecakes.",
    parlour: "Hi Just Moreish! I'd like to place an order from The Parlour.",
    build: "Hi Just Moreish! I'd like a quote for a custom cake.",
    coffee: "Hi Just Moreish! I'm interested in coffee, shakes or a coffee station.",
    stations: "Hi Just Moreish! I'd like a quote for a live station at my event.",
    about: "Hi Just Moreish! I'd like to order.",
    contact: "Hi Just Moreish!",
  };
  const defaultMsg = pageMsg[root.dataset.page] || "Hi Just Moreish! I'd like to order.";
  $$("[data-wa]").forEach((a) => { a.href = wa(a.dataset.waMsg || defaultMsg); });

  // ---------------------------------------------------------------- smooth scroll
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    }
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: -10, ...opts });
    else (typeof target === "number" ? window.scrollTo({ top: target, behavior: "smooth" }) : $(target)?.scrollIntoView({ behavior: "smooth" }));
  };
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);

  // ---------------------------------------------------------------- page transitions
  const curtain = $(".curtain");
  const bars = curtain ? $$("i", curtain) : [];
  const mark = curtain ? $(".curtain__mark", curtain) : null;
  function reveal() {
    if (!curtain) return;
    if (!hasGsap || reduce) { curtain.style.display = "none"; return; }
    const first = !sessionStorage.getItem("jm-seen");
    sessionStorage.setItem("jm-seen", "1");
    const tl = gsap.timeline({ onComplete: () => { curtain.style.visibility = "hidden"; document.dispatchEvent(new Event("jm:revealed")); } });
    if (first) {
      tl.fromTo(mark, { autoAlpha: 0, scale: 0.6, rotate: -8 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.7, ease: "back.out(2)" })
        .to(mark.children, { y: -14, duration: 0.25, yoyo: true, repeat: 1, stagger: 0.08, ease: "power2.out" })
        .to(mark, { autoAlpha: 0, scale: 0.9, duration: 0.3 });
    }
    tl.set(bars, { transformOrigin: "top" })
      .to(bars, { scaleY: 0, duration: 0.85, ease: "expo.inOut", stagger: { each: 0.06, from: "start" } }, first ? ">-0.1" : 0.05);
  }
  function leave(href) {
    if (!curtain || !hasGsap || reduce) { location.href = href; return; }
    curtain.style.visibility = "visible";
    gsap.set(mark, { autoAlpha: 0 });
    gsap.timeline({ onComplete: () => { location.href = href; } })
      .set(bars, { transformOrigin: "bottom", scaleY: 0 })
      .to(bars, { scaleY: 1, duration: 0.6, ease: "expo.inOut", stagger: { each: 0.05, from: "end" } });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) {
      const el = document.getElementById(url.hash.slice(1));
      if (el) { e.preventDefault(); closeMenu(); scrollTo(el); history.replaceState(null, "", url.hash); }
      return;
    }
    if (!/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault(); closeMenu(); leave(url.href);
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted && curtain) { gsap.set(bars, { scaleY: 0 }); curtain.style.visibility = "hidden"; } });

  // ---------------------------------------------------------------- theme
  const themeBtn = $("[data-theme-toggle]");
  const syncThemeBtn = () => themeBtn && themeBtn.setAttribute("aria-label", root.dataset.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  syncThemeBtn();
  themeBtn?.addEventListener("click", (e) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem("jm-theme", next); } catch (_) {} syncThemeBtn(); };
    if (document.startViewTransition && !reduce) {
      const r = themeBtn.getBoundingClientRect();
      root.style.setProperty("--vt-x", `${r.left + r.width / 2}px`);
      root.style.setProperty("--vt-y", `${r.top + r.height / 2}px`);
      document.startViewTransition(apply);
    } else apply();
  });

  // ---------------------------------------------------------------- nav + menu
  const nav = $("#nav");
  $$("[data-nav]").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === root.dataset.page));
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    nav.classList.toggle("is-hidden", y > 400 && y > lastY + 4 && !root.classList.contains("menu-open"));
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    progressBar && (progressBar.style.transform = `scaleX(${h > 0 ? y / h : 0})`);
  };
  const progressBar = $(".scroll-progress i");
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const menu = $("#menu"), menuBtn = $("[data-menu-toggle]");
  function openMenu() { menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false"); menuBtn.setAttribute("aria-expanded", "true"); menuBtn.setAttribute("aria-label", "Close menu"); root.classList.add("menu-open"); lenis?.stop(); }
  function closeMenu() { if (!menu?.classList.contains("is-open")) return; menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "Open menu"); root.classList.remove("menu-open"); lenis?.start(); }
  menuBtn?.addEventListener("click", () => (menu.classList.contains("is-open") ? closeMenu() : openMenu()));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenu(); closeCart(); } });

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-to-top]").forEach((b) => b.addEventListener("click", () => scrollTo(0, { offset: 0, duration: 1.8 })));

  // ---------------------------------------------------------------- cursor + magnetic
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    const c = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    const tick = () => { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(tick); };
    tick();
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, label, input, select, textarea, summary, [data-cursor]");
      c.classList.toggle("is-label", !!lab); c.classList.toggle("is-hover", !!hov && !lab);
      label.textContent = lab ? lab.dataset.cursor : "";
    });
    document.addEventListener("pointerleave", () => c.style.opacity = "0");
    document.addEventListener("pointerenter", () => c.style.opacity = "1");
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.28, y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.translate = `${x}px ${y}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "translate .6s cubic-bezier(.22,1,.36,1), transform .4s, box-shadow .4s"; el.style.translate = "0 0"; setTimeout(() => (el.style.transition = ""), 600); });
    });
  }

  // ---------------------------------------------------------------- scroll animations
  function animations() {
    if (!hasGsap || reduce) { $$("[data-reveal]").forEach((el) => (el.style.opacity = 1)); return; }
    // headline lines rise out of a mask
    if (window.SplitText) {
      $$("[data-split]").forEach((el) => {
        const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line-inner" });
        gsap.from(split.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 86%", once: true } });
      });
      // big words cascade letter by letter
      $$("[data-chars]").forEach((el) => {
        const split = SplitText.create(el, { type: "words,chars", mask: "words", wordsClass: "split-word" });
        gsap.from(split.chars, { yPercent: 120, rotate: 8, duration: 1, ease: "expo.out", stagger: 0.025, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
    }
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%", once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1 }),
    });
    $$("[data-reveal-img]").forEach((el) => {
      gsap.fromTo(el, { clipPath: "inset(18% 12% 18% 12% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      const img = $("img", el); img && gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    $$("[data-speed]").forEach((el) => {
      gsap.to(el, { yPercent: -parseFloat(el.dataset.speed) * 30, ease: "none", scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count); const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
    $$("[data-rotate-on-scroll]").forEach((el) => {
      gsap.to(el, { rotate: 200, ease: "none", scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: 1 } });
    });
    // marquee drifts and speeds up / reverses with scroll velocity
    $$("[data-marquee]").forEach((m) => {
      const track = $(".marquee__track", m);
      track.innerHTML += track.innerHTML;
      let x = 0, dir = parseFloat(m.dataset.marquee) || 1, boost = 0;
      ScrollTrigger.create({ trigger: m, start: "top bottom", end: "bottom top", onUpdate: (s) => { boost = Math.min(18, Math.abs(s.getVelocity()) / 120); if (s.direction) dir = s.direction * (parseFloat(m.dataset.marquee) || 1); } });
      gsap.ticker.add(() => {
        const w = track.scrollWidth / 2; x -= (0.6 + boost) * dir; boost *= 0.94;
        if (x <= -w) x += w; if (x > 0) x -= w;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
    // timeline line draws itself as you scroll
    $$("[data-timeline]").forEach((t) => {
      const line = $(".timeline__line i", t);
      line && gsap.to(line, { scaleY: 1, ease: "none", scrollTrigger: { trigger: t, start: "top 70%", end: "bottom 60%", scrub: true } });
    });
    // sticky stacked cards shrink as the next one arrives
    $$(".stack__card").forEach((card, i, all) => {
      if (i === all.length - 1) return;
      gsap.to(card, { scale: 0.92, filter: "brightness(.92)", ease: "none", scrollTrigger: { trigger: all[i + 1], start: "top bottom", end: "top 30%", scrub: true } });
    });
  }

  // drag-to-scroll rails
  $$("[data-rail]").forEach((rail) => {
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add("is-drag"); });
    addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    addEventListener("pointerup", () => { down = false; rail.classList.remove("is-drag"); });
    rail.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    rail.addEventListener("wheel", (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
  });

  // ---------------------------------------------------------------- toasts
  function toast(text, opts = {}) {
    const box = $("[data-toasts]"); if (!box) return;
    const t = document.createElement("div"); t.className = "toast";
    t.innerHTML = `${opts.img ? `<img src="${opts.img}" alt="">` : ""}<span>${text}</span>${opts.action ? `<button type="button">${opts.action}</button>` : ""}`;
    if (opts.action) t.querySelector("button").addEventListener("click", opts.onAction);
    box.appendChild(t); setTimeout(() => t.remove(), 3300);
  }

  // ---------------------------------------------------------------- the box (cart)
  const KEY = "jm-box";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { return []; } };
  const save = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {} };
  let items = load();
  const rand = (n) => "R" + Math.round(n).toLocaleString("en-ZA");
  const imgFor = (id) => { const p = PRODUCTS.find((x) => x.id === id); return p ? `${R}img/products/${p.img || p.id}.webp` : `${R}img/products/big.webp`; };
  const cartEl = $("#cart");

  function renderCart() {
    const count = items.reduce((a, b) => a + b.qty, 0);
    const total = items.reduce((a, b) => a + (b.price || 0) * b.qty, 0);
    $$("[data-cart-count]").forEach((el) => (el.textContent = count));
    $$(".cart-btn").forEach((b) => { b.classList.toggle("has-items", count > 0); b.setAttribute("aria-label", `Open your box (${count} items)`); });
    const list = $("[data-cart-items]"); if (!list) return;
    $("[data-cart-total]").textContent = items.some((i) => !i.price) ? `${rand(total)} + quote` : rand(total);
    $("[data-cart-foot]").style.display = items.length ? "" : "none";
    list.innerHTML = items.length ? items.map((it, n) => `
      <div class="citem">
        <img src="${it.img || imgFor(it.id)}" alt="">
        <div><h3>${it.name}</h3><p>${it.opt ? it.opt + " · " : ""}${it.price ? rand(it.price) + " each" : "Quote on request"}</p>
          <div class="stepper stepper--s" style="margin-top:10px">
            <button type="button" data-ci="${n}" data-d="-1" aria-label="One less ${it.name}">−</button>
            <input type="number" value="${it.qty}" min="1" max="99" aria-label="Quantity of ${it.name}" data-ci-in="${n}">
            <button type="button" data-ci="${n}" data-d="1" aria-label="One more ${it.name}">+</button>
          </div></div>
        <div class="citem__price">${it.price ? rand(it.price * it.qty) : "Quote"}<button class="citem__remove" type="button" data-rm="${n}">Remove</button></div>
      </div>`).join("") : `
      <div class="cart-empty"><div class="stripe" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <p>Your box is empty. That's a problem we can fix.</p><a class="btn" href="${R}parlour.html">Browse The Parlour</a></div>`;
    updateSend();
  }
  function message() {
    const fulfil = ($("input[name=jm-fulfil]:checked") || {}).value || "Collection";
    const date = $("[data-cart-date]")?.value; const notes = $("[data-cart-notes]")?.value.trim();
    const total = items.reduce((a, b) => a + (b.price || 0) * b.qty, 0);
    const lines = items.map((i) => `• ${i.qty} × ${i.name}${i.opt ? ` (${i.opt})` : ""}${i.price ? ` – ${rand(i.price * i.qty)}` : " – quote please"}`);
    return [`Hi Just Moreish! I'd like to order:`, ...lines, ``, `Estimated total: ${rand(total)}${items.some((i) => !i.price) ? " + quote" : ""}`,
      `${fulfil}${date ? ` on ${date}` : ""}`, notes ? `Notes: ${notes}` : "", ``, `(Sent from justmoreish website)`].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  }
  function updateSend() { const a = $("[data-cart-send]"); if (a) a.href = wa(message()); }
  function add(item) {
    const same = items.find((i) => i.id === item.id && i.opt === item.opt && !item.custom);
    if (same) same.qty = Math.min(99, same.qty + item.qty); else items.push({ ...item });
    save(items); renderCart();
    $$(".cart-btn").forEach((b) => { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
    toast(`${item.qty} × ${item.name} added to your box`, { img: item.img || imgFor(item.id), action: "View box", onAction: openCart });
  }
  cartEl?.addEventListener("click", (e) => {
    const d = e.target.closest("[data-ci]"); const rm = e.target.closest("[data-rm]");
    if (d) { const it = items[+d.dataset.ci]; it.qty = Math.max(1, Math.min(99, it.qty + +d.dataset.d)); save(items); renderCart(); }
    if (rm) { items.splice(+rm.dataset.rm, 1); save(items); renderCart(); }
  });
  cartEl?.addEventListener("change", (e) => {
    const inp = e.target.closest("[data-ci-in]");
    if (inp) { items[+inp.dataset.ciIn].qty = Math.max(1, Math.min(99, parseInt(inp.value) || 1)); save(items); renderCart(); }
    else updateSend();
  });
  cartEl?.addEventListener("input", updateSend);
  function openCart() { root.classList.add("cart-open"); cartEl.setAttribute("aria-hidden", "false"); lenis?.stop(); setTimeout(() => $("button", cartEl)?.focus(), 300); }
  function closeCart() { if (!root.classList.contains("cart-open")) return; root.classList.remove("cart-open"); cartEl.setAttribute("aria-hidden", "true"); lenis?.start(); }
  $$("[data-cart-open]").forEach((b) => b.addEventListener("click", openCart));
  $$("[data-cart-close]").forEach((b) => b.addEventListener("click", closeCart));
  $("[data-cart-send]")?.addEventListener("click", () => setTimeout(() => toast("Opening WhatsApp with your order…"), 100));
  const dateIn = $("[data-cart-date]"); if (dateIn) dateIn.min = new Date().toISOString().slice(0, 10);
  addEventListener("storage", (e) => { if (e.key === KEY) { items = load(); renderCart(); } });
  renderCart();

  // quick-add buttons on product cards
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quick-add]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const p = PRODUCTS.find((x) => x.id === b.dataset.quickAdd);
    add({ id: p.id, name: p.name + (p.cat === "cheesecake" ? " ice-cream cheesecake" : ""), price: p.options?.prices ? p.options.prices[0] : p.price, qty: 1, opt: p.options ? p.options.values[0] : "" });
  });

  // ---------------------------------------------------------------- forms that open WhatsApp
  $$("[data-wa-form]").forEach((f) => {
    const err = $("[data-form-error]", f);
    $$("input[type=date]", f).forEach((d) => (d.min = new Date().toISOString().slice(0, 10)));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const missing = $$("[required]", f).filter((i) => !i.value.trim());
      $$("[aria-invalid]", f).forEach((i) => i.removeAttribute("aria-invalid"));
      if (missing.length) {
        missing.forEach((i) => i.setAttribute("aria-invalid", "true"));
        if (err) { err.hidden = false; err.textContent = "Please fill in: " + missing.map((i) => i.closest("label").querySelector("span").textContent.toLowerCase()).join(", ") + "."; }
        missing[0].focus(); return;
      }
      if (err) err.hidden = true;
      const kind = f.dataset.waForm; const fd = new FormData(f);
      const rows = [];
      $$("label.field", f).forEach((l) => { const i = $("input,select,textarea", l); if (i && i.value.trim()) rows.push(`• ${$("span", l).textContent}: ${i.value.trim()}`); });
      const st = fd.getAll("stations"); if (st.length) rows.push(`• Stations: ${st.join(", ")}`);
      const head = kind === "event" ? "Hi Just Moreish! I'd like a quote for an event:" : "Hi Just Moreish!";
      window.open(wa([head, ...rows, "", "(Sent from the website)"].join("\n")), "_blank", "noopener");
      toast("Opening WhatsApp with your message…");
    });
  });

  // ---------------------------------------------------------------- go
  window.JMCore = { lenis, scrollTo, wa, toast, cart: { add, open: openCart, close: closeCart }, reduce, R, $, $$ };
  const start = () => { reveal(); animations(); document.dispatchEvent(new Event("jm:ready")); };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(start);
  else start();
})();
