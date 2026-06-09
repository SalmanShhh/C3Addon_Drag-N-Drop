# Construct 3 Addon Development - Mesh Distortion Skill (Standalone)

Practical guidance for building a standalone Mesh Distortion addon in Construct 3 with CAW, including hierarchy-aware rendering, correct draw ordering, and UV mode strategy.

---

## Table of Contents

1. Purpose and Scope
2. Runtime Architecture
3. Hierarchy-Aware Layer Resolution
4. Rendering Correctness Rules
5. Mesh Data Pipeline
6. UV Modes and Expected Use Cases
7. Distortion Models
8. World Transform and Coordinate Mapping
9. Culling, Backface, and Z Handling
10. Actions, Conditions, Expressions (ACE) Design
11. Save/Load and Persistence
12. Debugger Instrumentation
13. Performance and Stability Checklist
14. Common Failure Modes and Fixes
15. Minimal Reference Patterns

---

## 1. Purpose and Scope

Use this skill when creating a plugin or behavior that distorts visuals by drawing deformed quads or triangle meshes through Construct 3 runtime rendering APIs.

Goals:
- Distort target visuals while preserving expected render order.
- Respect layer hierarchies (group layers, nested sub-layers, parent visibility/interactivity rules).
- Support multiple UV mapping modes with clear use cases.
- Keep results stable across layout changes and resolution changes.

Non-goals:
- Replacing Construct's full effect pipeline.
- Runtime DOM rendering hacks.

---

## 2. Runtime Architecture

Recommended structure:

- Runtime state in constructor only (arrays/maps/flags).
- Runtime/layer references resolved in onCreate() or lazily per action.
- Mesh generation and update in _tick() only when dirty.
- Draw path separated from simulation path.

Suggested internal modules:

- Mesh source:
  - Defines logical control points/segments.
- UV mapper:
  - Produces per-vertex UV based on selected mode.
- Renderer adapter:
  - Emits IRenderer draw calls and handles state setup.
- Hierarchy resolver:
  - Finds target layer/object through nested groups safely.

---

## 3. Hierarchy-Aware Layer Resolution

Do not assume a target layer is a direct child of a container layer.

Rules:

- Always resolve from current runtime layout first:
  - runtime.layout.getLayer(layerName)
- If you must scope to a container/group, support nested lookup:
  - Prefer allSubLayers() for recursive coverage.
- Never cache layer references permanently in single-global plugins.
  - Re-resolve on use or refresh on layout transitions.

Safe pattern:

```js
_getContainerRef() {
  return this.runtime.layout.getLayer(this._containerLayerName) ?? null;
}

_findLayerInHierarchy(layerName, rootLayer) {
  if (!rootLayer || !layerName) return null;
  if (rootLayer.name === layerName) return rootLayer;

  if (typeof rootLayer.allSubLayers === "function") {
    for (const subLayer of rootLayer.allSubLayers()) {
      if (subLayer?.name === layerName) return subLayer;
    }
  }

  return null;
}
```

Layout change resilience:

- Subscribe to beforelayout/afterlayout only if needed.
- In single-global manager patterns, invalidate cached hierarchy keys after layout change.

---

## 4. Rendering Correctness Rules

To render correctly every frame:

- Set renderer state explicitly before drawing:
  - Blend mode
  - Fill mode
  - Color/opacity
  - Texture/sampling
- Keep winding and culling intentional:
  - setCullFaceMode("none") for 2D mirrored/distorted quads unless you intentionally cull.
- Keep source UV rect consistent with the actual sprite-sheeted region.
  - Use tex rects from image/texture metadata, not assumed [0..1].
- Draw in correct phase:
  - If drawing in layer hooks, ensure you draw in layer-local transform state.
- Respect parent-layer visibility:
  - Skip expensive updates when target layer is not self-and-parents visible.

Recommended per-draw setup:

```js
renderer.setAlphaBlendMode();
renderer.setTextureFillMode();
renderer.resetColor();
renderer.setCullFaceMode("none");
renderer.setFrontFaceWinding("cw");
renderer.setTexture(texture, "auto");
```

---

## 5. Mesh Data Pipeline

Use two modes depending on mesh size/change frequency:

- Small/dynamic meshes:
  - drawMesh() each frame is acceptable.
