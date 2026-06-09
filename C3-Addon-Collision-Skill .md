---
name: c3-addon-collision
description: >
  Implement and debug reliable collision resolution in Construct 3 (C3) addons — push-out of
  solids, sliding along walls and slopes, and keeping a moving object (virtual cursor, agent,
  custom-movement behaviour, platformer) out of solid-behaviour objects or custom obstacles.
  Use this skill whenever a C3 addon must resolve overlaps, compute contact normals, slide
  smoothly along rotated/tilted colliders, or when fixing collision symptoms like stepping,
  jitter, corner wobble, tunnelling through thin walls, or a cursor passing through obstacles.
  Covers the ICollisionEngine primitives, SAT/MTV resolution for arbitrary polygons, sub-stepping,
  normal stabilisation, and the slope-vs-wall decision. Companion to the c3-addon-spec skill.
---

# C3 Addon Collision Skill

Reliable solid/obstacle collision resolution for any C3 addon that *moves an object and must keep it out of things*: virtual cursors, custom-movement behaviours, agents, platformers. This is implementation guidance — pair it with `c3-addon-spec` when the work is a written specification, and apply it directly when writing or fixing runtime code.

> The recurring lesson behind everything below: C3 never hands you a surface normal, and the failures people hit (stepping, jitter, tunnelling, pass-through) almost always come from *how the resolution is driven*, not from the geometry maths. Get the driving loop right first.

---

## Documented surface — the safety rule (read first)

C3 has two collision API surfaces, and only one is safe for addons to depend on:

- **Overlap *testing* — documented and stable.** `inst.testOverlap(other)`, `inst.testOverlapSolid()`, `inst.getBoundingBox()`, `inst.getBoundingQuad()` (a.k.a. `getQuad()`), `inst.containsPoint()`, and the position/size/angle properties (`inst.x`, `inst.y`, `inst.angle`, `inst.width`, `inst.height`) are part of the documented `IWorldInstance` interface. `ISDKWorldInstanceBase` (the SDK v2 base a world-type addon instance extends) derives from `IWorldInstance`, so addons inherit these legitimately. **Build on these.**
- **Collision *resolution* — NOT documented addon API.** Construct's built-in Platform/8Direction behaviours push out of solids using internal collision-engine machinery. Methods like `pushOutSolid` / `pushOutSolidNearest`, and the `getWorldInfo()` / `setBboxChanged()` instance pattern, are **not confirmed in the public scripting/SDK interfaces** — treat them as engine internals that can change between Construct versions. **Do not depend on them.**

**The consequence for this skill:** the engine never gives you a documented push-out, so an addon computes resolution itself (SAT/MTV below) on top of documented overlap tests + geometry getters. That is not a workaround — it is *the* portable approach.

> **The definitive test for "is this documented":** the TypeScript definition files (`ts-defs`) shipped with the addon SDK. If a method is in those `.d.ts` files, it is public surface; if you reach through `this._runtime` or `this.runtime.collisionEngine` to something that isn't, that is the version-fragility risk. Verify any collision method here against your installed SDK's `ts-defs` before relying on it.

---

## The core model

Three steps, always in this order:

1. **Move** the object (apply velocity × dt).
2. **Resolve** any overlap — push the object out, and recover the **contact normal** from how it was pushed.
3. **Slide** — remove the velocity component going *into* the surface so the object glides along it instead of sticking:

```js
// Cancel only the inward component (preferred over replacing the whole vector).
const vn = velX * nx + velY * ny;   // n = unit contact normal
if (vn < 0) { velX -= vn * nx; velY -= vn * ny; }
```

The normal is everything. On a flat wall it's trivial; on a slope or a rotated collider it must be *accurate and stable* or the slide steps and wobbles.

---

## Two classes of blocker — they are NOT resolved the same way

