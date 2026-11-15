/* Ask Moreish — an in-browser dessert assistant (no API, no cost).
   Intent matching over a small knowledge base built from the site data, fuzzy product names,
   typing indicator and action buttons (open a page, add to box, continue on WhatsApp).
   To upgrade to a real LLM later, replace `answer()` with a call to your own server endpoint. */
(() => {
  const { SITE, PRODUCTS, BUILDER, COFFEE_MENU, SHAKES, STATIONS } = window.JM;
  const R = window.JM_ROOT || "";
  const core = () => window.JMCore;
  const root = document.documentElement;
  const panel = document.getElementById("chat");
  if (!panel) return;
  const log = panel.querySelector("[data-chat-log]");
  const form = panel.querySelector("[data-chat-form]");
  const input = form.querySelector("input");
  const chipsEl = panel.querySelector("[data-chat-chips]");
  const toggles = document.querySelectorAll("[data-chat-toggle]");
  const fab = document.querySelector(".chat-fab");
  const rand = (n) => "R" + n;
  const page = (p) => `${R}${p}`;
  const waLink = (msg) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const has = (words, list) => list.some((k) => k.includes(" ") ? words.join(" ").includes(k) : words.some((w) => w === k || (k.length > 4 && lev(w, k) <= 1) || (k.length > 3 && w.startsWith(k))));

  const productAliases = {
    original: ["original", "vanilla", "classic", "meringue"], coffee: ["coffee cheesecake", "mocha"], caramel: ["caramel"],
    bubblegum: ["bubblegum", "bubble gum", "gumball", "blue"], marshmallow: ["marshmallow", "mallow"], rose: ["rose", "floral"],
    nutella: ["nutella", "hazelnut", "chocolate cheesecake"], gelato: ["gelato", "tub", "litre", "liter", "pistachio", "kinderjoy", "kinder"],
    beans: ["beans", "bean", "250g", "1kg", "kilo", "grind", "arabica"], croissant: ["croissant", "croissants", "pastry", "lotus croissant"],
  };
  function findProduct(words) {
    let best = null, score = 0;
    for (const p of PRODUCTS) {
      const keys = productAliases[p.id] || [p.id];
      const s = keys.reduce((a, k) => a + (has(words, [k]) ? (k.includes(" ") ? 3 : 2) : 0), 0);
      if (s > score) { score = s; best = p; }
    }
    return score >= 2 ? best : null;
  }

  const INTENTS = [
    { id: "hello", w: ["hi", "hello", "hey", "salaam", "salam", "howzit", "morning", "afternoon", "evening", "aslm"] },
    { id: "thanks", w: ["thanks", "thank", "shot", "appreciate", "cheers", "awesome", "great", "perfect"] },
    { id: "flavours", w: ["flavour", "flavor", "flavours", "menu", "options", "range", "what do you sell", "what do you have", "cheesecakes", "selection", "sell"] },
    { id: "price", w: ["price", "prices", "cost", "how much", "rand", "expensive", "cheap", "quote", "pricing"] },
    { id: "order", w: ["order", "buy", "purchase", "checkout", "cart", "box", "how do i", "pay", "payment", "deposit", "eft", "card"] },
    { id: "delivery", w: ["deliver", "delivery", "collect", "collection", "pickup", "pick up", "courier", "area", "where are you", "location", "address", "fourways", "johannesburg", "joburg", "pretoria"] },
    { id: "events", w: ["event", "events", "wedding", "weddings", "eid", "corporate", "party", "station", "stations", "function", "catering", "cater", "market", "markets", "guests", "dessert table"] },
    { id: "custom", w: ["custom", "build", "design", "make my own", "own cake", "cake", "cakes", "22cm", "25cm", "size", "big cake", "new york", "baked", "ice cream cake", "toppings", "topping", "base"] },
    { id: "coffee", w: ["coffee", "cappuccino", "latte", "espresso", "chai", "hot chocolate", "tea", "freezo", "frappe", "drinks", "drink"] },
    { id: "shakes", w: ["shake", "shakes", "milkshake", "milkshakes", "thick shake", "smoothie"] },
    { id: "allergens", w: ["allergy", "allergies", "allergen", "nuts", "nut", "gluten", "dairy", "lactose", "vegan", "egg", "halaal", "halal", "kosher", "sugar"] },
    { id: "storage", w: ["freeze", "frozen", "freezer", "store", "storage", "melt", "thaw", "how long", "keep", "shelf life", "serve"] },
    { id: "contact", w: ["contact", "phone", "call", "number", "email", "whatsapp", "instagram", "insta", "human", "person", "talk", "speak"] },
    { id: "hours", w: ["hours", "open", "opening", "close", "closing", "today", "tomorrow", "weekend", "when"] },
    { id: "about", w: ["who", "about", "story", "owner", "since", "history", "moreish"] },
    { id: "bye", w: ["bye", "goodbye", "later", "cya", "see you"] },
  ];

  function answer(text) {
    const words = norm(text).split(" ").filter(Boolean);
    const p = findProduct(words);
    const scores = INTENTS.map((it) => ({ id: it.id, s: it.w.reduce((a, k) => a + (has(words, [k]) ? (k.includes(" ") ? 2 : 1) : 0), 0) }))
      .sort((a, b) => b.s - a.s);
    const top = scores[0].s ? scores[0].id : null;

    if (p && (!top || ["price", "flavours", "order", "custom", "coffee"].includes(top) || scores[0].s < 2)) {
      const price = p.options?.prices ? p.options.prices.map((v, i) => `${p.options.values[i]} ${rand(v)}`).join(" · ") : `${rand(p.price)} ${p.unit ? "per " + p.unit : "each"}`;
      return {
        html: `<b>${esc(p.name)}</b>: ${esc(p.short)} ${esc(p.line)}<br><span class="mono">Guide price: ${price}</span>${p.options && !p.options.prices ? `<br>Choose: ${p.options.values.join(", ")}.` : ""}`,
        actions: [{ label: "See it in 3D", href: page(`parlour/${p.id}.html`) }, { label: "Add to box", add: p.id }, { label: "Order on WhatsApp", wa: `Hi Just Moreish! I'd like to order the ${p.name}.` }],
      };
    }
    switch (top) {
      case "hello": return { html: `Hi! 👋 I'm Ask Moreish. I know every flavour, how ordering works, our live stations and coffee. What are you craving?`, chips: true };
      case "thanks": return { html: `Pleasure! Anything else? Otherwise your box is waiting at the top right 🍰` };
      case "bye": return { html: `Bye for now. Stay frozen 🧊` };
      case "flavours": {
        const cakes = PRODUCTS.filter((x) => x.cat === "cheesecake");
        return {
          html: `Our ice-cream cheesecakes come in <b>${cakes.length} flavours</b>: ${cakes.map((c) => `<a href="${page(`parlour/${c.id}.html`)}">${c.name}</a>`).join(", ")}. Also 1 L gelato tubs, gourmet croissants and our own coffee beans.`,
          actions: [{ label: "Open The Parlour", href: page("parlour.html") }, { label: "Make your own cake", href: page("make-it-moreish.html") }],
        };
      }
      case "price": return {
        html: `Guide prices: ice-cream cheesecakes from <b>R55</b> each, croissants <b>R45</b>, 1 L gelato <b>R185</b>, coffee beans <b>R125 (250 g)</b> or <b>R420 (1 kg)</b>. Custom cakes and live stations are quoted. Send your order and we'll confirm the final price.`,
        actions: [{ label: "Browse The Parlour", href: page("parlour.html") }, { label: "Ask for a quote", wa: "Hi Just Moreish! Could I get a quote please?" }],
      };
      case "order": return {
        html: `Easy: add things to <b>your box</b> (top right), choose collect or deliver and a date, then tap <b>Send order on WhatsApp</b>. We reply with a quote. A <b>50% deposit</b> (or full payment) secures your order, and the balance is paid by EFT before collection or delivery.`,
        actions: [{ label: "Open my box", cart: true }, { label: "Order on WhatsApp", wa: "Hi Just Moreish! I'd like to place an order." }],
      };
      case "delivery": return {
        html: `We're based in <b>Johannesburg</b>. You can collect, or we can arrange delivery: tell us your area and date in your WhatsApp order. You'll also find us at markets and events, so ask where we'll be this week!`,
        actions: [{ label: "Ask about delivery", wa: "Hi Just Moreish! Do you deliver to my area?" }],
      };
      case "events": return {
        html: `We bring the dessert bar to you: ${STATIONS.map((s) => s.name.toLowerCase()).join(", ")}. Weddings, Eid, corporate events and markets. Click around our <b>Live Station</b> page to see the menu, then send a quick enquiry.`,
        actions: [{ label: "Explore Live Stations", href: page("live-stations.html") }, { label: "Get an event quote", wa: "Hi Just Moreish! I'd like a quote for an event." }],
      };
      case "custom": return {
        html: `Design your own in <b>Make It Moreish</b>: pick a type (ice-cream cheesecake, NY baked or ice-cream cake), a base (${BUILDER.bases.map((b) => b.name).join(", ")}), a flavour, toppings and a size (22 or 25 cm), and watch it build live in 3D. Then send it to us for a quote.`,
        actions: [{ label: "Start building", href: page("make-it-moreish.html") }],
      };
      case "coffee": return {
        html: `Our coffee bar pours ${COFFEE_MENU.map((c) => c.name).join(", ")}. Take our <b>100% Arabica</b> home too, in <b>250 g or 1 kg</b> bags (notes of milk chocolate, almond and apple).`,
        actions: [{ label: "Coffee & Shakes", href: page("coffee.html") }, { label: "Buy beans", href: page("parlour/beans.html") }],
      };
      case "shakes": return {
        html: `Yes, thick shakes! Flavours like ${SHAKES.slice(0, 4).map((s) => s.name).join(", ")} and more, plus frappés and coffee freezos. Find them at our live stations and markets.`,
        actions: [{ label: "See shakes", href: page("coffee.html#shakes") }, { label: "Book a shake station", wa: "Hi Just Moreish! I'd like milkshakes at my event." }],
      };
      case "allergens": return {
        html: `Our desserts contain <b>dairy, gluten and egg</b>, and <b>may contain traces of nuts</b>. For specific dietary needs or certification questions, please check with us directly before ordering. We're happy to help.`,
        actions: [{ label: "Ask us on WhatsApp", wa: "Hi Just Moreish! I have a dietary question." }],
      };
      case "storage": return { html: `Keep everything <b>frozen</b> until serving. Let a cheesecake stand for <b>3–5 minutes</b> for the perfect spoon. Once collected or delivered it's in your hands, so straight into the freezer! 🧊` };
      case "contact": return {
        html: `WhatsApp or call <b>${SITE.whatsappDisplay}</b>, email <a href="mailto:${SITE.email}">${SITE.email}</a>, or find us on Instagram <a href="${SITE.instagram}" target="_blank" rel="noopener">${SITE.handle}</a>.`,
        actions: [{ label: "WhatsApp us", wa: "Hi Just Moreish!" }, { label: "Contact page", href: page("contact.html") }],
      };
      case "hours": return { html: `We work mostly to order and at events, so times change week to week. Message us and we'll tell you when your order can be ready, or where we'll be.`, actions: [{ label: "Ask on WhatsApp", wa: "Hi Just Moreish! When can I collect an order?" }] };
      case "about": return { html: `Just Moreish is the <b>home of the ice-cream cheesecake</b>: half ice-cream, half cheesecake, handmade in Johannesburg. It started as a coffee bar at Fourways Crossing and now brings live stations to events across the city.`, actions: [{ label: "Our story", href: page("about.html") }] };
    }
    return {
      html: `Hmm, I'm not sure about that one. I'm best at flavours, prices, ordering, events, custom cakes, coffee and shakes. Or chat to a real person on WhatsApp.`,
      actions: [{ label: "Chat to a person", wa: `Hi Just Moreish! ${text}` }], chips: true,
    };
  }

  const CHIPS = ["Flavours", "How do I order?", "Prices", "Live stations", "Custom cakes", "Coffee", "Milkshakes", "Allergens"];
  function renderChips() { chipsEl.innerHTML = CHIPS.map((c) => `<button type="button">${c}</button>`).join(""); }
  chipsEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) send(b.textContent); });

  function bubble(html, who, actions) {
    const m = document.createElement("div"); m.className = `msg msg--${who}`; m.innerHTML = html;
    if (actions && actions.length) {
      const a = document.createElement("div"); a.className = "msg__actions";
      actions.forEach((x) => {
        let el;
        if (x.href) { el = document.createElement("a"); el.href = x.href; }
        else if (x.wa) { el = document.createElement("a"); el.href = waLink(x.wa); el.target = "_blank"; el.rel = "noopener"; }
        else { el = document.createElement("button"); el.type = "button"; el.addEventListener("click", () => {
          if (x.cart) { closeChat(); core()?.cart.open(); }
          if (x.add) { const p = PRODUCTS.find((q) => q.id === x.add); core()?.cart.add({ id: p.id, name: p.name + (p.cat === "cheesecake" ? " ice-cream cheesecake" : ""), price: p.options?.prices ? p.options.prices[0] : p.price, qty: 1, opt: p.options ? p.options.values[0] : "" }); }
        }); }
        el.textContent = x.label; a.appendChild(el);
      });
      m.appendChild(a);
    }
    log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }
  let busy = false;
  function send(text) {
    text = text.trim(); if (!text || busy) return;
    bubble(esc(text), "me"); input.value = ""; busy = true;
    const typing = document.createElement("div"); typing.className = "msg msg--bot msg--typing"; typing.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(typing); log.scrollTop = log.scrollHeight;
    const res = answer(text);
    setTimeout(() => { typing.remove(); bubble(res.html, "bot", res.actions); busy = false; }, 450 + Math.min(900, res.html.length * 3));
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });

  let greeted = false;
  function openChat() {
    root.classList.add("chat-open"); panel.setAttribute("aria-hidden", "false"); toggles.forEach((t) => t.setAttribute("aria-expanded", "true"));
    if (!greeted) { greeted = true; renderChips(); bubble(`Hi! I'm <b>Ask Moreish</b> 🍰 Ask me about flavours, prices, ordering, live stations, custom cakes, coffee or shakes.`, "bot"); }
    setTimeout(() => input.focus(), 350);
  }
  function closeChat() { root.classList.remove("chat-open"); panel.setAttribute("aria-hidden", "true"); toggles.forEach((t) => t.setAttribute("aria-expanded", "false")); fab?.focus({ preventScroll: true }); }
  toggles.forEach((t) => t.addEventListener("click", () => (root.classList.contains("chat-open") ? closeChat() : openChat())));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("chat-open")) closeChat(); });
  // stop the page smooth-scroll from hijacking the chat log
  log.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
  window.JMChat = { open: openChat, close: closeChat, send };
})();