- Medium/large or partially changing meshes:
  - createMeshData() once, mutate typed arrays, then markDataChanged() only for touched ranges.

Pipeline:

1. Build logical control lattice (grid/curve/control points).
2. Generate vertex positions in world or layer space.
3. Generate UVs with selected UV mode.
4. Generate triangle indices (consistent winding).
5. Upload/update changed buffers.
6. Draw.

Important:

- Always call markDataChanged or markAllVertexDataChanged after array edits.
- Keep indexCount multiples of 3.
- Premultiply vertex color alpha if using per-vertex color arrays.

---

## 6. UV Modes and Expected Use Cases

UV mode defines how texture coordinates map onto distorted geometry.

### 6.1 Stretch (Normalized Bounding Mapping)

Definition:
- Map local mesh domain min/max to full source rect (0..1 domain mapped into source UV rect).

Use cases:
- Heat haze panels.
- Flag/banner style deformations where full image should always fill the mesh.
- UI transitions where visual continuity across the entire element matters.

Pros:
- Simple and predictable.
- Minimal state needed.

Cons:
- Texture features stretch under large deformation.

### 6.2 Preserve Surface (Arc/Distance-Accumulated UV)

Definition:
- U and/or V advance according to accumulated geometric distance along mesh rows/columns.

Use cases:
- Ribbon/rope/tentacle distortion.
- Curved tracks, rivers, and long strips where texel density should remain consistent.

Pros:
- Better texel density consistency.
- Reduced visual smearing on bends.

Cons:
- Slightly more CPU work to compute cumulative lengths.

### 6.3 Tile/Repeat UV

Definition:
- UV grows beyond 0..1 and relies on repeat wrap mode.

Use cases:
- Water/wave surfaces.
- Conveyor belts/scrollers.
- Infinite scroll backgrounds under deformation.

Pros:
- Natural repeating patterns.
- Easy motion by offsetting UV over time.

Cons:
- Requires texture wrap repeat support and seam-safe textures.

### 6.4 Clamp-to-Edge UV

Definition:
- UV sampled within source edges only; outside values clamp to border texel.

Use cases:
- Portraits/cards/UI where edge bleeding must be avoided.
- Distortions that may push boundary vertices outside normal range.

Pros:
- Stable borders.
- Reduces edge sampling artifacts.

Cons:
- Can smear edge texels under extreme displacement.

### 6.5 Crop/Windowed UV (Sub-Rect Anchored)

Definition:
- Distortion samples only a sub-rectangle of the source texture.

Use cases:
- Sprite atlas sub-region distortion.
- Distorting only a face region of a larger sprite.
- Timeline-driven reveal windows.

Pros:
- Fine control over sampled region.

Cons:
- Requires careful source rect management with sprite-sheet packing.

### 6.6 Polar/Radial UV

Definition:
- UV derived from angle + radius around a center point.

Use cases:
- Shockwaves.
- Portals.
- Lens/fish-eye style distortions.

Pros:
- Ideal for circular effects.

Cons:
- Requires seam handling around angle wrap.

### 6.7 Triplanar-Like Emulation (Advanced 3D-ish)

Definition:
- Blend UV projections by dominant axis (for pseudo-3D meshes).

Use cases:
- Pseudo-3D card bends and thickened strips.
- Addons pushing beyond 2D surface assumptions.

Pros:
- Reduces stretching on steep bends.

Cons:
- Heavier and rarely needed for standard 2D addons.

---

## 7. Distortion Models

Common model families:

- Grid warp:
  - Regular NxM lattice; easy for editor tooling.
- Spline warp:
  - Bezier/Catmull control lines with sampled strips.
- Noise warp:
  - Procedural offsets (time-varying turbulence/waves).
- Field warp:
  - Distortion from attractors/repulsors/flow maps.

Best practice:

- Keep a canonical rest mesh and derive current mesh from it.
- Avoid cumulative floating-point drift by rebuilding from rest pose each update.

---

## 8. World Transform and Coordinate Mapping

Decide transform space early and keep it consistent:

- Layer space:
  - Best for layer-driven effects.
- Instance local space -> world space:
  - Best for per-object distortion.

For object-attached distortion:

- Start from object quad corners.
- Apply deformation in local normalized coordinates.
- Transform to world coordinates using position/angle/size.

For editor/runtime mismatch prevention:

