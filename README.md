# Just Moreish: multi-page 3D concept site

A static, animated, multi-page pitch site for **Just Moreish** (@justmoreish), "Home of the Ice-Cream Cheesecake", Johannesburg.
All 3D is rendered in Blender (Cycles, free) or drawn live in the browser with three.js. No paid services, no build tools beyond Node's built-ins.

## Pages

| Page | File | What's special |
|---|---|---|
| Home | `index.html` | Scroll-scrubbed 3D film (cheesecake comes apart → macro → line-up), velocity marquee, **Why choose Just Moreish** bento with counters, pinned horizontal flavour gallery, teasers |
| The Parlour (store) | `parlour.html` | Filterable product grid (FLIP animation), quick-add, custom-cake card |
| Product pages ×10 | `parlour/*.html` | Each product has its own **scroll-zoom 3D story** (wide → topping macro → ice-cream → base → hero) with chapter rail, then options, quantity, box-of-4/6/12, add to box, order on WhatsApp |
| Make It Moreish | `make-it-moreish.html` | **Live real-time 3D cake builder** (three.js): their real Build-Your-Own options (type, base, flavour, toppings, 22/25 cm); the cake builds itself as you choose; drag to spin; sends a quote request to WhatsApp |
| Coffee & Shakes | `coffee.html` | Scroll-zoom takeaway-cup story with steam, menu board, animated milkshake glasses (fill, cream, straw), beans 250 g / 1 kg |
| Live Stations | `live-stations.html` | **Interactive pre-rendered kiosk** modelled on their Fourways Crossing kiosk: camera glides in, tap hotspots (menu board, coffee machine, gelato, croissants, cheesecakes) → the camera flies in and the menu pops up; stacked station cards; event enquiry form → WhatsApp |
| About | `about.html` | Scroll-drawn timeline, values |
| Contact | `contact.html` | Channels, message form → WhatsApp, FAQ |
| Privacy / Terms | `privacy.html`, `terms.html` | POPIA privacy policy + terms based on their "Nitty Gritty" (**drafts for the client to review**) |
| 404 | `404.html` | "This page melted" |

**Everywhere:** stripe page-transition curtain (with a first-visit logo animation), dark mode toggle (circular reveal), Lenis smooth scroll, custom cursor + magnetic buttons, scroll progress bar, SplitText headline reveals, the **box** (cart, saved in the browser) that sends an itemised order to WhatsApp, a WhatsApp order button in the nav, and **Ask Moreish**, an AI-style chat assistant.

### About "Ask Moreish"
It runs entirely in the browser (free, private, instant): intent matching + fuzzy product names over the site's own data, with buttons to open pages, add to the box or continue on WhatsApp. To upgrade it to a real LLM later, replace `answer()` in `assets/js/chat.js` with a call to your own serverless endpoint (never put an API key in the browser).

## Project layout

```
src/partials/        head, header (nav + mobile menu), footer, overlays (curtain, cart, chat), scripts
src/pages/           one file per page (JSON meta comment at the top)
assets/js/data.js    ALL business data: products, prices, builder options, coffee/shake menus, stations
assets/js/*.js       core (shared), sequence (frame engine), chat, home, product, parlour, station, coffee, builder.module.js
assets/css/site.css  the whole design system (light + dark tokens)
tools/build.mjs      assembles pages + generates the 10 product pages  →  node tools/build.mjs
frames/              WebP frame sequences (desktop, mobile, products/<id>, station/<shot>)
img/                 product stills, station overview, share image, favicon
blender/             every Blender script (scene, products, croissant, station), render queues, HDRI, fonts, textures
brand/               brand notes, Instagram references, test renders, walkthrough videos
_v1/                 the first single-page version (kept for reference)
```

Edit text/prices in `assets/js/data.js` or `src/pages/*.html`, then run `node tools/build.mjs`.

## Run locally

```bash
cd ~/PIXEL\ CODE/Moreish && python3 -m http.server 8765
```
Open http://localhost:8765 (frames won't load from `file://`).

## Deploy

**Vercel (recommended):** `vercel` then `vercel --prod` from this folder (static, no build step, output `.`). `.vercelignore` already excludes `blender/`, `brand/`, `src/`, `tools/`, `_v1/` and the old v1 `css/` and `js/` folders.

**WordPress / Elementor:** host this folder on a subdomain or subfolder (e.g. `public_html/3d/`) and link to it, or embed a page full-width with
`<iframe src="/3d/" style="width:100%;height:100vh;border:0"></iframe>`. It uses its own smooth scroll, so it is best as its own page rather than pasted into a theme.

## Re-rendering

```bash
cd blender
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b --factory-startup -P build_scene.py                      # products scene → moreish.blend
./render_all.sh                                                # home film (desktop + mobile)
./render_products.sh                                           # 10 product scroll-zoom sequences
$B -b --factory-startup -P station.py -- build                 # live-station kiosk → station.blend
./render_queue2.sh                                             # croissant + station films + hotspot positions
./to_webp.sh 82                                                # home film PNG → WebP
```

## Weight

Home film: about 2.9 MB desktop / 2.4 MB mobile. Each product story: about 1.5–2.5 MB (72 square frames, loaded progressively).
Station films: about 6–9 MB in total, loaded on demand (the intro first, then each flight when you hover a hotspot).

## To confirm with the client before going live
- **Prices are placeholders** (`assumed: true` in `data.js`): cheesecakes R55, croissants R45, gelato R185, beans R125 / R420.
- **Milkshake flavours are placeholders.** The coffee menu, Build-Your-Own options, sizes and deposit terms come from their Instagram.
- Some product descriptions are written by us (e.g. tasting language). The real logo file (SVG) and real photography can replace the type wordmark and renders.
- The top sign on the 3D kiosk says "ICE-CREAM · COFFEE · CROISSANTS" (the real sign says "SANDWICHES").
- Privacy Policy and Terms are drafts and need the client's (ideally a lawyer's) review.
- `og:image` needs an absolute URL once a domain is chosen.
