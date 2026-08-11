# Delta spec — `portafolio-obras`

Change: `obras-inmersivas`

## ADDED Requirements

### Requirement: Progressive immersive rendering

The work detail page SHALL render the richest immersive layer supported by that
work's data and SHALL degrade silently when data is absent.

Layer precedence, richest first: `panorama` → `recorrido` → `galeria` →
labelled placeholder frame.

#### Scenario: Work has a panorama

- **Given** a work record with a `panorama` array containing at least one scene
- **When** the visitor opens the work page
- **Then** the page MUST show a "Recorrido 360°" entry point
- **And** the panorama MUST NOT download until the visitor activates it

#### Scenario: Work has a cinematic tour but no panorama

- **Given** a work record with a `recorrido` array and no `panorama`
- **When** the visitor opens the work page
- **Then** the scroll-driven tour MUST render
- **And** no 360° entry point MUST appear

#### Scenario: Work has no immersive data

- **Given** a work record with neither `panorama` nor `recorrido`
- **When** the visitor opens the work page
- **Then** the page MUST render exactly as before this change
- **And** no empty section, heading or control MUST appear

#### Scenario: A declared image file does not exist on the server

- **Given** a work record naming a photo that returns 404
- **When** the visitor opens the work page
- **Then** the labelled placeholder frame MUST remain in place
- **And** no broken-image icon MUST be shown
- **And** no console error MUST be raised by application code

---

### Requirement: Scroll-driven cinematic tour

Where a work declares `recorrido`, the page SHALL animate each stage under
scroll control using GSAP ScrollTrigger.

#### Scenario: Visitor scrolls through a tour stage

- **Given** a tour stage with a photo and a `foco` point
- **When** the stage enters the viewport and the visitor scrolls
- **Then** the photo MUST pan and scale toward `foco` in proportion to scroll
  position
- **And** the animation MUST be driven only by `transform` and `opacity`

#### Scenario: Visitor scrolls back up

- **Given** a tour stage already played
- **When** the visitor scrolls upward through it
- **Then** the stage MUST reverse in step with the scroll position

#### Scenario: Reduced motion is requested

- **Given** the visitor's system requests `prefers-reduced-motion: reduce`
- **When** the work page loads
- **Then** no ScrollTrigger instance MUST be created
- **And** every tour photo and caption MUST be visible as a static gallery
- **And** all hotspot text MUST be readable without interaction

---

### Requirement: Technical hotspots

A tour stage MAY declare hotspots that surface technical detail over the
photograph.

#### Scenario: Hotspot reveal

- **Given** a stage declaring hotspots at normalized coordinates
- **When** that stage reaches its reveal threshold
- **Then** each hotspot MUST fade in staggered by 60–120 ms
- **And** each hotspot MUST stay anchored to its coordinates while the photo
  pans

#### Scenario: Hotspot activated by keyboard

- **Given** a stage with hotspots
- **When** the visitor tabs to a hotspot and presses Enter or Space
- **Then** its label MUST expand
- **And** the hotspot MUST expose an accessible name

#### Scenario: Hotspot touch target

- **Given** the page rendered at 360 px wide
- **When** hotspots are displayed
- **Then** each hotspot's interactive area MUST be at least 44 × 44 px

---

### Requirement: Before/after comparator

A work MAY declare an `antesDespues` pair to be shown as a draggable
comparator.

#### Scenario: Visitor drags the handle

- **Given** a comparator with both images loaded
- **When** the visitor drags the handle horizontally
- **Then** the "after" image MUST be revealed in proportion to handle position
- **And** the handle MUST track pointer, touch and keyboard arrow input

#### Scenario: One image of the pair is missing

- **Given** a comparator where only one image loads
- **When** the page renders
- **Then** the comparator MUST NOT render
- **And** the available image MUST be shown as a plain figure

---

### Requirement: 360° panorama viewer

Where a work declares `panorama`, the site SHALL provide a drag-navigable
equirectangular viewer.

#### Scenario: Visitor opens the panorama

- **Given** a work with a panorama scene
- **When** the visitor activates the 360° entry point
- **Then** the viewer MUST open full screen
- **And** the scene texture MUST begin loading only at that moment
- **And** a loading state MUST be shown until the texture is ready

#### Scenario: Visitor looks around

- **Given** an open panorama
- **When** the visitor drags, swipes, or presses arrow keys
- **Then** the camera MUST rotate in step with the input
- **And** vertical rotation MUST be clamped to prevent flipping

#### Scenario: Visitor jumps between scenes

- **Given** a panorama scene declaring a jump point to another scene
- **When** the visitor activates that jump point
- **Then** the viewer MUST cross-fade to the target scene
- **And** the scene name MUST be announced in the viewer chrome

#### Scenario: WebGL is unavailable

- **Given** a browser or device without a usable WebGL context
- **When** the visitor activates the 360° entry point
- **Then** the viewer MUST NOT open
- **And** the page MUST state that the walkthrough is unavailable and show the
  flat gallery instead

#### Scenario: Visitor closes the viewer

- **Given** an open panorama
- **When** the visitor presses Escape or activates the close control
- **Then** the viewer MUST close
- **And** the render loop MUST stop
- **And** focus MUST return to the control that opened it

---

### Requirement: Immersive performance budget

Immersive assets SHALL respect explicit per-class budgets so the site stays
usable on regional mobile connections.

#### Scenario: Asset budgets

- **Given** any work page
- **When** its assets are measured
- **Then** each tour photo MUST NOT exceed 300 KB
- **And** the total initial payload MUST NOT exceed 1.2 MB before the visitor
  opens a panorama
- **And** each panorama scene MUST NOT exceed 1.5 MB

#### Scenario: No layout shift from immersive media

- **Given** a work page loading on a cold cache
- **When** the tour images resolve
- **Then** every immersive image MUST reserve its space via explicit
  dimensions or `aspect-ratio`
- **And** no cumulative layout shift MUST be caused by immersive media

---

### Requirement: Contact delivery via PHP

The contact and complaints forms SHALL attempt server-side mail delivery and
SHALL retain a client-side fallback.

#### Scenario: Mail accepted

- **Given** a completed contact form
- **When** the visitor submits and the endpoint accepts the message
- **Then** a success state MUST be shown
- **And** the form MUST be cleared

#### Scenario: Endpoint unavailable

- **Given** a completed contact form
- **When** the endpoint returns an error or cannot be reached
- **Then** the visitor MUST be told delivery failed
- **And** the WhatsApp path MUST be offered with the message pre-filled
- **And** the entered data MUST NOT be discarded

#### Scenario: Submission fails validation server-side

- **Given** a submission with a missing required field or an invalid email
- **When** the endpoint processes it
- **Then** it MUST reject the submission with a field-level reason
- **And** it MUST NOT send mail

#### Scenario: Endpoint receives an automated submission

- **Given** a submission whose honeypot field is populated, or which arrives
  within 3 seconds of form render
- **When** the endpoint processes it
- **Then** it MUST silently discard the submission
- **And** it MUST return the same success shape as a genuine submission