- Keep origin assumptions explicit (center vs top-left).
- Treat source rect from texture metadata as authoritative.

---

## 9. Culling, Backface, and Z Handling

Rules:

- For 2D distortions, default cull mode should be none.
- If using culling for performance, enforce consistent winding in index generation.
- For pseudo-3D, track current Z and layer Z elevation assumptions.
- If target includes mirrored scales, verify winding does not invert unexpectedly.

Quick check for winding bugs:

- If geometry vanishes only at certain bends or flips, suspect winding/cull mismatch.

---

## 10. Actions, Conditions, Expressions (ACE) Design

Recommended ACE surface:

Actions:
- Set UV mode
- Set distortion intensity
- Set control point
- Rebuild mesh
- Set wrap mode/sampling
- Enable/disable hierarchical target lookup

Conditions:
- Is mesh valid
- Is target visible (self+parents)
- On mesh rebuilt
- On render target lost/restored

Expressions:
- Vertex count
- Triangle count
- Current UV mode key
- Last rebuild ms
- Bounds left/top/right/bottom

Design notes:

- Combo parameters arrive as numeric indices at runtime.
- Convert combo index -> key with a mapping helper.
- Keep trigger conditions as pure filters and set event-state before trigger calls.

---

## 11. Save/Load and Persistence

Persist only deterministic, lightweight state:

- UV mode key
- Distortion parameters
- Control points
- Runtime toggles

Do not persist:

- Live texture handles
- Renderer/mesh object handles
- Layer references

Recreate transient resources after load/onCreate.

---

## 12. Debugger Instrumentation

Expose runtime diagnostics via _getDebuggerProperties:

- Current UV mode
- Mesh vertex/index counts
- Dirty flags
- Last rebuild duration
- Target layer resolution status
- Culling and winding settings

Use $-prefixed literal names to avoid translation key lookups.

---

## 13. Performance and Stability Checklist

- Stop ticking when idle.
- Rebuild mesh only when dirty or time-driven mode is active.
- Use meshData for large persistent meshes.
- Avoid allocating new arrays every frame.
- Guard all layer and object references.
- Re-resolve hierarchy after layout transitions.
- Verify behavior in nested layer groups.
- Verify with mirrored/flipped object scales.

---

## 14. Common Failure Modes and Fixes

1. Mesh not visible on some layouts
- Cause: stale layer refs in single-global plugin.
- Fix: resolve current layout refs at action/draw time.

2. Distortion appears but texture is wrong region
- Cause: assuming full [0..1] atlas region.
- Fix: use actual source tex rect for UV mapping.

3. Triangles flicker/disappear when bent
- Cause: winding flips with culling enabled.
- Fix: disable culling or rebuild indices with consistent winding.

4. Nested group layer target not found
- Cause: direct-child lookup only.
- Fix: use allSubLayers() recursive search path.

5. UV seams in radial mode
- Cause: angle wrap discontinuity.
- Fix: duplicate seam vertices and split UV at wrap boundary.

---

## 15. Minimal Reference Patterns

### 15.1 UV combo index mapping

```js
_combo(value, keys) {
  return keys[value] ?? keys[0];
}

_setUvModeFromCombo(modeIndex) {
  this._uvMode = this._combo(modeIndex, [
    "stretch",
    "preserve_surface",
    "tile_repeat",
    "clamp_edge",
    "crop_window",
    "polar_radial",
  ]);
}
```

### 15.2 Dirty-driven rebuild in _tick

```js
_tick() {
  if (!this._enabled) return;

  if (this._meshDirty) {
    const t0 = performance.now();
    this._rebuildMesh();
    this._lastRebuildMs = performance.now() - t0;
    this._meshDirty = false;
  }

  if (this._timeAnimated) {
    this._updateAnimatedOffsets(this.runtime.dt);
  }
}
```

### 15.3 Hierarchy-safe layer visibility gate

```js
_isTargetActuallyVisible(layerRef) {
  return !!layerRef && layerRef.isSelfAndParentsVisible === true;
}
```

---

## Practical Recommendation Summary

- Default UV mode: stretch for general-purpose ease.
- Offer preserve_surface and tile_repeat as the two most practical advanced modes.
- Treat hierarchy resolution as a first-class feature, not a fallback.
- Prioritize deterministic mesh rebuild logic and explicit renderer state every draw.