| Blocker | Detect with (documented) | Resolve with (own maths) |
|---|---|---|
| Object with the **Solid** behaviour | `inst.testOverlapSolid()` | SAT/MTV on documented geometry |
| **Custom** registered instance (UID / group, not Solid-tagged) | `inst.testOverlap(other)` | SAT/MTV or ring-expansion |

> **Both kinds resolve the same documented way — by your own maths.** Detection differs (`testOverlapSolid()` finds Solid-behaviour objects; `testOverlap(other)` works for any registered instance), but resolution does not depend on any engine push-out for either. Don't reach for `pushOutSolid*` even for solids: it's internal (see the safety rule above), and a custom obstacle that isn't Solid-tagged is invisible to it anyway, so the object sails straight through. Requiring the developer to register their solid/obstacle object types — rather than relying on an internal "give me all solids" query — keeps the whole path documented.

---

## Collision primitives — documented vs internal

**Documented (build on these).** Overlap testing and geometry, called on the instance (`IWorldInstance`, inherited by `ISDKWorldInstanceBase`):

```js
inst.testOverlap(other)     // boolean — any instance pair, any angle
inst.testOverlapSolid()     // the overlapping Solid-behaviour instance, or null
inst.getBoundingBox()       // axis-aligned bounds (IRect)
inst.getBoundingQuad()      // oriented world-space quad — correct for rotated colliders
inst.x, inst.y, inst.angle  // documented read/write properties; the setters update
                            // the bounding box for you — no manual dirty-flag call
```

Broadphase candidate gathering (documented runtime collisions helper), to avoid testing every instance:

```js
const candidates = this.runtime.collisions.getCollisionCandidates(
  [objectTypeA, objectTypeB], { left, top, right, bottom });
const unique = new Set(candidates);   // may contain duplicates
```

**Internal — do NOT depend on (see the safety rule).** `this.runtime.collisionEngine.pushOutSolid(...)`, `pushOutSolidNearest(...)`, and the `getWorldInfo()` / `setBboxChanged()` instance pattern are engine machinery used by built-in behaviours. They are not confirmed public API and can change between versions. Resolve with your own maths (below) instead.

---

## The reliability recipe — the non-negotiables

These four are what separate a resolver that works in a demo from one that holds up at speed, on slopes, and at corners.

### 1. Sub-step the movement

Apply the frame's movement in increments no larger than ~half the object's smallest collision dimension, resolving each increment.

```js
const step  = Math.max(2, Math.min(inst.width, inst.height) * 0.5);
const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step));
```

This does two jobs: it stops a fast object **tunnelling** through a thin or rotated wall in one jump, and it keeps penetration shallow every step — which on its own dramatically **stabilises the normal at corners**, because the object never wedges deep into an ambiguous apex.

### 2. Iterate resolution per step

After pushing out, **re-test and resolve again** (cap ~4 passes). A single push-out can shove the object into a second blocker; without re-testing, that overlap survives the tick.

### 3. One collision representation for both detect and resolve

Do **not** detect with the native `testOverlap`/`testOverlapSolid` and then resolve with a *different* hand-rolled polygon test. When the two disagree — easy with sprite collision polys — the detector says "overlapping" while the resolver computes ~zero penetration, and you fall into a fragile fallback path that fights the main one. Pick one source of truth for a given blocker and use it for both.

### 4. Separate along the true axis; cancel only inward velocity

Push out along the genuine minimum-separation axis (so the overlap always clears), and zero only the velocity going *into* the surface (`vn < 0`). Never blanket-zero all velocity unless sliding is disabled.

---

## Recovering the normal

### Primary (documented): SAT / minimum-translation-vector

Works for **both** solids and custom obstacles, on any rotation, using only documented overlap tests + geometry. Project both polygons onto every edge-normal axis; the axis of **minimum overlap** is the MTV. Sign it via the centre-to-centre direction so push-out moves *away* from the blocker.

```
for each edge-normal axis of both polygons:
    overlap = min(maxA, maxB) - max(minA, minB)
    if overlap > 0 and overlap < bestOverlap:
        bestOverlap = overlap
        bestAxis    = axis (flipped if centre-to-centre points the other way)
```

