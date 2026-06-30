import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

// How many recent drag-point velocity samples feed the throw average.
const MAX_HISTORY = 8;
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

// ["instant", "speed", "spring"]
function normalizeFollowMode(value) {
  switch (value) {
    case 1: case "1": case "speed":  return "speed";
    case 2: case "2": case "spring": return "spring";
    default:                          return "instant";
  }
}

// Rounds a movement step (dx, dy) to the chosen direction set by snapping the
// step's direction and projecting onto it. This rounds the way the drag is
// actually moving this tick, so the object travels in 4 / 8 direction lines.
function constrainStep(dx, dy, mode) {
  switch (mode) {
    case "up_down":
      return [0, dy];
    case "left_right":
      return [dx, 0];
    case "four_dir":
      // Move along whichever cardinal axis this step leans toward most.
      return Math.abs(dx) >= Math.abs(dy) ? [dx, 0] : [0, dy];
    case "eight_dir": {
      if (dx === 0 && dy === 0) return [0, 0];
      // Snap the step's angle to the nearest 45 degrees, then project onto it.
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
      this._followSpeed     = Math.max(0, safeNumber(properties[0], 0));
      this._directions      = normalizeDirections(properties[1]);
      this._breakDistance   = Math.max(0, safeNumber(properties[2], 0));
      this._followMode      = normalizeFollowMode(properties[3]);
      this._springStiffness = Math.max(0, safeNumber(properties[4], 0));
      this._springDamping   = Math.max(0, safeNumber(properties[5], 0));
      this._enabled         = properties[6] !== false;

      // Break action is action-driven only (no panel row); defaults to drop.
      this._breakAction = "drop";

      // Drag lifecycle state.
      this._dragging = false;
      // UID of an object the drag point is glued to each tick, or -1 for a
      // free point (StartDragAtObject sets this; manual point updates clear it).
      this._followUid = -1;
      this._dragPointX = 0;
      this._dragPointY = 0;
      this._prevDragPointX = 0;
      this._prevDragPointY = 0;

      // Grab mode offset (object position minus drag point at grab time).
      this._grabOffsetX = 0;
      this._grabOffsetY = 0;

      // Live measurement.
      this._distanceFromPoint = 0;

      // Throw measurement + override.
      this._throwVelX = 0;
      this._throwVelY = 0;
      this._throwSpeed = 0;
      this._overrideThrowVelX = 0;
      this._overrideThrowVelY = 0;
      this._hasThrowOverride = false;
      this._history = [];
      this._historyCursor = 0;

      // Spring-physics follow state.
      this._springVelX = 0;
      this._springVelY = 0;

      // Why the last drag ended: "manual" or "broke_distance".
      this._dropReason = "manual";

      // Snap / magnet (homing) state. Disabled until a radius is set (radius mode).
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

      // Glued drag: keep the drag point on the followed object so the dragged
      // object sticks to a moving target. If that object is gone, fall back to
      // a fixed-point drag at the last known position.
      if (this._followUid !== -1) {
        const followed = this._getInstanceByUid(this._followUid);
        if (followed) {
          this._dragPointX = safeNumber(followed.x, this._dragPointX);
          this._dragPointY = safeNumber(followed.y, this._dragPointY);
        } else {
          this._followUid = -1;
        }
      }

      // Per-instance dt respects any timeScale the developer set on the object.
      const dt = safeNumber(this.instance.dt, 0);

      // Resolve the target from the drag point and the grab offset.
      let targetX = this._dragPointX + this._grabOffsetX;
      let targetY = this._dragPointY + this._grabOffsetY;

      // Direction lock: round THIS tick's movement (from the object toward the
      // target) to the allowed direction set, so the drag travels in 4/8 lines.
      if (this._directions !== "free") {
        const [cdx, cdy] = constrainStep(
          targetX - this.instance.x,
          targetY - this.instance.y,
          this._directions
        );
        targetX = this.instance.x + cdx;
        targetY = this.instance.y + cdy;
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

      // Mode-dispatched movement: each mode is self-contained and predictable.
      switch (this._followMode) {
        case "spring": {
          if (dt > 0) {
            // Semi-implicit Euler: update velocity first, then position.
            // Hooke's law restoring force minus viscous damping.
            const ax = this._springStiffness * (targetX - this.instance.x) - this._springDamping * this._springVelX;
            const ay = this._springStiffness * (targetY - this.instance.y) - this._springDamping * this._springVelY;
            this._springVelX += ax * dt;
            this._springVelY += ay * dt;
            this.instance.x += this._springVelX * dt;
            this.instance.y += this._springVelY * dt;
          }
          break;
        }
        case "speed": {
          if (this._followSpeed > 0 && dt > 0) {
            const dx = targetX - this.instance.x;
            const dy = targetY - this.instance.y;
            const dist = Math.hypot(dx, dy);
            const maxStep = this._followSpeed * dt;
            if (dist > maxStep && dist > 1e-6) {
              const ratio = maxStep / dist;
              this.instance.x += dx * ratio;
              this.instance.y += dy * ratio;
            } else {
              this.instance.x = targetX;
              this.instance.y = targetY;
            }
          } else {
            this.instance.x = targetX;
            this.instance.y = targetY;
          }
          break;
        }
        default: // "instant" — SDK v2 position setters invalidate the bounding box automatically.
          this.instance.x = targetX;
          this.instance.y = targetY;
          break;
      }

      // Gap between the object and the drag point; grows when the object cannot
      // keep up (a slow follow speed and a fast-moving drag point).
      this._distanceFromPoint = Math.hypot(
        this.instance.x - this._dragPointX,
        this.instance.y - this._dragPointY
      );

      // Live snap state for the Is Snapping condition and SnapTarget expressions.
      this._updateSnapState();

      // Sample velocity for throw: spring mode uses the object's own velocity
      // (physically correct); other modes use the drag-point delta (hand speed).
      if (dt > 0) {
        if (this._followMode === "spring") {
          this._recordVelocity(this._springVelX, this._springVelY);
        } else {
          this._recordVelocity(
            (this._dragPointX - this._prevDragPointX) / dt,
            (this._dragPointY - this._prevDragPointY) / dt
          );
        }
      }
      this._prevDragPointX = this._dragPointX;
      this._prevDragPointY = this._dragPointY;

      // Tear-free model: once the gap outgrows the break distance, end the drag.
      if (this._breakDistance > 0 && this._distanceFromPoint > this._breakDistance) {
        this._endDrag(this._breakAction !== "cancel", "broke_distance");
      }
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

      this._dragging = true;
      // A plain point-based start is not glued to any object.
      this._followUid = -1;
      this._dropReason = "manual";
      this._distanceFromPoint = 0;
      this._hasThrowOverride = false;
      this._throwVelX = 0;
      this._throwVelY = 0;
      this._throwSpeed = 0;
      this._springVelX = 0;
      this._springVelY = 0;
      this._isSnapping = false;
      this._snappedUid = -1;
      this._resetThrowSampling();

      this._trigger("OnDragStarted");
    }

    // Like _startDrag, but begins at the target object's position and keeps the
    // drag point glued to it each tick so the dragged object sticks to it.
    _startDragAtObject(object, grabMode) {
      if (!this._enabled || this._dragging || !this.instance) {
        return;
      }
      const target = this._resolveInstance(object);
      if (!target) {
        return;
      }
      this._startDrag(target.x, target.y, grabMode);
      // _startDrag clears _followUid; glue on only once the drag has started.
      if (this._dragging) {
        this._followUid = target.uid;
      }
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
      this._followUid = -1;
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

    // Resolve an object param to a single world instance: the picked instance,
    // or the first of an object type. Returns null when nothing usable is found.
    _resolveInstance(object) {
      if (!object) {
        return null;
      }
      // Mirror _addSnapObject: the param is usually a single picked instance,
      // but tolerate an object type by taking its first instance.
      if (typeof object.uid === "number") {
        return object;
      }
      if (typeof object.getAllInstances === "function") {
        const all = object.getAllInstances();
        return all && all.length ? all[0] : null;
      }
      return null;
    }

    _setDragPoint(x, y) {
      // A manual point update takes over from any glued-object follow.
      this._followUid = -1;
      this._dragPointX = safeNumber(x, this._dragPointX);
      this._dragPointY = safeNumber(y, this._dragPointY);
    }

    _setDragPointToObject(object) {
      const target = this._resolveInstance(object);
      if (target) {
        this._setDragPoint(target.x, target.y);
      }
    }

    _setFollowSpeed(speed) {
      this._followSpeed = Math.max(0, safeNumber(speed, 0));
    }

    _setFollowMode(mode) {
      const prev = this._followMode;
      this._followMode = normalizeFollowMode(mode);
      // Clear spring velocity when leaving spring mode so residual velocity
      // does not carry over if the mode is switched back during a drag.
      if (prev === "spring" && this._followMode !== "spring") {
        this._springVelX = 0;
        this._springVelY = 0;
      }
    }

    _setSpring(stiffness, damping) {
      this._springStiffness = Math.max(0, safeNumber(stiffness, 0));
      this._springDamping   = Math.max(0, safeNumber(damping, 0));
    }

    _setDirections(directions) {
      this._directions = normalizeDirections(directions);
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
        this._followUid = -1;
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
            { name: "$followMode", value: this._followMode, onedit: (v) => { this._setFollowMode(v); } },
            { name: "$springStiffness", value: this._springStiffness, onedit: (v) => { this._springStiffness = Math.max(0, safeNumber(v, 0)); } },
            { name: "$springDamping", value: this._springDamping, onedit: (v) => { this._springDamping = Math.max(0, safeNumber(v, 0)); } },
            { name: "$springVelX", value: this._springVelX },
            { name: "$springVelY", value: this._springVelY },
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
      this._followUid = -1;
      super._release();
    }

    _saveToJson() {
      // The dragging state is not saved; only the scalar options persist.
      return {
        enabled: this._enabled,
        followSpeed: this._followSpeed,
        directions: this._directions,
        breakDistance: this._breakDistance,
        breakAction: this._breakAction,
        followMode: this._followMode,
        springStiffness: this._springStiffness,
        springDamping: this._springDamping,
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
      this._breakDistance = Math.max(0, safeNumber(o?.breakDistance, this._breakDistance));
      this._breakAction = o?.breakAction === "cancel" ? "cancel" : "drop";
      // Fall back to the panel-configured mode when an older save lacks the field.
      this._followMode = o?.followMode !== undefined ? normalizeFollowMode(o.followMode) : this._followMode;
      this._springStiffness = Math.max(0, safeNumber(o?.springStiffness, this._springStiffness));
      this._springDamping   = Math.max(0, safeNumber(o?.springDamping,   this._springDamping));
      this._snapRadius = Math.max(0, safeNumber(o?.snapRadius, this._snapRadius));
      this._snapMode = normalizeSnapMode(o?.snapMode);
      this._magnetStrength = clamp(safeNumber(o?.magnetStrength, this._magnetStrength), 0, 1);
      this._snapPositions = Array.isArray(o?.snapPositions)
        ? o.snapPositions.map((p) => ({ x: safeNumber(p?.x, 0), y: safeNumber(p?.y, 0) }))
        : [];
      this._snapUids = new Set(Array.isArray(o?.snapUids) ? o.snapUids : []);
      // A save made mid-drag loads as not dragging.
      this._dragging = false;
      this._followUid = -1;
      this._hasThrowOverride = false;
      this._isSnapping = false;
      this._snappedUid = -1;
      this._resetThrowSampling();
    }
  };
}
