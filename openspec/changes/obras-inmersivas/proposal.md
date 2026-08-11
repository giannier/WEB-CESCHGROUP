# Proposal — Immersive project portfolio (`obras-inmersivas`)

**Status:** proposed
**Date:** 2026-08-11
**Change owner:** CESCHGROUP

## Business problem

CESCHGROUP competes for public works contracts and private commissions. The
decision maker on the other side — a municipal officer, a regional government
engineer, a private developer — is asking one question: *can these people
actually build it, and did they finish the last one?*

The site today answers that with a table of facts (code, entity, amount, term,
physical progress) and a placeholder frame where the photo should be. Facts
without evidence read as claims. Every competitor's site claims the same thing.

The company's real asset is that the works exist and can be walked through. The
site does not currently let anyone walk through them.

## What we are proposing

Turn each work record from a data sheet into a visit. Two layers, deliberately
staged so value lands before the client spends anything on capture:

**Layer 1 — cinematic tour.** Works with photographs the company already has,
including phone photos. As the visitor scrolls the work page, the photograph
pans and zooms under scroll control, and technical hotspots surface on top of
it at the moment the relevant part of the image is in frame ("1.20 m diameter
piles", "f'c = 350 kg/cm² slab"). A drag comparator shows before and after.
The gallery opens full screen with a shared-element transition.

**Layer 2 — 360° walkthrough.** For flagship works only. An equirectangular
panorama the visitor drags to look around, standing inside the work, with jump
points between positions. This is the literal "recorrido".

A work page renders the richest layer its data supports and silently falls back
otherwise. A work with nothing but a name still renders correctly today.

## Why staged, and what it costs the client

| Layer | Client must capture | Marginal cost | Ships |
|---|---|---|---|
| 1 — cinematic tour | Nothing. Existing photos work. | S/ 0 | Immediately |
| 2 — 360° walkthrough | 360° camera pass per work | ~S/ 1,500 one-off camera, or a photographer per work | When photos arrive |

Layer 2 has a hard constraint the client must understand: **works completed
years ago can no longer be captured mid-construction.** The scaffolding is
gone. 360° capture is only fully expressive on works currently in execution,
which is an argument for starting the capture habit now, not later.

## Scope

**In scope**

- Rebrand placeholder identity to CESCHGROUP across `datos.js`.
- Extend the work record with optional `recorrido`, `hotspots`,
  `antesDespues` and `panorama` fields.
- GSAP-driven scroll tour, hotspot layer and drag comparator.
- Full-screen gallery with Flip shared-element transition.
- Vanilla WebGL 360° panorama viewer with jump points.
- PHP mail endpoint for the contact and complaints forms, with the existing
  WhatsApp path retained as fallback.
- cPanel deployment assets: `.htaccess`, `.gitignore`, deploy notes.

**Out of scope (explicit non-goals)**

- Photogrammetry / orbitable 3D models. Rejected on evidence, not effort: a
  3–8 MB glTF per work punishes mobile users on regional 4G, requires a
  licensed drone operator and flight permits per site, and answers a question
  ("what shape is it") the buyer is not asking. The buyer asks "is it built".
- Any JavaScript framework or build step. The deploy target is a cPanel host
  updated by `git pull`; whatever the browser needs must be committed.
- A CMS or admin panel. Content stays in `datos.js` under version control,
  which is the right granularity for a portfolio that changes monthly.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Client never delivers photos, immersive layer stays empty | HIGH | Every layer degrades to the existing labelled frame. The site is never worse than today. |
| Large photos make the tour slow on mobile 4G | HIGH | Hard budget per asset class, `loading="lazy"`, explicit dimensions, panorama loaded only on user intent. |
| Scroll-driven motion causes discomfort or fails accessibility | MEDIUM | `prefers-reduced-motion` collapses the tour to a plain static gallery. Not a degraded experience — a complete one. |
| GSAP pinning fights native scroll on mid-tier Android | MEDIUM | At most one pinned section per page; verified on a throttled mobile viewport before sign-off. |
| PHP mail silently dropped by shared-host spam filters | MEDIUM | Form keeps the WhatsApp path; PHP failure surfaces an explicit message, never a silent success. |

## Rollback plan

Every change is additive. The immersive layer lives in new files
(`assets/js/recorrido.js`, `assets/js/panorama.js`, `assets/css/inmersivo.css`)
loaded by new `<script>`/`<link>` tags. Removing those four tags returns the
site to its current working state with no other edit. `datos.js` gains only
optional fields, which the existing renderer ignores.

## Success criteria

1. A work page with a `recorrido` block plays the scroll tour at a sustained
   frame rate on a throttled mobile viewport.
2. A work page with no immersive data renders exactly as it does today.
3. With `prefers-reduced-motion: reduce`, all content is reachable and static.
4. No horizontal overflow and no console errors at 360 / 390 / 768 / 1024 /
   1440 px across all pages.
5. The contact form delivers mail through PHP, and states plainly when it
   cannot.
