# Tasks — `obras-inmersivas`

**Todas las fases aplicadas y verificadas el 2026-08-11.** Ver `verify-report.md`.

## Phase 1 — Brand and foundation

- [x] 1.1 Replace placeholder identity in `datos.js` with CESCHGROUP
- [x] 1.2 Update `<title>`, `meta description` and Open Graph on all 7 pages
- [x] 1.3 Vendor GSAP 3.12.5 (`gsap`, `ScrollTrigger`, `Flip`) under `assets/vendor/gsap/`
- [x] 1.4 Create `assets/css/inmersivo.css` and wire it after `estilos.css`
- [x] 1.5 Add example immersive data to two works in `datos.js`

## Phase 2 — Cinematic tour (Layer 1)

- [x] 2.1 Add `#recorrido` mount point to `obra.html`
- [x] 2.2 `recorrido.js`: capability guard, reduced-motion branch, stage renderer
- [x] 2.3 Pinned, scrubbed pan/zoom toward `foco` per stage
- [x] 2.4 Hotspot layer: normalized anchoring, staggered reveal, keyboard support
- [x] 2.5 `ScrollTrigger.refresh()` after images settle
- [x] 2.6 Static gallery fallback under `prefers-reduced-motion`

## Phase 3 — Comparator and gallery

- [x] 3.1 Before/after comparator: pointer, touch and keyboard, `role="slider"`
- [x] 3.2 Skip comparator when either image fails to load
- [x] 3.3 Full-screen gallery with Flip shared-element transition
- [x] 3.4 Gallery focus trap, Escape to close, focus restored to trigger

## Phase 4 — 360° panorama (Layer 2)

- [x] 4.1 `panorama.js`: WebGL context probe and graceful refusal
- [x] 4.2 UV sphere, equirectangular shader pair, texture upload
- [x] 4.3 Drag / swipe / arrow-key rotation with pitch clamping
- [x] 4.4 Lazy texture load on activation, with loading state
- [x] 4.5 Jump points between scenes with cross-fade
- [x] 4.6 Overlay chrome: scene name, close control, focus trap
- [x] 4.7 Stop the render loop on close and on tab hide

## Phase 5 — PHP backend

- [x] 5.1 `contacto.php`: JSON POST, server-side validation, field-level errors
- [x] 5.2 Honeypot and minimum time-to-submit
- [x] 5.3 Wire `app.js` `formulario()` to POST, keep WhatsApp as failure route
- [x] 5.4 Preserve entered data when delivery fails

## Phase 6 — cPanel deployment

- [x] 6.1 `.gitignore`
- [x] 6.2 `.htaccess`: compression, cache headers, security headers, HTTPS
- [x] 6.3 Deployment section in `LEEME.md` covering the git → cPanel flow

## Phase 7 — Verification

- [x] 7.1 jsdom suite: renderers, fallbacks, no-asset paths
- [x] 7.2 Chrome suite: overflow and console errors at 360/390/768/1024/1440
- [x] 7.3 Reduced-motion pass: all content reachable and static
- [x] 7.4 Visual pass: mobile and desktop screenshots reviewed
- [x] 7.5 Rollback drill: remove the new tags, confirm the site still works

## Review workload forecast

| Metric | Value |
|---|---|
| Estimated changed lines | ~1,900 (excluding vendored GSAP) |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Decision needed before apply | Yes |

Suggested slices, each independently deployable:

1. Phases 1 + 6 — brand, foundation, deployment assets
2. Phase 2 — cinematic tour
3. Phase 3 — comparator and gallery
4. Phase 4 — 360° panorama
5. Phase 5 — PHP backend

Vendored GSAP is third-party and excluded from the authored line count, though
it remains part of the deployed tree.
