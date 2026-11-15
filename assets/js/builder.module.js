/* Make It Moreish — live 3D cake builder (three.js r170, procedural geometry, GSAP animation).
   Every choice rebuilds part of the cake with a little "being made" animation:
   crumbs fall and press for the base, the filling rises, toppings drop in and bounce. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const { BUILDER, SITE } = window.JM;
const core = window.JMCore;
const { $, $$ } = core;
const canvas = $("#cake3d");
const box = canvas.parentElement;
const reduce = core.reduce;
const g = window.gsap;

// ------------------------------------------------------------------ renderer & scene
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 3.5, 8.2);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.55, 0);
controls.enableDamping = true; controls.dampingFactor = 0.06;
controls.enableZoom = false; controls.enablePan = false;
controls.minPolarAngle = 0.55; controls.maxPolarAngle = 1.45;
controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.9;
controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(resumeT); });
let resumeT; controls.addEventListener("end", () => { resumeT = setTimeout(() => (controls.autoRotate = !reduce), 4000); });

const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
key.position.set(-3.5, 6, 4); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -0.0004;
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 1.2); rim.position.set(3, 3, -4); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xfff8f0, 0xd8c9b8, 0.55));

// plinth + soft contact shadow
const plinthMat = new THREE.MeshPhysicalMaterial({ color: 0xffc3cc, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3 });
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.22, 128), plinthMat);
plinth.position.y = -0.11; plinth.receiveShadow = true; scene.add(plinth);
const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.ShadowMaterial({ opacity: 0.12 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.22; floor.receiveShadow = true; scene.add(floor);

// ------------------------------------------------------------------ procedural textures
function noiseTex(size, fn) {
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d");
  const img = x.createImageData(size, size);
  for (let i = 0; i < size * size; i++) { const v = fn(i % size, (i / size) | 0); img.data.set([v[0], v[1], v[2], 255], i * 4); }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
const crumbBump = noiseTex(256, () => { const v = rnd() < 0.5 ? rnd() * 255 : rnd() * 120; return [v, v, v]; }); crumbBump.repeat.set(4, 1);
const pores = (() => { // tiny air pockets for ice-cream
  const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(0,0,0,${0.15 + rnd() * 0.5})`; x.beginPath(); x.arc(rnd() * 512, rnd() * 512, 0.6 + rnd() * 2.2, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
})();
const speckles = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(30,22,18,${0.4 + rnd() * 0.6})`; x.beginPath(); x.ellipse(rnd() * 512, rnd() * 512, 1 + rnd() * 3, 0.6 + rnd() * 2, rnd() * 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const foilBump = noiseTex(128, () => { const v = 100 + rnd() * 155; return [v, v, v]; });
const seedsTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  x.fillStyle = "#c81d3a"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) { x.fillStyle = "#f6d36b"; x.beginPath(); x.ellipse(rnd() * 256, rnd() * 256, 2.2, 1.2, rnd() * 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

// ------------------------------------------------------------------ cake parts
const cake = new THREE.Group(); scene.add(cake);
const R = 1.25;
function displacedCylinder(r, h, amp, seg = 160, hs = 12) {
  const geo = new THREE.CylinderGeometry(r, r, h, seg, hs, false);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const side = Math.abs(Math.hypot(v.x, v.z) - r) < 1e-3;
    const n = (Math.sin(v.x * 23.1 + v.y * 17.3) * Math.cos(v.z * 19.7 - v.y * 11.1) + Math.sin(v.x * 51 + v.z * 47) * 0.5) * amp;
    if (side) { const k = 1 + n / r; v.x *= k; v.z *= k; } else if (v.y > 0) v.y += n * 0.6;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}
const baseMat = new THREE.MeshStandardMaterial({ color: 0xe9c98e, roughness: 0.92, bumpMap: crumbBump, bumpScale: 3 });
const base = new THREE.Mesh(displacedCylinder(R * 1.005, 0.26, 0.012), baseMat);
base.position.y = 0.13; base.castShadow = base.receiveShadow = true; cake.add(base);

const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3e6cf, roughness: 0.58, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff), bumpMap: pores, bumpScale: 0.6, clearcoat: 0.04 });
const bodyGeo = (h) => { const g2 = new THREE.CylinderGeometry(R, R, h, 160, 8); g2.translate(0, h / 2, 0); return g2; };
const body = new THREE.Mesh(bodyGeo(0.82), bodyMat);
body.position.y = 0.26; body.castShadow = body.receiveShadow = true; cake.add(body);
// soft rounded top edge
const lip = new THREE.Mesh(new THREE.TorusGeometry(R - 0.04, 0.045, 16, 160), bodyMat);
lip.rotation.x = Math.PI / 2; cake.add(lip);
// NY baked: golden top crust
const crustMat = new THREE.MeshStandardMaterial({ color: 0xc98a45, roughness: 0.65, bumpMap: crumbBump, bumpScale: 1 });
const crust = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.025, 160), crustMat); cake.add(crust);
// ice-cream cake: piped rosettes ring
const creamMat = new THREE.MeshPhysicalMaterial({ color: 0xfbf5ec, roughness: 0.5, sheen: 0.5 });
function rosetteGeo() {
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.17 * Math.pow(1 - t, 0.9) * (0.85 + 0.15 * Math.sin(Math.min(t * 5, Math.PI / 2))), t * 0.26)); }
  const geo = new THREE.LatheGeometry(pts, 64); const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x); const k = 1 + 0.16 * (1 - v.y / 0.26) * Math.cos(8 * a + v.y * 14); v.x *= k; v.z *= k; p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo;
}
const rosettes = new THREE.Group(); cake.add(rosettes);
const rg = rosetteGeo();
for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(rg, creamMat); const a = (i / 14) * Math.PI * 2; m.position.set(Math.cos(a) * (R - 0.2), 0, Math.sin(a) * (R - 0.2)); m.rotation.y = -a; m.castShadow = true; rosettes.add(m); }
// piped message plaque
const toppings = new THREE.Group(); cake.add(toppings);

// ------------------------------------------------------------------ topping factories
const M = (o) => new THREE.MeshPhysicalMaterial(o);
const mats = {
  choc: M({ color: 0x4a2a1a, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
  gold: M({ color: 0xc9a24a, metalness: 1, roughness: 0.32, bumpMap: foilBump, bumpScale: 2 }),
  red: M({ color: 0xc9232f, metalness: 0.9, roughness: 0.3, bumpMap: foilBump, bumpScale: 2 }),
  coconut: M({ color: 0xfbf6ee, roughness: 0.95, bumpMap: crumbBump, bumpScale: 4 }),
  rolo: M({ color: 0x8a5a2e, roughness: 0.35, clearcoat: 0.5 }),
  tob: M({ color: 0xc89a55, roughness: 0.45, clearcoat: 0.3, bumpMap: crumbBump, bumpScale: 0.5 }),
  cadbury: M({ color: 0x5b3423, roughness: 0.35, clearcoat: 0.4 }),
  purple: M({ color: 0x4b1e78, roughness: 0.4, metalness: 0.4 }),
  marshP: M({ color: 0xf7bfd0, roughness: 0.8, sheen: 0.6 }), marshB: M({ color: 0xa9d3f2, roughness: 0.8, sheen: 0.6 }), marshW: M({ color: 0xfbf7f2, roughness: 0.8, sheen: 0.6 }),
  oreo: M({ color: 0x2b211d, roughness: 0.75, bumpMap: crumbBump, bumpScale: 1 }), oreoCream: M({ color: 0xf8f4ee, roughness: 0.6 }),
  berry: M({ map: seedsTex, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.08 }),
  leaf: M({ color: 0x4f8a33, roughness: 0.5, side: THREE.DoubleSide }),
};
const geos = {
  ball: new THREE.SphereGeometry(0.16, 40, 24), bigball: new THREE.SphereGeometry(0.19, 40, 24),
  rolo: (() => { const g2 = new THREE.CylinderGeometry(0.13, 0.15, 0.15, 40); return g2; })(),
  tri: (() => { const s = new THREE.Shape(); s.moveTo(-0.13, 0); s.lineTo(0.13, 0); s.lineTo(0, 0.2); s.closePath(); const g2 = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 }); g2.translate(0, 0, -0.11); return g2; })(),
  bar: new THREE.BoxGeometry(0.28, 0.07, 0.2, 2, 1, 2),
  marsh: new THREE.CylinderGeometry(0.1, 0.1, 0.18, 32),
  oreo: new THREE.CylinderGeometry(0.2, 0.2, 0.06, 48), oreoC: new THREE.CylinderGeometry(0.185, 0.185, 0.04, 48),
  berry: (() => { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(0.15 * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.3 * t), t * 0.3)); } return new THREE.LatheGeometry(pts, 32); })(),
  leaf: new THREE.ConeGeometry(0.09, 0.05, 6, 1, true),
};
function makeTopping(name) {
  const grp = new THREE.Group(); const add = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; grp.add(m); return m; };
  switch (name) {
    case "Fresh Strawberries": { const b = add(geos.berry, mats.berry); b.rotation.x = Math.PI; b.position.y = 0.3; const l = add(geos.leaf, mats.leaf, 0.3); grp.rotation.z = 0.5; break; }
    case "Ferrero Rocher": add(geos.bigball, mats.gold, 0.18); break;
    case "Raffaello": add(geos.ball, mats.coconut, 0.15); break;
    case "Rolo": add(geos.rolo, mats.rolo, 0.075); break;
    case "Lindt": add(geos.ball, mats.red, 0.15); break;
    case "Toblerone": { const t = add(geos.tri, mats.tob, 0); t.rotation.y = Math.PI / 2; break; }
    case "Whispers": add(geos.ball, mats.choc, 0.15); break;
    case "Cadbury": { const b = add(geos.bar, mats.cadbury, 0.05); b.rotation.z = 0.25; break; }
    case "Marshmallow": { const m = add(geos.marsh, [mats.marshP, mats.marshB, mats.marshW][(rnd() * 3) | 0], 0.1); m.rotation.z = Math.PI / 2; break; }
    case "Oreo": { add(geos.oreo, mats.oreo, 0.03); add(geos.oreoC, mats.oreoCream, 0.08); add(geos.oreo, mats.oreo, 0.13); grp.rotation.x = 0.9; break; }
  }
  return grp;
}

// ------------------------------------------------------------------ state + build steps
const state = { type: BUILDER.types[0], base: BUILDER.bases[0].name, flavour: BUILDER.flavours[0].name, toppings: [], size: BUILDER.sizes[0] };
const dur = reduce ? 0 : 1;
const heights = { "Ice-Cream Cheesecake": 0.82, "New York Baked Cheesecake": 0.7, "Ice-Cream Cake": 1.05 };
let topY = 0.26 + heights[state.type];
function placeTop() { lip.position.y = topY - 0.02; crust.position.y = topY + 0.008; rosettes.position.y = topY; toppings.position.y = topY; }

function crumbs(colour) { // little particles fall and settle when the base changes
  if (reduce) return;
  const geo = new THREE.IcosahedronGeometry(0.035, 0); const mat = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.9 });
  for (let i = 0; i < 46; i++) {
    const m = new THREE.Mesh(geo, mat); const a = rnd() * Math.PI * 2, r = rnd() * R;
    m.position.set(Math.cos(a) * r, 2.2 + rnd() * 1.4, Math.sin(a) * r); m.scale.setScalar(0.6 + rnd() * 1.2); scene.add(m);
    g.to(m.position, { y: 0.28, duration: 0.7 + rnd() * 0.5, ease: "bounce.out", delay: rnd() * 0.3 });
    g.to(m.scale, { x: 0, y: 0, z: 0, duration: 0.4, delay: 1.2 + rnd() * 0.4, onComplete: () => { scene.remove(m); } });
  }
}
function setBase(name, first) {
  const b = BUILDER.bases.find((x) => x.name === name);
  crumbs(b.colour);
  g.to(baseMat.color, { ...hex(b.colour), duration: 0.6 * dur, delay: first ? 0 : 0.5 * dur });
  g.fromTo(base.scale, { y: 0.05 }, { y: 1, duration: 0.9 * dur, ease: "elastic.out(1,0.45)", delay: 0.6 * dur });
  bump(0.95);
}
function setFlavour(name) {
  const f = BUILDER.flavours.find((x) => x.name === name);
  bodyMat.map = f.speckle ? speckles : null; bodyMat.needsUpdate = true;
  g.to(bodyMat.color, { ...hex(f.colour), duration: 0.8 * dur });
  // the filling "pours": rises from the base with a wobble
  g.fromTo(body.scale, { y: 0.02 }, { y: 1, duration: 1.1 * dur, ease: "elastic.out(1,0.5)" });
  g.fromTo([lip.position, crust.position, rosettes.position, toppings.position], { y: 0.3 }, { y: (i) => [topY - 0.02, topY + 0.008, topY, topY][i], duration: 1.1 * dur, ease: "elastic.out(1,0.5)" });
}
function setType(name) {
  const h = heights[name]; topY = 0.26 + h;
  body.geometry.dispose(); body.geometry = bodyGeo(h);
  const ny = name.startsWith("New York"), ic = name === "Ice-Cream Cake";
  crust.visible = ny; rosettes.visible = ic;
  bodyMat.roughness = ny ? 0.75 : 0.58; bodyMat.sheen = ny ? 0.1 : 0.4; bodyMat.bumpScale = ny ? 0.25 : 0.6;
  placeTop();
  g.fromTo(body.scale, { y: 0.6 }, { y: 1, duration: 0.9 * dur, ease: "elastic.out(1,0.5)" });
  if (ic) rosettes.children.forEach((r, i) => g.fromTo(r.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 0.6 * dur, delay: i * 0.05 * dur, ease: "back.out(3)" }));
  if (ny) g.fromTo(crust.scale, { x: 0.2, z: 0.2 }, { x: 1, z: 1, duration: 0.8 * dur, ease: "expo.out" });
  layoutToppings(false);
}
const SPOTS = (n) => { // ring + centre placements on the top
  const out = []; const ring = Math.min(n, 9);
  for (let i = 0; i < ring; i++) { const a = (i / ring) * Math.PI * 2 + 0.3; out.push([Math.cos(a) * (R - 0.42), Math.sin(a) * (R - 0.42)]); }
  for (let i = ring; i < n; i++) { const a = (i / Math.max(1, n - ring)) * Math.PI * 2; out.push([Math.cos(a) * 0.35, Math.sin(a) * 0.35]); }
  return out;
};
function layoutToppings(animate = true, fresh = []) {
  // 12 pieces shared out between the chosen toppings
  const sel = state.toppings; const total = sel.length ? 12 : 0;
  const wanted = []; for (let i = 0; i < total; i++) wanted.push(sel[i % sel.length]);
  const spots = SPOTS(total);
  const keep = [];
  toppings.children.slice().forEach((m) => { if (!sel.includes(m.userData.name)) { g.to(m.scale, { x: 0, y: 0, z: 0, duration: 0.35 * dur, ease: "back.in(2)", onComplete: () => toppings.remove(m) }); } else keep.push(m); });
  const pool = {}; keep.forEach((m) => (pool[m.userData.name] = pool[m.userData.name] || []).push(m));
  wanted.forEach((name, i) => {
    let m = pool[name]?.shift(); const isNew = !m;
    if (isNew) { m = makeTopping(name); m.userData.name = name; m.rotation.y = rnd() * Math.PI * 2; toppings.add(m); }
    const [x, z] = spots[i];
    if (isNew && animate) {
      m.position.set(x, 3.2 + rnd(), z);
      g.to(m.position, { y: 0, duration: 0.9 * dur + rnd() * 0.3, ease: "bounce.out", delay: (i % 6) * 0.06 * dur });
      g.fromTo(m.rotation, { x: rnd() * 2 }, { x: m.rotation.x, duration: 0.9 * dur });
    } else { g.to(m.position, { x, z, y: 0, duration: 0.6 * dur, ease: "power3.out" }); }
  });
  pool && Object.values(pool).flat().forEach((m) => g.to(m.scale, { x: 0, y: 0, z: 0, duration: 0.3, onComplete: () => toppings.remove(m) }));
}
function setSize(s) { const k = s.startsWith("25") ? 1.12 : 1; g.to(cake.scale, { x: k, y: k, z: k, duration: 0.9 * dur, ease: "elastic.out(1,0.5)" }); }
function bump(k) { g.fromTo(cake.scale, { y: cake.scale.x * k }, { y: cake.scale.x, duration: 0.7 * dur, ease: "elastic.out(1,0.4)" }); }
function hex(h) { const c = new THREE.Color(h); return { r: c.r, g: c.g, b: c.b }; }

// ------------------------------------------------------------------ UI wiring
const summary = $("[data-b-summary]"), sendBtn = $("[data-b-send]"), countEl = $("[data-b-count]");
const msgIn = $("[data-b-message]"), dateIn = $("[data-b-date]");
dateIn.min = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
function message() {
  return [`Hi Just Moreish! I'd like a quote for a custom cake:`, `• Type: ${state.type}`, `• Base: ${state.base}`, `• Flavour: ${state.flavour}`,
    `• Toppings: ${state.toppings.length ? state.toppings.join(", ") : "none"}`, `• Size: ${state.size}`,
    msgIn.value.trim() ? `• Message on cake: "${msgIn.value.trim()}"` : "", dateIn.value ? `• Needed: ${dateIn.value}` : "", "", "(Designed on the Make It Moreish builder)"].filter(Boolean).join("\n");
}
function refresh() {
  summary.innerHTML = [state.type, state.base + " base", state.flavour, ...state.toppings, state.size].map((t) => `<span>${t}</span>`).join("");
  sendBtn.href = core.wa(message());
  countEl.textContent = `${state.toppings.length} of 4`;
  $$('[data-b-group="toppings"] input').forEach((i) => (i.disabled = !i.checked && state.toppings.length >= 4));
}
$$("[data-b-group]").forEach((grp) => grp.addEventListener("change", (e) => {
  const k = grp.dataset.bGroup, v = e.target.value;
  if (k === "toppings") {
    state.toppings = $$("input:checked", grp).map((i) => i.value); layoutToppings(true);
  } else {
    state[k] = v;
    ({ type: setType, base: setBase, flavour: setFlavour, size: setSize })[k](v);
  }
  refresh();
}));
msgIn.addEventListener("input", refresh); dateIn.addEventListener("change", refresh);
$("[data-b-add]").addEventListener("click", () => core.cart.add({ id: "custom", name: `Custom ${state.type} (${state.size})`, price: 0, qty: 1, custom: true,
  opt: `${state.base} base · ${state.flavour}${state.toppings.length ? " · " + state.toppings.join(", ") : ""}`, img: `${core.R}img/products/big.webp` }));
function pick(groupName, value) { const i = $(`[data-b-group="${groupName}"] input[value="${CSS.escape(value)}"]`); if (i) { i.checked = true; i.dispatchEvent(new Event("change", { bubbles: true })); } }
$("[data-b-surprise]").addEventListener("click", () => {
  const r = (a) => a[(Math.random() * a.length) | 0];
  pick("type", r(BUILDER.types)); setTimeout(() => pick("base", r(BUILDER.bases).name), 250); setTimeout(() => pick("flavour", r(BUILDER.flavours).name), 600);
  setTimeout(() => { $$('[data-b-group="toppings"] input').forEach((i) => (i.checked = false)); const t = [...BUILDER.toppings].sort(() => Math.random() - 0.5).slice(0, 2 + ((Math.random() * 2) | 0));
    t.forEach((x) => ($(`[data-b-group="toppings"] input[value="${CSS.escape(x.name)}"]`).checked = true)); $('[data-b-group="toppings"]').dispatchEvent(new Event("change", { bubbles: true })); }, 1000);
});
$("[data-b-reset]").addEventListener("click", () => { pick("type", BUILDER.types[0]); pick("base", BUILDER.bases[0].name); pick("flavour", BUILDER.flavours[0].name);
  $$('[data-b-group="toppings"] input').forEach((i) => (i.checked = false)); $('[data-b-group="toppings"]').dispatchEvent(new Event("change", { bubbles: true })); pick("size", BUILDER.sizes[0]); });

// ------------------------------------------------------------------ loop
function resize() { const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.9 ? 38 : 30; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(box); resize();
let visible = true;
new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);
renderer.setAnimationLoop(() => { if (!visible) return; controls.update(); renderer.render(scene, camera); });

// first build: the whole cake assembles itself
setType(state.type); placeTop();
crust.visible = false; rosettes.visible = false;
g.set(body.scale, { y: 0.02 }); g.set(base.scale, { y: 0.02 });
const startBuild = () => { setBase(state.base, true); setTimeout(() => setFlavour(state.flavour), 700 * dur); setTimeout(() => { state.toppings = ["Fresh Strawberries"];
  $(`[data-b-group="toppings"] input[value="Fresh Strawberries"]`).checked = true; layoutToppings(true); refresh(); }, 1500 * dur); };
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { startBuild(); o.disconnect(); } }, { threshold: 0.35 }).observe(box);
refresh();