This yields an **exact, continuous** normal — not quantised — which is why SAT is the right tool for rotated/tilted colliders. Resolve by moving `inst.x/.y` along `bestAxis` by `bestOverlap` (+ a small skin); the documented position setters update the bounding box for you.

> **Get world-space points reliably.** Prefer `getBoundingQuad()` (documented; returns world-space corners directly — no guessing) for box/sprite colliders. The poly-point path (per-frame `getPolyPointX/Y` + origin via `IImageInfo`/`IAnimationFrame`) is documented too, but must handle the collision-poly coordinate space correctly (normalised 0–1 vs origin-relative). A wrong coordinate-space assumption produces subtly wrong points → wrong normals → stepping that *looks* like a maths bug but is really an extraction bug. If jitter persists on rotated colliders, force the `getBoundingQuad()` path to isolate it.

### Fallback (documented): ring-expansion nearest-exit

When you'd rather not run SAT, expand a probe ring outward using only documented overlap tests; the first offset that clears the overlap is the nearest exit, and its direction is the normal:

```js
const ox = inst.x, oy = inst.y;
for (let d = stepPx; d <= maxStep; d += stepPx)
  for (let s = 0; s < samples; s++) {
    const ang = (s / samples) * 2 * Math.PI;
    inst.x = ox + Math.cos(ang) * d;   // documented setter; updates the bbox
    inst.y = oy + Math.sin(ang) * d;
    if (!inst.testOverlap(other)) return [Math.cos(ang), Math.sin(ang)];
  }
inst.x = ox; inst.y = oy;   // restore if unresolved
```

Simpler than SAT but the normal is **quantised** to `samples` directions — raise the count or smooth it. Cheap when penetration is shallow, so pair it with sub-stepping.

> **Internal shortcut, not for production:** the built-in behaviours recover a normal from an engine push-out (`pushOutSolidNearest` then read the displacement). It's continuous and convenient, but it's internal API (see the safety rule) — fine for a quick experiment, not for an addon you'll ship and maintain. Use SAT/MTV instead.

---

## Corner / tip instability — the #1 cause of stepped sliding

At a corner or the end of a bar, two separating axes have nearly equal overlap. A sub-pixel position change flips which one wins, the normal flips, the slide tangent flips with it, and the object wobbles in place instead of gliding off.

**Fix:** separate along the *true* MTV axis (so the overlap clears correctly), but project velocity along a normal **blended with the recent contact normal**. This bridges the flip instead of reacting to it. It needs persistent per-instance state:

```js
// state: this._lastNX, this._lastNY, this._contactAge
let nx = rawNX, ny = rawNY;                         // true separation axis
if (this._contactAge < 6 && (this._lastNX || this._lastNY)) {
  const bx = this._lastNX + (rawNX - this._lastNX) * 0.5;
  const by = this._lastNY + (rawNY - this._lastNY) * 0.5;
  const bl = Math.hypot(bx, by);
  if (bl > 1e-4) { nx = bx / bl; ny = by / bl; }    // smoothed normal for SLIDE only
}
this._lastNX = rawNX; this._lastNY = rawNY; this._contactAge = 0;
```

A genuinely fresh contact (`_contactAge` high) uses the raw normal; only *continued* contact blends. Sub-stepping (above) reduces the apex dwell that triggers the flip in the first place, so the two fixes compound.

---

## Slope vs wall (platformer-style movement)

When moving horizontally into something, decide *climb* vs *stop* with a capped upward probe, using documented overlap tests:

```
step inst.y upward in small increments, up to maxSlopeUp, testing overlap each step
cleared within maxSlopeUp -> walkable slope: keep going (object stays stepped up)
still overlapping         -> wall: restore position, stop horizontal motion
```

`maxSlopeUp` is the climbable-slope threshold — the same idea C3's Platform behaviour uses to tell a ramp from a wall, expressed here with documented `inst.y` writes + `testOverlap`/`testOverlapSolid` rather than an internal push-out call.

