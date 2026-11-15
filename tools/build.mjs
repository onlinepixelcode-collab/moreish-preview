// Assemble the static site from src/partials + src/pages, and generate one page per product.
// Run:  node tools/build.mjs      (Node built-ins only, no npm installs)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const JM = require(path.join(ROOT, "assets/js/data.js"));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const V = Date.now().toString(36);

const partial = Object.fromEntries(
  ["head", "header", "footer", "overlays", "scripts"].map((n) => [n, read(`src/partials/${n}.html`)])
);

function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ""));
}

const escH = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function card(p, root, extra = "") {
  const tag = p.cat === "cheesecake" ? "Ice-cream cheesecake" : { tubs: "Gelato · 1 L", coffee: "Coffee beans", croissants: "Croissants" }[p.cat];
  const price = p.options?.prices ? `from R${Math.min(...p.options.prices)}` : `R${p.price}`;
  return `
          <a class="pcard${extra}" href="${root}parlour/${p.id}.html" data-cat="${p.cat}" style="--chip:${p.colour}" data-cursor="View">
            <span class="pcard__tag">${tag}</span>
            <button class="pcard__add" type="button" data-quick-add="${p.id}" aria-label="Add ${escH(p.name)} to your box">+</button>
            <figure><img src="${root}img/products/${p.img || p.id}.webp" alt="${escH(p.name)}" loading="lazy" width="800" height="1000"></figure>
            <div class="pcard__meta"><h3>${escH(p.name)}</h3><span>${price}</span></div>
            <p class="pcard__sub">${escH(p.short)}</p>
          </a>`;
}
function sw(group, value, colour, checked, type) {
  return `<label class="swatch${colour ? "" : " swatch--plain"}"${colour ? ` style="--sw:${colour}"` : ""}><input type="${type}" name="b-${group}" value="${escH(value)}"${checked ? " checked" : ""}><span>${escH(value)}</span></label>`;
}
function page({ body, title, description, page: pageId, root = "", scripts = [], headExtra = "" }) {
  const vars = {
    title, description, page: pageId, root, v: V, headExtra,
    flavourCards: JM.PRODUCTS.filter((p) => p.cat === "cheesecake").map((p) => card(p, root)).join(""),
    shopCards: JM.PRODUCTS.map((p, i) => card(p, root, "")).join(""),
    bType: JM.BUILDER.types.map((t, i) => sw("type", t, null, i === 0, "radio")).join(""),
    bBase: JM.BUILDER.bases.map((b, i) => sw("base", b.name, b.colour, i === 0, "radio")).join(""),
    bFlavour: JM.BUILDER.flavours.map((f, i) => sw("flavour", f.name, f.colour, i === 0, "radio")).join(""),
    bToppings: JM.BUILDER.toppings.map((t, i) => sw("toppings", t.name, t.colour, false, "checkbox")).join(""),
    bSize: JM.BUILDER.sizes.map((s, i) => sw("size", s, null, i === 0, "radio")).join(""),
    coffeeItems: JM.COFFEE_MENU.map((c) => `<li>${escH(c.name)} <small>${escH(c.note)}</small></li>`).join(""),
    shakeItems: JM.SHAKES.map((c) => `<li>${escH(c.name)} <small>${escH(c.note)}</small></li>`).join(""),
    cakeItems: JM.PRODUCTS.filter((p) => p.cat === "cheesecake").map((p) => `<li><a href="${root}parlour/${p.id}.html">${escH(p.name)}</a> <small>${escH(p.short)}</small></li>`).join(""),
    stationCards: JM.STATIONS.map((s, i) => `
          <article class="stack__card" style="--c:${s.colour};--i:${i}">
            <span class="stack__n">0${i + 1}</span>
            <div><p class="mono">Station 0${i + 1}</p><h3>${escH(s.name)}</h3><p>${escH(s.text)}</p></div>
            <a class="btn btn--ghost" style="--f:#2B1D16;border-color:rgba(43,29,22,.25)" data-wa="station-${s.id}" data-wa-msg="Hi Just Moreish! I'd like a quote for a ${escH(s.name.toLowerCase())} at my event." href="#" target="_blank" rel="noopener">Ask about this</a>
          </article>`).join(""),
    shakeCards: JM.SHAKES.map((s) => `
          <article class="shake" style="--c:${s.colour}" data-reveal>
            <div class="shake__glass" aria-hidden="true"><i class="shake__cream"></i><i class="shake__straw"></i><i class="shake__fill"></i></div>
            <h3>${escH(s.name)}</h3><p>${escH(s.note)}</p>
          </article>`).join(""),
    coffeeBoard: JM.COFFEE_MENU.map((c) => `<li data-reveal><h3>${escH(c.name)}</h3><p>${escH(c.note)}</p></li>`).join(""),
    nitty: JM.BUILDER.nittyGritty.map((n) => `<li>${escH(n)}</li>`).join(""),
    scripts: scripts.map((s) => `<script${s.endsWith(".module.js") ? ' type="module"' : ""} src="${root}${s}?v=${V}"></script>`).join("\n  "),
  };
  return [
    fill(partial.head, vars), fill(partial.header, vars),
    `  <main id="main">\n${fill(body, vars)}\n  </main>`,
    fill(partial.footer, vars), fill(partial.overlays, vars), fill(partial.scripts, vars),
  ].join("\n");
}

