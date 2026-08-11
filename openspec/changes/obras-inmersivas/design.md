# Design — `obras-inmersivas`

## Architecture at a glance

```
obra.html
  └─ #detalle-obra
       ├─ #portada-obra        app.js        static hero, existing
       ├─ #hoja-tecnica        app.js        data sheet, existing
       ├─ #recorrido           recorrido.js  NEW  scroll tour + hotspots
       ├─ #comparador          recorrido.js  NEW  before/after drag
       ├─ #galeria             recorrido.js  NEW  Flip full-screen gallery
       └─ #otras-obras         app.js        related works, existing

  panorama.js  →  mounts a full-screen overlay on demand, never on load
```

Load order matters and is fixed:

```html
<script src="assets/vendor/gsap/gsap.min.js"></script>
<script src="assets/vendor/gsap/ScrollTrigger.min.js"></script>
<script src="assets/vendor/gsap/Flip.min.js"></script>
<script src="assets/js/datos.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/recorrido.js"></script>
<script src="assets/js/panorama.js"></script>
```

`recorrido.js` and `panorama.js` each begin with a capability check and return
immediately when their prerequisites are absent. Deleting their two script tags
plus the `inmersivo.css` link restores the pre-change site exactly.

## Data contract

All new fields on a work record in `datos.js` are optional.

```js
{
  // ... existing fields unchanged ...

  // Layer 1 — cinematic tour. Each entry is one scroll stage.
  recorrido: [
    {
      foto:   "assets/img/obras/reque/01-cimentacion.jpg",
      titulo: "Cimentación profunda",
      texto:  "Pilotes de 1.20 m perforados hasta el estrato resistente.",
      foco:   { x: 0.34, y: 0.62, zoom: 1.35 },   // 0..1 normalized, zoom 1..2
      hotspots: [
        { x: 0.34, y: 0.62, rotulo: "Pilote Ø 1.20 m" },
        { x: 0.71, y: 0.48, rotulo: "Encofrado metálico" }
      ]
    }
  ],

  // Drag comparator. Both images required or the block is skipped.
  antesDespues: {
    antes:   "assets/img/obras/reque/antes.jpg",
    despues: "assets/img/obras/reque/despues.jpg",
    rotuloAntes:   "Marzo 2025",
    rotuloDespues: "Agosto 2026"
  },

  // Layer 2 — 360° scenes. `saltos` reference other scenes by id.
  panorama: [
    {
      id:     "tablero",
      nombre: "Tablero del puente",
      imagen: "assets/img/obras/reque/360-tablero.jpg",
      saltos: [ { a: "estribo-sur", x: 0.18, y: 0.52, rotulo: "Estribo sur" } ]
    }
  ]
}
```

`foco` uses normalized coordinates so the same data survives any future
re-crop or resolution change. Hotspot coordinates are normalized against the
photo, not the viewport, which is what keeps them pinned while the image pans.

---

## ADR-001 — GSAP as the only animation engine

**Decision.** GSAP 3.12.5 with ScrollTrigger and Flip, vendored under
`assets/vendor/gsap/`. No second animation library.

**Rationale.** The tour is scroll-position-driven, not time-driven. That is
ScrollTrigger's exact job: `scrub` ties tween progress to scrollbar position,
and pinning holds a stage while its animation plays. Building that on raw
`IntersectionObserver` plus manual scroll math is roughly the work ScrollTrigger
already does, minus its refresh handling for late-loading images.

Flip earns its place separately: the full-screen gallery transition needs the
thumbnail to become the full-screen image with spatial continuity, which is the
FLIP technique. Hand-rolling it means measuring, cloning and reconciling two
layouts.

**Rejected — Framer Motion.** Framer Motion is a React renderer. It animates
React elements through React's reconciler; there is no way to use it without
React, and React means a bundler, which means a build step. The deploy target
is a cPanel host updated by `git pull`, and the standing constraint from the
client is plain HTML/CSS/JS. Adding React to animate a static portfolio inverts
the cost of the whole project.

Its vanilla sibling, Motion (`motion.dev`, same author, formerly Motion One),
*was* a genuine candidate: it is ~5 KB against GSAP's 140 KB because it drives
the native Web Animations API. It was rejected for one reason — its scroll
support handles progress-linked animation but not pinning, and the cinematic
tour is built on pinned, scrubbed stages. Shipping both libraries to get
Motion's size and GSAP's ScrollTrigger would mean two engines, two easing
vocabularies and more bytes than GSAP alone.

**Cost accepted.** 140 KB of vendored JavaScript, gzipped to roughly 55 KB by
the host. Budgeted against a 1.2 MB initial page ceiling.

## ADR-002 — Vendored, not CDN

**Decision.** GSAP files are committed to the repository.

**Rationale.** Deployment is `git pull` on shared hosting. A committed
dependency means the deployed tree is the tested tree. A CDN adds a
third-party runtime dependency and a privacy consideration for a public-sector
client, in exchange for a cache hit rate that is largely mythical now that
browsers partition their HTTP caches per site.

