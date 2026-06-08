import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

// How many recent drag-point velocity samples feed the throw average.
const MAX_HISTORY = 8;
// Number of push-out passes per tick when resolving overlapping solids.
const MAX_SOLID_PASSES = 4;
const QUARTER_TURN = Math.PI / 4;

// ---------------------------------------------------------------------------
// Small stateless helpers keep the drag logic readable and easy to tweak.
// ---------------------------------------------------------------------------

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Combo params arrive as a 0-based index at runtime; accept the string form too
// so the same setters work when called from the addon's script interface.
function normalizeGrabMode(value) {
  // ["keep_offset", "center_on_point"]
  if (value === 1 || value === "1" || value === "center_on_point") {
    return "center_on_point";
  }
  return "keep_offset";
}

// Directions follow the 8Direction / VectorCursor style: a free 360 default
// plus single-axis and snapped multi-direction locks.
// ["free", "up_down", "left_right", "four_dir", "eight_dir"]
function normalizeDirections(value) {
  switch (value) {
    case 1:
    case "1":
    case "up_down":
      return "up_down";
    case 2:
    case "2":
    case "left_right":
      return "left_right";
    case 3:
    case "3":
    case "four_dir":
      return "four_dir";
    case 4:
    case "4":
    case "eight_dir":
      return "eight_dir";
    default:
      return "free";
  }
}

function normalizeEndAction(value) {
  // ["drop", "cancel"] for break distance and ["release", "cancel"] for Drop
  if (value === 1 || value === "1" || value === "cancel") {
    return "cancel";
  }
  return value === "release" ? "release" : "drop";
}

function normalizeSnapMode(value) {
  // ["radius", "overlap"]
  if (value === 1 || value === "1" || value === "overlap") {
    return "overlap";
  }
  return "radius";
}

// Constrains a displacement (dx, dy) from the grab origin to the chosen
// direction set, projecting onto the nearest allowed direction.
function constrainDelta(dx, dy, mode) {
  switch (mode) {
    case "up_down":
      return [0, dy];
    case "left_right":
      return [dx, 0];
    case "four_dir":
      // Keep whichever cardinal axis the drag leans toward most.
      return Math.abs(dx) >= Math.abs(dy) ? [dx, 0] : [0, dy];
    case "eight_dir": {
      // Snap the displacement angle to the nearest 45 degrees, then project.
      const snapped = Math.round(Math.atan2(dy, dx) / QUARTER_TURN) * QUARTER_TURN;
      const cos = Math.cos(snapped);
      const sin = Math.sin(snapped);
      const magnitude = dx * cos + dy * sin;
      return [cos * magnitude, sin * magnitude];
    }
    default:
      return [dx, dy];
  }
}

// `inst.behaviors` may be a keyed object or an iterable depending on the
// runtime surface, so flatten either form into a plain array of behaviors.
function getBehaviorList(inst) {
  const behaviors = inst?.behaviors;
  if (!behaviors) {
    return [];
  }
  if (Array.isArray(behaviors)) {
    return behaviors;
  }
  if (typeof behaviors[Symbol.iterator] === "function") {
    return Array.from(behaviors);
  }
  return Object.values(behaviors);
}

// An object blocks a drag only if it carries an enabled Solid behaviour.
function hasEnabledSolid(inst) {
  for (const behavior of getBehaviorList(inst)) {
    const name = behavior?.behaviorType?.name ?? behavior?.behavior?.name;
    if (name === "Solid") {
      // Treat a missing isEnabled flag as enabled (older surfaces).
      if (behavior.isEnabled === undefined || behavior.isEnabled) {
        return true;
      }
    }
  }
  return false;
}

// Axis-aligned bounds for a minimum-translation-vector push-out. Falls back to
// position + size when getBoundingBox() is unavailable.
function getBounds(inst) {
  if (inst && typeof inst.getBoundingBox === "function") {
    const box = inst.getBoundingBox();
    if (box) {
      return {
        left: safeNumber(box.left, 0),
        top: safeNumber(box.top, 0),
        right: safeNumber(box.right, 0),
        bottom: safeNumber(box.bottom, 0),
      };
    }
  }
  const x = safeNumber(inst?.x, 0);
  const y = safeNumber(inst?.y, 0);
  const width = safeNumber(inst?.width, 0);
  const height = safeNumber(inst?.height, 0);
  return { left: x, top: y, right: x + width, bottom: y + height };
}