function write(rel, html) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log("wrote", rel);
}

// ------------------------------------------------------------------ regular pages
for (const file of fs.readdirSync(path.join(ROOT, "src/pages"))) {
  if (!file.endsWith(".html") || file.startsWith("_")) continue;
  const src = read(`src/pages/${file}`);
  const m = src.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) throw new Error(`${file}: missing meta comment`);
  const meta = JSON.parse(m[1]);
  write(meta.out || file, page({ ...meta, body: src.slice(m[0].length) }));
}

// ------------------------------------------------------------------ product pages
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rand = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
const CHAPTERS = { cro: ["Meet", "Flavours", "Drizzle", "Layers", "Yours"], cake: ["Meet", "Topping", "Ice-cream", "Base", "Yours"], tub: ["Meet", "Lid off", "Scoop", "Label", "Yours"],
  bag: ["Meet", "Turn", "Beans", "Notes", "Yours"] };
// where each beat sits along the scroll (0-1)
const BEAT_AT = { cro: [[0, 0.16], [0.24, 0.42], [0.48, 0.64], [0.7, 0.84], [0.9, 1.01]], cake: [[0, 0.16], [0.26, 0.44], [0.5, 0.66], [0.72, 0.84], [0.9, 1.01]],
  tub: [[0, 0.14], [0.22, 0.4], [0.46, 0.64], [0.7, 0.84], [0.9, 1.01]],
  bag: [[0, 0.16], [0.24, 0.42], [0.48, 0.64], [0.7, 0.84], [0.9, 1.01]] };
const beatKeys = { cro: ["intro", "turn", "drizzle", "layers", "outro"], cake: ["intro", "topping", "icecream", "base", "outro"], tub: ["intro", "lid", "scoop", "label", "outro"],
  bag: ["intro", "turn", "beans", "label", "outro"] };