---

## Forces that fight push-out (homing / magnet / seek)

A steering force toward a target that sits behind or across a blocker re-injects into-wall velocity *every tick*. Push-out ejects, the force re-adds, and the object oscillates at the boundary. Two rules:

- **Resolve collision last** each tick so it has the final say on position.
- **While in contact, project the steering force onto the contact tangent** (or damp it), so it can pull *along* the wall but not *through* it. Use the previous tick's contact normal, since steering is computed before this tick's resolution runs.

---

## Stateless core vs stateful wrapper

Keep the resolution maths **stateless** — functions taking `(colEngine, inst, …)` with no per-addon state — so the same file drops into every addon. Anything that needs memory across frames (normal smoothing, contact age, "blocked last tick") lives in a thin **stateful wrapper** on the behaviour instance. This split is what makes the collision code genuinely reusable across a suite of addons.

---

## SDK v2 API notes

```js
inst.x = newX;        // documented IWorldInstance setters; they update the
inst.y = newY;        // bounding box automatically — no manual dirty-flag needed
inst.angle;           // radians (documented)
this.runtime.dt;      // delta time in seconds (read in _tick())
```

> **Use the documented position properties, not the internal world-info pattern.** Earlier guidance here used `inst.getWorldInfo()` + `wi.setX/setY` + `setBboxChanged()`. That is the engine's internal pattern; setting the documented `inst.x` / `inst.y` properties achieves the same move and keeps the bounding box correct for the next overlap test, without depending on internals. If you do drop to a lower-level write that bypasses the documented setter, you become responsible for the bbox refresh — another reason to prefer `inst.x/.y`.

---

## Pitfalls catalogue

| Symptom | Cause | Fix |
|---|---|---|
| Object skips through thin/rotated walls at speed | One-shot full-step move | Sub-step (≤ half collider) |
| Residual overlap / second blocker ignored | Single contact, no re-test | Iterate passes (cap ~4) |
| Jitter, erratic push-out | Native detection + different custom resolution disagree | One representation for both |
| Stepped / wobbling slide on slopes & corners | Raw min-overlap normal flips at the apex | Blend slide-normal with recent contact |
| Cursor/agent passes through custom obstacle | `pushOutSolid*` (internal, Solid-only) used as resolution | Resolve with own SAT/MTV on documented tests |
| Stale overlap test after a move | Bypassed the documented `inst.x/.y` setter | Move via `inst.x/.y`; they refresh the bbox |
| Object oscillates against a wall | Homing/seek force fighting push-out | Resolve last; project the force onto the tangent in contact |
| Wrong normals only on rotated colliders | Collision-poly coordinate-space mis-read in point extraction | Prefer `getBoundingQuad()`; verify poly-point space |
| Breaks after a Construct update | Depended on internal collision-engine / world-info methods | Use only documented `IWorldInstance` tests + own resolution; verify against `ts-defs` |

---

## Integration with c3-addon-spec

When a spec involves movement plus obstacles, document the collision model explicitly in the spec rather than leaving it implicit:

- A `Boolean` **Allow Sliding** property (slide vs hard-stop on contact).
- A **Register Solid / Register Obstacle** action pair for the custom blocker group, plus the matching **Unregister**.
- An `OnSolidHit` / `OnObstacleHit` trigger (`On`-prefixed, fired once per tick of contact — see the trigger conventions in `c3-addon-spec`).
- A `SolidUID` / `LastBlockerUID` result expression (definite-article noun phrase in its description).
- An **Architecture & Design Notes** paragraph naming the resolution strategy (sub-stepped SAT/MTV with normal stabilisation, on documented overlap tests) and the slope/corner handling, so the implementing developer inherits the reliability recipe rather than rediscovering it. State explicitly that resolution is computed by the addon on the documented `IWorldInstance` surface and does not depend on internal engine push-out — that is the line that keeps the spec future-proof.