## ADR-003 — Hand-written WebGL for the panorama, not three.js

**Decision.** A single-purpose equirectangular viewer, roughly 200 lines of
WebGL, in `assets/js/panorama.js`.

**Rationale.** three.js is ~600 KB minified. The viewer needs exactly one
sphere, one texture, and mouse/touch rotation — a vertex shader, a fragment
shader and a UV sphere. Importing a general-purpose 3D engine for that is a
150× size penalty for capability that stays unused.

The `threejs` stack guidance in `ui-ux-pro-max` was consulted and applies to
scene-graph work; this is not scene-graph work.

**Cost accepted.** No scene graph, no glTF path. If the client later commits to
photogrammetry, this decision is revisited as a separate change — the viewer is
isolated behind an entry point and swappable.

## ADR-004 — Motion tier and tokens

Sourced from the `gsap` domain of `ui-ux-pro-max` (`data/motion.csv`), tier
**Complex** for the tour (row 6, scroll pin + scrub) and **Standard** for
everything else.

| Purpose | Duration | Easing | Source row |
|---|---|---|---|
| Card hover lift | 250 ms | `power2.out` | 2 — Hover, Standard |
| Section reveal | 500 ms, stagger 80 ms | `power2.out` | 5 — Scroll Reveal, Standard |
| Tour stage | scroll-scrubbed, `scrub: 1` | none | 6 — Scroll Reveal, Complex |
| Hotspot entrance | 400 ms, stagger 60 ms | `back.out(1.4)` | 8 — Stagger, Standard |
| Gallery open (Flip) | 600 ms | `expo.inOut` | 12 — Shared element |
| Panorama cross-fade | 500 ms | `power2.inOut` | 11 — Page Transition |

Constraints carried over from the same dataset: at most one pinned section per
page; `ScrollTrigger.refresh()` after images and fonts settle, because pinning
needs deterministic height; `will-change: transform` only on parallax layers and
removed once scroll settles.

## ADR-005 — Reduced motion is a complete experience, not a downgrade

**Decision.** Under `prefers-reduced-motion: reduce`, `recorrido.js` creates no
ScrollTrigger at all and renders the tour as a plain vertical gallery with every
caption and every hotspot label visible as static text beneath its photo.

**Rationale.** Scroll-hijacked, pinned, scrubbed motion is the single most
likely pattern on this site to cause discomfort. Degrading to "the same thing
but faster" would keep the problem. The information in the tour is technical
detail about the work — it must be fully readable with no motion whatsoever,
because that content is the actual product.

## ADR-006 — PHP endpoint, WhatsApp retained

**Decision.** `contacto.php` accepts a JSON POST, validates, and sends via
`mail()`. The existing WhatsApp path stays as the failure route.

**Rationale.** cPanel shared hosting provides `mail()`; it is the one backend
capability available without configuration. But shared-host mail is unreliable
in ways the site cannot detect — accepted by `mail()` and dropped by the
recipient's spam filter. Keeping WhatsApp as an explicit fallback means a lead
is never lost to a silent delivery failure.

Spam control is a honeypot field plus a minimum time-to-submit. No CAPTCHA: it
taxes every legitimate user to stop bots that a honeypot already stops at this
traffic volume.

## Performance budget

| Asset class | Budget | Enforcement |
|---|---|---|
| Tour photo | 300 KB | Documented in LEEME; verified at review |
| Panorama scene | 1.5 MB | Loaded only on user intent |
| Initial page payload | 1.2 MB | Panorama excluded until activated |
| Vendored JS | 140 KB raw | Fixed; no further libraries |
| Per-frame budget | 16 ms | Transform/opacity only; no layout properties animated |

## Accessibility commitments

- Hotspots are `<button>` elements, keyboard reachable, minimum 44 × 44 px hit
  area, with accessible names.
- The panorama overlay traps focus while open, closes on Escape, and returns
  focus to its trigger.
- The comparator handle responds to arrow keys and exposes
  `role="slider"` with `aria-valuenow`.
- Every immersive image carries a real `alt` derived from the stage title.
- Colour is never the sole carrier of state; work status badges pair colour
  with text.

## Testing strategy

| Layer | Tool | What it proves |
|---|---|---|
| DOM behavior | Node + jsdom | Renderers mount, fallbacks trigger, no throw |
| Layout | puppeteer-core + installed Chrome | No horizontal overflow at 5 breakpoints |
| Motion | puppeteer with `prefers-reduced-motion` forced | Static path is complete |
| Visual | Chrome screenshots | Design reads correctly at mobile and desktop |

GSAP does not run meaningfully under jsdom (no layout, no rAF-driven scroll), so
tour assertions run in Chrome, and jsdom covers the data-to-DOM contract and the
no-asset fallbacks.