const all = JM.PRODUCTS;
all.forEach((p, i) => {
  const root = "../";
  const seq = p.seq || p.id;
  const img = p.img || p.id;
  const keys = beatKeys[p.kind];
  const beats = keys.map((k, n) => {
    const [h, t] = p.beats[k];
    const [a, b] = BEAT_AT[p.kind][n];
    const side = n % 2 ? "right" : "left";
    return `
        <div class="pbeat pbeat--${side}${n === 0 ? " pbeat--first" : ""}" data-beat="${a},${b}"${n === 0 ? ' data-in="0"' : ""}>
          <p class="mono">${String(n + 1).padStart(2, "0")} / ${CHAPTERS[p.kind][n]}</p>
          <${n === 0 ? "h1" : "h2"} class="display display--m">${esc(h)}</${n === 0 ? "h1" : "h2"}>
          <p class="lede">${esc(t)}</p>
        </div>`;
  }).join("");
  const chapters = CHAPTERS[p.kind].map((c, n) => `<li data-chapter="${BEAT_AT[p.kind][n][0]}"><span>${c}</span></li>`).join("");
  const opts = p.options ? `
            <fieldset class="opt" data-opt>
              <legend class="mono">${esc(p.options.label)}</legend>
              <div class="opt__list">${p.options.values.map((v, n) => `
                <label><input type="radio" name="opt-${p.id}" value="${esc(v)}" ${n === 0 ? "checked" : ""} data-price="${p.options.prices ? p.options.prices[n] : p.price}"><span>${esc(v)}</span></label>`).join("")}
              </div>
            </fieldset>` : "";
  const others = all.filter((o) => o.id !== p.id);
  const rail = others.map((o) => `
          <a class="pcard" href="${o.id}.html" style="--chip:${o.colour}" data-cursor="View">
            <figure><img src="${root}img/products/${o.img || o.id}.webp" alt="${esc(o.name)}" loading="lazy" width="800" height="1000"></figure>
            <div class="pcard__meta"><h3>${esc(o.name)}</h3><span>R${o.price}</span></div>
          </a>`).join("");
  const prev = all[(i - 1 + all.length) % all.length], next = all[(i + 1) % all.length];
  const cat = { cheesecake: "Ice-cream cheesecake", tubs: "Gelato · 1 litre", coffee: "Coffee", croissants: "Gourmet croissants" }[p.cat];
  const body = `
    <section class="pstory" data-product="${p.id}" data-img="${img}" data-seq="${seq}" data-frames="${p.frames}" data-kind="${p.kind}" style="--chip:${p.colour};--chip-ink:${p.ink}">
      <div class="pstory__stage stage-light">
        <canvas class="pstory__canvas" aria-hidden="true"></canvas>
        <img class="pstory__still" src="${root}frames/products/${seq}/0001.webp" alt="${esc(p.name)} by Just Moreish" width="1400" height="1400">
        <a class="pstory__back mono" href="${root}parlour.html">← The Parlour</a>
        <ol class="pstory__chapters" aria-hidden="true">${chapters}</ol>
        ${beats}
        <div class="pstory__hint mono" aria-hidden="true">Scroll to explore</div>
      </div>
    </section>

    <section class="pbuy section" id="buy" style="--chip:${p.colour};--chip-ink:${p.ink}">
      <div class="wrap pbuy__grid">
        <figure class="pbuy__img" data-reveal-img><img src="${root}img/products/${img}.webp" alt="${esc(p.name)}" width="800" height="1000"></figure>
        <div class="pbuy__panel" data-buy data-id="${p.id}" data-name="${esc(p.name)}" data-price="${p.price}">
          <p class="mono pbuy__cat">${cat}${p.unit ? "" : " · single serve"}</p>
          <h2 class="display display--l" data-split>${esc(p.name)}</h2>
          <p class="lede">${esc(p.short)} ${esc(p.line)}</p>
          <p class="pbuy__price"><span data-price-out>R${p.price}</span> <small>${p.unit ? "per " + esc(p.unit) : "each"}</small></p>
          ${opts}
          <div class="pbuy__row">
            <div class="stepper" data-stepper>
              <button type="button" data-step="-1" aria-label="One less">−</button>
              <input type="number" value="1" min="1" max="99" inputmode="numeric" aria-label="Quantity" data-qty>
              <button type="button" data-step="1" aria-label="One more">+</button>
            </div>
            <button class="btn btn--grow" type="button" data-add data-magnetic>Add to box · <span data-line-total>R${p.price}</span></button>
          </div>
          <div class="pbuy__quick">${p.cat === "cheesecake" ? [4, 6, 12].map((q) => `<button type="button" class="chip" data-qty-set="${q}">Box of ${q}</button>`).join("") : ""}</div>
          <a class="btn btn--ghost btn--block" href="#" data-wa-product target="_blank" rel="noopener">Order this now on WhatsApp</a>
          <ul class="pbuy__notes">${p.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
          <details class="acc"><summary>Storage &amp; allergens</summary><p>Keep frozen until serving; let it stand for 3–5 minutes for the perfect spoon. Contains dairy, gluten and egg, and may contain traces of nuts.</p></details>
          <details class="acc"><summary>Collection &amp; delivery</summary><p>Order on WhatsApp and we'll confirm a collection time or arrange delivery in Johannesburg. A 50% deposit secures your order.</p></details>
        </div>
      </div>
    </section>

    <section class="prail section">
      <div class="wrap">
        <div class="section__head section__head--row"><h2 class="display display--m" data-split>More from <em>The Parlour</em></h2><a class="link-arrow" href="${root}parlour.html">See everything →</a></div>
      </div>
      <div class="rail" data-rail data-cursor="Drag">${rail}
      </div>
      <nav class="pnext wrap" aria-label="More products">
        <a href="${prev.id}.html" class="pnext__link"><span class="mono">← Previous</span><b>${esc(prev.name)}</b></a>
        <a href="${next.id}.html" class="pnext__link pnext__link--next"><span class="mono">Next →</span><b>${esc(next.name)}</b></a>
      </nav>
    </section>`;
  write(`parlour/${p.id}.html`, page({
    body, root, page: "parlour",
    title: `${p.name} ${p.cat === "cheesecake" ? "Ice-Cream Cheesecake" : ""} | Just Moreish`.replace("  ", " "),
    description: `${p.short} ${p.line} Order on WhatsApp from Just Moreish, Johannesburg.`,
    scripts: ["assets/js/product.js"],
  }));
});
console.log("build", V);