// Minimum-translation vector that separates objectBox from otherBox, or null
// when they no longer overlap.
function minimumTranslation(objectBox, otherBox) {
  const pushRight = otherBox.right - objectBox.left; // move object +x
  const pushLeft = objectBox.right - otherBox.left; // move object -x
  const pushDown = otherBox.bottom - objectBox.top; // move object +y
  const pushUp = objectBox.bottom - otherBox.top; // move object -y

  if (pushRight <= 0 || pushLeft <= 0 || pushDown <= 0 || pushUp <= 0) {
    return null; // a separating gap exists on some axis: no real overlap
  }

  const candidates = [
    { axis: "x", amount: pushRight, direction: 1 },
    { axis: "x", amount: pushLeft, direction: -1 },
    { axis: "y", amount: pushDown, direction: 1 },
    { axis: "y", amount: pushUp, direction: -1 },
  ];

  return candidates.reduce((best, candidate) =>
    candidate.amount < best.amount ? candidate : best
  );
}

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      // `this.instance` is null here, so only touch primitives, Maps, and
      // _getInitProperties(). Per-tick work happens in _tick().
      this._setTicking(true);
      this.events = {};

      // The Properties Panel exposes a small set of common defaults; every one
      // can still be overridden at runtime through its action.
      // NOTE: order must match the properties array in config.caw.js, where
      // "Enabled" is intentionally kept last.
      const properties = this._getInitProperties() || [];
      this._followSpeed = Math.max(0, safeNumber(properties[0], 0));
      this._directions = normalizeDirections(properties[1]);
      this._solidCollision = !!properties[2];
      this._allowSliding = properties[3] !== false;
      this._breakDistance = Math.max(0, safeNumber(properties[4], 0));
      this._breakAction =
        normalizeEndAction(properties[5]) === "cancel" ? "cancel" : "drop";
      this._enabled = properties[6] !== false;

      // Drag lifecycle state.
      this._dragging = false;
      this._dragPointX = 0;
      this._dragPointY = 0;
      this._prevDragPointX = 0;
      this._prevDragPointY = 0;

      // Grab mode offset (object position minus drag point at grab time).
      this._grabOffsetX = 0;
      this._grabOffsetY = 0;

      // Direction-lock baseline (object position captured when the lock applies).
      this._lockOriginX = 0;
      this._lockOriginY = 0;

      // Live measurements.
      this._distanceFromPoint = 0;
      this._wasPushingSolid = false;

      // Throw measurement + override.
      this._throwVelX = 0;
      this._throwVelY = 0;
      this._throwSpeed = 0;
      this._overrideThrowVelX = 0;
      this._overrideThrowVelY = 0;
      this._hasThrowOverride = false;
      this._history = [];
      this._historyCursor = 0;

      // Why the last drag ended: "manual" or "broke_distance".
      this._dropReason = "manual";

      // Snap / magnet (homing) state. Disabled until a radius is set.
      this._snapPositions = []; // [{ x, y }]
      this._snapUids = new Set(); // registered target instance UIDs
      this._snapRadius = 0; // 0 disables radius-mode snapping and magnetism
      this._snapMode = "radius"; // "radius" = distance test; "overlap" = collision at the drag point
      this._magnetStrength = 0; // 0 = snap only on drop; >0 = live pull
      this._isSnapping = false; // within snap radius of a target this tick
      this._snapTargetX = 0;
      this._snapTargetY = 0;
      this._snappedUid = -1; // UID snapped to on the last drop, or -1
    }

    _postCreate() {
      // Runs after the attached object finishes creation, before the first
      // _tick(). Seed the drag point at the object's position so expressions
      // read sensible values before any drag starts.
      if (this.instance) {
        this._dragPointX = safeNumber(this.instance.x, 0);
        this._dragPointY = safeNumber(this.instance.y, 0);
        this._prevDragPointX = this._dragPointX;
        this._prevDragPointY = this._dragPointY;
        this._snapTargetX = this._dragPointX;
        this._snapTargetY = this._dragPointY;
      }
    }

    // -----------------------------------------------------------------------
    // Trigger / script-event plumbing
    // -----------------------------------------------------------------------

    _trigger(method) {
      this.dispatch(method);
      super._trigger(self.C3[AddonTypeMap[addonType]][id].Cnds[method]);
    }

    on(tag, callback, options) {
      if (!this.events[tag]) {
        this.events[tag] = [];
      }
      this.events[tag].push({ callback, options });
    }

    off(tag, callback) {
      if (this.events[tag]) {
        this.events[tag] = this.events[tag].filter(
          (event) => event.callback !== callback
        );
      }
    }

    dispatch(tag) {
      if (this.events[tag]) {
        this.events[tag].forEach((event) => {
          if (event.options && event.options.params) {
            const fn = self.C3[AddonTypeMap[addonType]][id].Cnds[tag];
            if (fn && !fn.call(this, ...event.options.params)) {
              return;
            }
          }
          event.callback();
          if (event.options && event.options.once) {
            this.off(tag, event.callback);
          }
        });
      }
    }

    // -----------------------------------------------------------------------
    // Per-tick drag update
    // -----------------------------------------------------------------------

    _tick() {
      if (!this._enabled || !this._dragging || !this.instance) {
        return;
      }

      // Per-instance dt respects any timeScale the developer set on the object.
      const dt = safeNumber(this.instance.dt, 0);

      // Resolve the target from the drag point, the grab offset and direction lock.
      let targetX = this._dragPointX + this._grabOffsetX;
      let targetY = this._dragPointY + this._grabOffsetY;
      if (this._directions !== "free") {
        const [cdx, cdy] = constrainDelta(
          targetX - this._lockOriginX,
          targetY - this._lockOriginY,
          this._directions
        );
        targetX = this._lockOriginX + cdx;
        targetY = this._lockOriginY + cdy;
      }

      // Magnet / homing: bias the target toward the nearest in-range snap point.
      // The magnet is always distance-based, regardless of the snap mode.
      if (this._snapRadius > 0 && this._magnetStrength > 0 && this._hasSnapTargets()) {
        const near = this._findNearestSnap(targetX, targetY);
        if (near && near.dist <= this._snapRadius) {
          const proximity = clamp(1 - near.dist / this._snapRadius, 0, 1);
          const factor = clamp(this._magnetStrength * proximity, 0, 1);
          targetX += (near.x - targetX) * factor;
          targetY += (near.y - targetY) * factor;
        }
      }

      // Remember the last clear position so a no-sliding collision can revert to it.
      const prevX = this.instance.x;
      const prevY = this.instance.y;

      // Follow speed 0 snaps exactly; otherwise move at most speed*dt toward it.
      if (this._followSpeed > 0 && dt > 0) {
        const dx = targetX - this.instance.x;
        const dy = targetY - this.instance.y;
        const distance = Math.hypot(dx, dy);
        const maxStep = this._followSpeed * dt;
        if (distance > maxStep && distance > 1e-6) {
          const ratio = maxStep / distance;
          this.instance.x += dx * ratio;
          this.instance.y += dy * ratio;
        } else {
          this.instance.x = targetX;
          this.instance.y = targetY;
        }
      } else {
        // SDK v2 position setters invalidate the bounding box automatically.
        this.instance.x = targetX;
        this.instance.y = targetY;
      }

      // Keep the object out of solids. With sliding on, it is pushed out along
      // the wall (keeping tangential motion); with sliding off it stops dead at
      // the last clear spot, like the 8Direction behaviour.
      let hitSolid = false;
      if (this._solidCollision) {
        hitSolid = this._allowSliding
          ? this._resolveSolids()
          : this._blockAgainstSolids(prevX, prevY);
      }

      // Gap between the object and the drag point; grows while a solid blocks.
      this._distanceFromPoint = Math.hypot(
        this.instance.x - this._dragPointX,
        this.instance.y - this._dragPointY
      );

      // On Hit Solid fires on the first tick a push-out occurs (rising edge),
      // after the gap is current so DistanceFromPoint reads correctly.
      if (hitSolid && !this._wasPushingSolid) {
        this._trigger("OnHitSolid");
      }
      this._wasPushingSolid = hitSolid;

      // Live snap state for the Is Snapping condition and SnapTarget expressions.
      this._updateSnapState();

      // Sample drag-point velocity for the throw, then advance the previous point.
      if (dt > 0) {
        this._recordVelocity(
          (this._dragPointX - this._prevDragPointX) / dt,
          (this._dragPointY - this._prevDragPointY) / dt
        );
      }
      this._prevDragPointX = this._dragPointX;
      this._prevDragPointY = this._dragPointY;

      // Tear-free model: once the gap outgrows the break distance, end the drag.
      if (this._breakDistance > 0 && this._distanceFromPoint > this._breakDistance) {
        this._endDrag(this._breakAction !== "cancel", "broke_distance");
      }
    }

    // -----------------------------------------------------------------------
    // Solid push-out (minimum-translation-vector, documented overlap tests)
    // -----------------------------------------------------------------------

    // Resolves overlaps via iterated minimum-translation pushes; returns true
    // if the object was pushed out of at least one solid this tick.
    _resolveSolids() {
      let pushed = false;

      for (let pass = 0; pass < MAX_SOLID_PASSES; pass += 1) {
        const solid = this._findOverlappingSolid();
        if (!solid) {
          break;
        }

        const translation = minimumTranslation(
          getBounds(this.instance),
          getBounds(solid)
        );
        if (!translation) {
          break;
        }

        if (translation.axis === "x") {
          this.instance.x += translation.direction * translation.amount;
        } else {
          this.instance.y += translation.direction * translation.amount;
        }
        pushed = true;
      }

      return pushed;
    }

    // No-sliding mode: if the move landed the object in a solid, revert it to
    // the last clear position so it stops dead instead of sliding along the wall.
    // Returns true if a solid blocked the move this tick.
    _blockAgainstSolids(prevX, prevY) {
      if (this._findOverlappingSolid()) {
        this.instance.x = prevX;
        this.instance.y = prevY;
        return true;
      }
      return false;
    }

    _findOverlappingSolid() {
      const instance = this.instance;
      if (!instance) {
        return null;
      }

      // Prefer the documented helper when present: it returns an overlapping
      // Solid-behaviour instance directly.
      if (typeof instance.testOverlapSolid === "function") {
        const solid = instance.testOverlapSolid();
        if (solid) {
          return solid;
        }
      }

      // Fall back to scanning instances for an enabled Solid behaviour.
      if (typeof instance.testOverlap === "function" && this.runtime?.objects) {
        for (const objectType of this.runtime.objects) {
          if (typeof objectType?.getAllInstances !== "function") {
            continue;
          }
          for (const other of objectType.getAllInstances()) {
            if (
              other &&
              other !== instance &&
              hasEnabledSolid(other) &&
              instance.testOverlap(other)
            ) {
              return other;
            }
          }
        }
      }

      return null;
    }

    // -----------------------------------------------------------------------
    // Snap / homing / magnet
    // -----------------------------------------------------------------------

    _getInstanceByUid(uid) {
      const runtime = this.runtime;
      if (runtime && typeof runtime.getInstanceByUid === "function") {
        return runtime.getInstanceByUid(uid);
      }
      return null;
    }

    _hasSnapTargets() {
      return this._snapPositions.length > 0 || this._snapUids.size > 0;
    }

    // Nearest registered snap target to (x, y): { x, y, uid, dist } or null.
    // Used by the magnet, which is always distance-based.
    _findNearestSnap(x, y) {
      let best = null;

      for (const point of this._snapPositions) {
        const dist = Math.hypot(x - point.x, y - point.y);
        if (!best || dist < best.dist) {
          best = { x: point.x, y: point.y, uid: -1, dist };
        }
      }

      for (const uid of this._snapUids) {
        if (this.instance && uid === this.instance.uid) continue; // never snap to self
        const target = this._getInstanceByUid(uid);
        if (!target) {
          continue;
        }
        const tx = safeNumber(target.x, 0);
        const ty = safeNumber(target.y, 0);
        const dist = Math.hypot(x - tx, y - ty);
        if (!best || dist < best.dist) {
          best = { x: tx, y: ty, uid, dist };
        }
      }

      return best;
    }

    // Nearest target that is currently a valid snap, honouring the snap mode:
    // "radius" tests the object's distance to the target; "overlap" tests a
    // collision at the drag position (the drag point inside a target object, or
    // the dragged object overlapping it). Returns { x, y, uid, dist } or null.
    _findActiveSnap() {
      if (!this.instance || !this._hasSnapTargets()) {
        return null;
      }
      const overlap = this._snapMode === "overlap";
      // Radius mode needs a radius; overlap mode works without one.
      if (!overlap && this._snapRadius <= 0) {
        return null;
      }

      const refX = overlap ? this._dragPointX : this.instance.x;
      const refY = overlap ? this._dragPointY : this.instance.y;
      let best = null;
      const consider = (tx, ty, uid, active) => {
        if (!active) return;
        const dist = Math.hypot(refX - tx, refY - ty);
        if (!best || dist < best.dist) {
          best = { x: tx, y: ty, uid, dist };
        }
      };

      for (const point of this._snapPositions) {
        const active = overlap
          ? this._dragPointWithinRadius(point.x, point.y) ||
            this._objectContains(point.x, point.y)
          : Math.hypot(this.instance.x - point.x, this.instance.y - point.y) <=
            this._snapRadius;
        consider(point.x, point.y, -1, active);
      }

      for (const uid of this._snapUids) {
        if (uid === this.instance.uid) continue; // never snap to self
        const target = this._getInstanceByUid(uid);
        if (!target) continue;
        const tx = safeNumber(target.x, 0);
        const ty = safeNumber(target.y, 0);
        const active = overlap
          ? (typeof target.containsPoint === "function" &&
              target.containsPoint(this._dragPointX, this._dragPointY)) ||
            (typeof this.instance.testOverlap === "function" &&
              this.instance.testOverlap(target))
          : Math.hypot(this.instance.x - tx, this.instance.y - ty) <=
            this._snapRadius;
        consider(tx, ty, uid, active);
      }

      return best;
    }

    _dragPointWithinRadius(x, y) {
      if (this._snapRadius <= 0) return false;
      return Math.hypot(this._dragPointX - x, this._dragPointY - y) <= this._snapRadius;
    }

    _objectContains(x, y) {
      return (
        typeof this.instance.containsPoint === "function" &&
        this.instance.containsPoint(x, y)
      );
    }

    _updateSnapState() {
      const active = this._findActiveSnap();
      if (active) {
        this._snapTargetX = active.x;
        this._snapTargetY = active.y;
        this._isSnapping = true;
        return;
      }

      this._isSnapping = false;
      // Show the nearest target for live feedback (highlighting the drop slot).
      if (!this.instance) {
        return;
      }
      const refX = this._snapMode === "overlap" ? this._dragPointX : this.instance.x;
      const refY = this._snapMode === "overlap" ? this._dragPointY : this.instance.y;
      const nearest = this._hasSnapTargets() ? this._findNearestSnap(refX, refY) : null;
      this._snapTargetX = nearest ? nearest.x : this.instance.x;
      this._snapTargetY = nearest ? nearest.y : this.instance.y;
    }

    // -----------------------------------------------------------------------
    // Throw measurement
    // -----------------------------------------------------------------------

    _recordVelocity(velocityX, velocityY) {
      this._history[this._historyCursor] = { velocityX, velocityY };
      this._historyCursor = (this._historyCursor + 1) % MAX_HISTORY;
    }

    _averageVelocity() {
      if (this._history.length === 0) {
        return { x: 0, y: 0 };
      }
      let totalX = 0;
      let totalY = 0;
      for (const sample of this._history) {
        totalX += sample.velocityX;
        totalY += sample.velocityY;
      }
      return { x: totalX / this._history.length, y: totalY / this._history.length };
    }

    _resetThrowSampling() {
      this._history = [];
      this._historyCursor = 0;
    }

    // -----------------------------------------------------------------------
    // Drag lifecycle
    // -----------------------------------------------------------------------

    _startDrag(dragPointX, dragPointY, grabMode) {
      // Start/stop are events; a disabled behaviour or an active drag is ignored.
      if (!this._enabled || this._dragging || !this.instance) {
        return;
      }

      const dpX = safeNumber(dragPointX, this.instance.x);
      const dpY = safeNumber(dragPointY, this.instance.y);

      this._dragPointX = dpX;
      this._dragPointY = dpY;
      this._prevDragPointX = dpX;
      this._prevDragPointY = dpY;

      // keep_offset records the grab offset; center_on_point zeroes it.
      if (normalizeGrabMode(grabMode) === "center_on_point") {
        this._grabOffsetX = 0;
        this._grabOffsetY = 0;
      } else {
        this._grabOffsetX = this.instance.x - dpX;
        this._grabOffsetY = this.instance.y - dpY;
      }

      // Direction lock holds whichever line the object started on.
      this._lockOriginX = this.instance.x;
      this._lockOriginY = this.instance.y;

      this._dragging = true;
      this._dropReason = "manual";
      this._distanceFromPoint = 0;
      this._wasPushingSolid = false;
      this._hasThrowOverride = false;
      this._throwVelX = 0;
      this._throwVelY = 0;
      this._throwSpeed = 0;
      this._isSnapping = false;
      this._snappedUid = -1;
      this._resetThrowSampling();

      this._trigger("OnDragStarted");
    }

    _drop(how) {
      if (!this._dragging) {
        return;
      }
      this._endDrag(normalizeEndAction(how) !== "cancel", "manual");
    }

    // applyThrow=true releases (throw + OnDropped); false cancels silently.
    _endDrag(applyThrow, reason) {
      if (!this._dragging) {
        return;
      }

      this._dropReason = reason;
      this._snappedUid = -1;
      let didSnap = false;

      // A release on an active snap target (radius or overlap) locks onto it.
      if (applyThrow && this.instance) {
        const near = this._findActiveSnap();
        if (near) {
          this.instance.x = near.x;
          this.instance.y = near.y;
          this._snappedUid = near.uid;
          didSnap = true;
        }
      }

      // Snapping suppresses the throw so a placed object does not fling off.
      if (applyThrow && !didSnap) {
        if (this._hasThrowOverride) {
          this._throwVelX = this._overrideThrowVelX;
          this._throwVelY = this._overrideThrowVelY;
        } else {
          const velocity = this._averageVelocity();
          this._throwVelX = velocity.x;
          this._throwVelY = velocity.y;
        }
      } else {
        this._throwVelX = 0;
        this._throwVelY = 0;
      }
      this._throwSpeed = Math.hypot(this._throwVelX, this._throwVelY);

      this._dragging = false;
      this._wasPushingSolid = false;
      this._hasThrowOverride = false;
      this._isSnapping = false;
      this._resetThrowSampling();

      this._trigger(applyThrow ? "OnDropped" : "OnDragCancelled");
      if (didSnap) {
        this._trigger("OnSnapped");
      }
    }

    // -----------------------------------------------------------------------
    // Action setters
    // -----------------------------------------------------------------------

    _setDragPoint(x, y) {
      this._dragPointX = safeNumber(x, this._dragPointX);
      this._dragPointY = safeNumber(y, this._dragPointY);
    }

    _setFollowSpeed(speed) {
      this._followSpeed = Math.max(0, safeNumber(speed, 0));
    }

    _setDirections(directions) {
      this._directions = normalizeDirections(directions);
      // Re-baseline so a mid-drag change holds the object's current line.
      if (this.instance) {
        this._lockOriginX = safeNumber(this.instance.x, this._lockOriginX);
        this._lockOriginY = safeNumber(this.instance.y, this._lockOriginY);
      }
    }

    _setSolidCollision(enabled) {
      this._solidCollision = !!enabled;
      if (!this._solidCollision) {
        this._wasPushingSolid = false;
      }
    }

    _setAllowSliding(enabled) {
      this._allowSliding = !!enabled;
    }

    _setBreakDistance(distance, action) {
      this._breakDistance = Math.max(0, safeNumber(distance, 0));
      this._breakAction = normalizeEndAction(action) === "cancel" ? "cancel" : "drop";
    }

    _setThrowVelocity(velX, velY) {
      this._overrideThrowVelX = safeNumber(velX, 0);
      this._overrideThrowVelY = safeNumber(velY, 0);
      this._hasThrowOverride = true;
    }

    _setEnabled(enabled) {
      const next = !!enabled;
      if (!next && this._dragging) {
        // Disabling cancels any in-progress drag silently (no event per spec).
        this._dragging = false;
        this._wasPushingSolid = false;
        this._hasThrowOverride = false;
        this._isSnapping = false;
        this._resetThrowSampling();
      }
      this._enabled = next;
    }

    _addSnapPosition(x, y) {
      this._snapPositions.push({ x: safeNumber(x, 0), y: safeNumber(y, 0) });
    }

    _addSnapObject(object) {
      if (!object) {
        return;
      }
      // The param is usually a single picked instance; tolerate an object type.
      if (typeof object.uid === "number") {
        this._snapUids.add(object.uid);
      } else if (typeof object.getAllInstances === "function") {
        for (const inst of object.getAllInstances()) {
          if (inst && typeof inst.uid === "number") {
            this._snapUids.add(inst.uid);
          }
        }
      }
    }

    _clearSnapTargets() {
      this._snapPositions = [];
      this._snapUids.clear();
      this._isSnapping = false;
    }

    _setSnapRadius(radius) {
      this._snapRadius = Math.max(0, safeNumber(radius, 0));
      if (this._snapRadius <= 0 && this._snapMode !== "overlap") {
        this._isSnapping = false;
      }
    }

    _setMagnetStrength(strength) {
      this._magnetStrength = clamp(safeNumber(strength, 0), 0, 1);
    }

    _setSnapMode(mode) {
      this._snapMode = normalizeSnapMode(mode);
    }

    // -----------------------------------------------------------------------
    // Debugger
    // -----------------------------------------------------------------------

    _getDebuggerProperties() {
      return [
        {
          title: "$" + this.behaviorType.name,
          properties: [
            { name: "$enabled", value: this._enabled, onedit: (v) => { this._enabled = !!v; } },
            { name: "$dragging", value: this._dragging },
            { name: "$dragPointX", value: this._dragPointX, onedit: (v) => { this._dragPointX = safeNumber(v, this._dragPointX); } },
            { name: "$dragPointY", value: this._dragPointY, onedit: (v) => { this._dragPointY = safeNumber(v, this._dragPointY); } },
            { name: "$distanceFromPoint", value: this._distanceFromPoint },
            { name: "$directions", value: this._directions },
            { name: "$followSpeed", value: this._followSpeed, onedit: (v) => { this._followSpeed = Math.max(0, safeNumber(v, this._followSpeed)); } },
            { name: "$solidCollision", value: this._solidCollision, onedit: (v) => { this._solidCollision = !!v; } },
            { name: "$allowSliding", value: this._allowSliding, onedit: (v) => { this._allowSliding = !!v; } },
            { name: "$breakDistance", value: this._breakDistance, onedit: (v) => { this._breakDistance = Math.max(0, safeNumber(v, this._breakDistance)); } },
            { name: "$snapRadius", value: this._snapRadius, onedit: (v) => { this._snapRadius = Math.max(0, safeNumber(v, this._snapRadius)); } },
            { name: "$snapMode", value: this._snapMode },
            { name: "$magnetStrength", value: this._magnetStrength, onedit: (v) => { this._magnetStrength = clamp(safeNumber(v, this._magnetStrength), 0, 1); } },
            { name: "$isSnapping", value: this._isSnapping },
            { name: "$throwVelocityX", value: this._throwVelX },
            { name: "$throwVelocityY", value: this._throwVelY },
          ],
        },
      ];
    }

    // -----------------------------------------------------------------------
    // Lifecycle / serialisation
    // -----------------------------------------------------------------------

    _release() {
      // End any drag without firing events as the instance is destroyed.
      this._dragging = false;
      super._release();
    }

    _saveToJson() {
      // The dragging state is intentionally not saved; only options persist.
      return {
        enabled: this._enabled,
        followSpeed: this._followSpeed,
        directions: this._directions,
        solidCollision: this._solidCollision,
        allowSliding: this._allowSliding,
        breakDistance: this._breakDistance,
        breakAction: this._breakAction,
        snapRadius: this._snapRadius,
        snapMode: this._snapMode,
        magnetStrength: this._magnetStrength,
        snapPositions: this._snapPositions,
        snapUids: Array.from(this._snapUids),
      };
    }

    _loadFromJson(o) {
      this._enabled = o?.enabled !== false;
      this._followSpeed = Math.max(0, safeNumber(o?.followSpeed, this._followSpeed));
      this._directions = normalizeDirections(o?.directions);
      this._solidCollision = !!o?.solidCollision;
      this._allowSliding = o?.allowSliding !== false;
      this._breakDistance = Math.max(0, safeNumber(o?.breakDistance, this._breakDistance));
      this._breakAction = o?.breakAction === "cancel" ? "cancel" : "drop";
      this._snapRadius = Math.max(0, safeNumber(o?.snapRadius, this._snapRadius));
      this._snapMode = normalizeSnapMode(o?.snapMode);
      this._magnetStrength = clamp(safeNumber(o?.magnetStrength, this._magnetStrength), 0, 1);
      this._snapPositions = Array.isArray(o?.snapPositions)
        ? o.snapPositions.map((p) => ({ x: safeNumber(p?.x, 0), y: safeNumber(p?.y, 0) }))
        : [];
      this._snapUids = new Set(Array.isArray(o?.snapUids) ? o.snapUids : []);
      // A save made mid-drag loads as not dragging.
      this._dragging = false;
      this._wasPushingSolid = false;
      this._hasThrowOverride = false;
      this._isSnapping = false;
      this._snappedUid = -1;
      this._resetThrowSampling();
    }
  };
}
