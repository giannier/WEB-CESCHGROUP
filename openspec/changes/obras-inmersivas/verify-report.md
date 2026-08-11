# Verify report — `obras-inmersivas`

**Date:** 2026-08-11
**Verdict:** PASS — all seven task phases implemented and verified.

## Evidence

| Suite | Tool | Result |
|---|---|---|
| Page smoke | Node + jsdom, 8 page/query combinations | 8/8 pass |
| Site behavior | Node + jsdom | 65/65 pass |
| Immersive layer | puppeteer-core + Chrome 1440×900 | 61/61 pass |
| Responsive / console | Chrome at 360, 390, 768, 1024, 1440 px × 7 pages | no overflow, no JS errors |
| PHP syntax | `php:8.0-cli` in Docker | no syntax errors |
| PHP endpoint | live `php -S`, 9 request shapes | all match spec |
| Visual | Chrome screenshots, desktop + mobile | reviewed |

## Requirement coverage

| Requirement | Status | Evidence |
|---|---|---|
| Progressive immersive rendering | PASS | `pistas-veredas-pimentel` renders with all three mounts hidden and `offsetHeight === 0`; `puente-reque` renders all layers |
| Scroll-driven cinematic tour | PASS | One pinned ScrollTrigger; timeline labels at 0 / 1.6 / 3.2, duration 4.8; stage opacity and photo transform verified at 1 %, 45 % and 99 % of the scroll range |
| Technical hotspots | PASS | 5 hotspots rendered, each with an accessible name and a ≥ 44 × 44 px hit area |
| Before/after comparator | PASS | `role="slider"`, arrow keys and Home move it, `clip-path` follows |
| 360° panorama viewer | PASS | Viewer is not constructed until activation; texture loads on demand; arrow keys rotate in both axes; Escape closes and stops the loop |
| Immersive performance budget | PASS | Largest photo 95 KB (budget 300 KB); largest panorama 250 KB (budget 1.5 MB) |
| Contact delivery via PHP | PASS | 405 / 400 / 422 / 200 / 502 all as specified; honeypot and fast-submit silently discarded |

## Defects found and fixed during verification

1. **The loading overlay never disappeared and hid the whole panorama.**
   `.pano-cargando` declares `display: grid`, which beats the `hidden`
   attribute's UA `display: none`. The 360° view rendered correctly the whole
   time, invisible behind an opaque veil. Fixed with a single
   `[hidden] { display: none !important }` in `estilos.css`, which also
   protects the other four blocks toggled by `hidden`.

2. **Hotspot pills overlapped in static mode on mobile.** The 620 px rule
   `.hotspot--izquierda .hotspot-rotulo` ties on specificity with
   `.recorrido--estatico .hotspot-rotulo` and appears later, so it re-applied
   `translateX(-50%)` to labels that are inline pills in static mode. Scoped
   the mobile rule to `.recorrido:not(.recorrido--estatico)`.

3. **`never` return type in `contacto.php`.** PHP 8.1+ only; on a cPanel host
   running 8.0 it is a parse error, i.e. a blank page in production. Lowered to
   `void`, keeping the floor at 8.0.

## Notes carried forward

- Test suites live in the session scratchpad, not in the repository. There is
  no test runner installed here and adding one would introduce the build step
  the project deliberately avoids. If the suites should be versioned, that is a
  separate change.
- `mail()` delivery could only be verified as far as the endpoint's own
  contract; whether a shared host actually delivers can only be confirmed after
  deployment. This is why the WhatsApp fallback is mandatory, not decorative.
- Placeholder photographs are committed and labelled "IMAGEN DE MUESTRA —
  REEMPLAZAR". They must be deleted when real photography arrives.
