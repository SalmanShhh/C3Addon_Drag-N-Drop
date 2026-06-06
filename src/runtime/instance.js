import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

const MAX_HISTORY = 8;

// Small helpers keep the drag logic readable and easy to tweak later.
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeAxisLock(value) {
  if (value === 1 || value === "1" || value === "horizontal") {
    return "horizontal";
  }
  if (value === 2 || value === "2" || value === "vertical") {
    return "vertical";
  }
  return "none";
}

function normalizeGrabMode(value) {
  if (value === 1 || value === "1" || value === "snap_to_anchor") {
    return "snap_to_anchor";
  }
  return "keep_offset";
}

function getObjectCenter(object) {
  const x = safeNumber(object?.x, 0);
  const y = safeNumber(object?.y, 0);
  const width = safeNumber(object?.width, 0);
  const height = safeNumber(object?.height, 0);
  return { x: x + width / 2, y: y + height / 2 };
}

function getInstanceBounds(instance) {
  if (!instance) {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }

  if (typeof instance.getBoundingBox === "function") {
    const box = instance.getBoundingBox();
    if (box) {
      return {
        left: safeNumber(box.left, safeNumber(instance.x, 0)),
        top: safeNumber(box.top, safeNumber(instance.y, 0)),
        right: safeNumber(box.right, safeNumber(instance.x, 0) + safeNumber(instance.width, 0)),
        bottom: safeNumber(box.bottom, safeNumber(instance.y, 0) + safeNumber(instance.height, 0)),
        width: safeNumber(box.right, safeNumber(instance.width, 0)) - safeNumber(box.left, safeNumber(instance.x, 0)),
        height: safeNumber(box.bottom, safeNumber(instance.height, 0)) - safeNumber(box.top, safeNumber(instance.y, 0)),
      };
    }
  }

  const x = safeNumber(instance.x, 0);
  const y = safeNumber(instance.y, 0);
  const width = safeNumber(instance.width, 0);
  const height = safeNumber(instance.height, 0);

  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    width,
    height,
  };
}

function getSeparationCandidate(objectBox, otherBox) {
  const left = otherBox.right - objectBox.left;
  const right = objectBox.right - otherBox.left;
  const top = otherBox.bottom - objectBox.top;
  const bottom = objectBox.bottom - otherBox.top;

  const candidates = [
    { axis: "x", amount: left, direction: 1 },
    { axis: "x", amount: right, direction: -1 },
    { axis: "y", amount: top, direction: 1 },
    { axis: "y", amount: bottom, direction: -1 },
  ].filter((candidate) => candidate.amount > 1e-4);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, candidate) =>
    candidate.amount < best.amount ? candidate : best
  );
}

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      // Per-frame drag updates are handled in _tick(), so enable ticking once here.
      this._setTicking(true);
      this.events = {};

      // Runtime state owned by this behavior.
      this._enabled = true;
      this._held = false;
      this._anchorX = 0;
      this._anchorY = 0;
      this._prevAnchorX = 0;
      this._prevAnchorY = 0;
      this._grabOriginX = 0;
      this._grabOriginY = 0;
      this._grabOffsetX = 0;
      this._grabOffsetY = 0;
      this._axisLock = "none";
      this._distanceClamp = 0;
      this._followSpeed = 0;
      this._throwVelX = 0;
      this._throwVelY = 0;
      this._throwSpeed = 0;
      this._overrideThrowVelX = 0;
      this._overrideThrowVelY = 0;
      this._hasThrowOverride = false;
      this._history = [];
      this._historyCursor = 0;
      this._distanceFromOrigin = 0;
      this._distanceLimitReached = false;
      this._wasThrown = false;
    }

    onCreate() {
      // The panel property is stored as a boolean named "enabled".
      const startEnabled = this._getProperty("enabled");
      this._enabled = startEnabled !== false;
      this._anchorX = safeNumber(this.instance?.x, 0);
      this._anchorY = safeNumber(this.instance?.y, 0);
      this._prevAnchorX = this._anchorX;
      this._prevAnchorY = this._anchorY;
    }

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

    _tick() {
      // If the behavior is disabled, not currently grabbed, or the instance is gone,
      // there is nothing to position or sample this frame.
      if (!this._enabled || !this._held || !this.instance) {
        return;
      }

      const dt = safeNumber(this.runtime?.dt, 0);
      const currentAnchorX = this._anchorX;
      const currentAnchorY = this._anchorY;
      let targetX = currentAnchorX + this._grabOffsetX;
      let targetY = currentAnchorY + this._grabOffsetY;

      if (this._axisLock === "horizontal") {
        targetY = this._grabOriginY;
      } else if (this._axisLock === "vertical") {
        targetX = this._grabOriginX;
      }

      const deltaX = targetX - this._grabOriginX;
      const deltaY = targetY - this._grabOriginY;
      this._distanceFromOrigin = Math.hypot(deltaX, deltaY);

      // Apply the distance clamp after any axis lock so the final target stays valid.
      if (
        this._distanceClamp > 0 &&
        this._distanceFromOrigin > this._distanceClamp
      ) {
        const ratio = this._distanceClamp / Math.max(this._distanceFromOrigin, 1e-5);
        targetX = this._grabOriginX + deltaX * ratio;
        targetY = this._grabOriginY + deltaY * ratio;
        if (!this._distanceLimitReached) {
          this._distanceLimitReached = true;
          this._trigger("OnDistanceLimitReached");
        }
      } else {
        this._distanceLimitReached = false;
      }

      // Move the object toward the resolved target. A speed of 0 gives instant snap.
      if (this._followSpeed > 0 && dt > 0) {
        const amount = clamp(this._followSpeed * dt, 0, 1);
        this.instance.x += (targetX - this.instance.x) * amount;
        this.instance.y += (targetY - this.instance.y) * amount;
      } else {
        this.instance.x = targetX;
        this.instance.y = targetY;
      }

      // Resolve overlaps after the position update so dragging does not tunnel into
      // solid or custom obstacle instances while the object is being moved.
      this._resolveCollisions();

      this._distanceFromOrigin = Math.hypot(
        this.instance.x - this._grabOriginX,
        this.instance.y - this._grabOriginY
      );

      // Sample velocity from the last anchor delta so the release event can report momentum.
      if (dt > 0) {
        const velocityX = (currentAnchorX - this._prevAnchorX) / dt;
        const velocityY = (currentAnchorY - this._prevAnchorY) / dt;
        this._recordVelocity(velocityX, velocityY);
      }

      this._prevAnchorX = currentAnchorX;
      this._prevAnchorY = currentAnchorY;
    }

    _getCollisionCandidates() {
      if (!this.runtime?.objects) {
        return [];
      }

      const candidates = [];
      for (const objectType of this.runtime.objects) {
        if (!objectType?.getAllInstances) {
          continue;
        }

        for (const instance of objectType.getAllInstances()) {
          if (instance && instance !== this.instance) {
            candidates.push(instance);
          }
        }
      }

      return candidates;
    }

    _resolveCollisions() {
      if (!this.instance) {
        return;
      }

      for (let pass = 0; pass < 4; pass += 1) {
        let shifted = false;
        const objectBox = getInstanceBounds(this.instance);

        for (const other of this._getCollisionCandidates()) {
          if (!other || typeof other.testOverlap !== "function") {
            continue;
          }

          if (!other.testOverlap(this.instance)) {
            continue;
          }

          const otherBox = getInstanceBounds(other);
          const candidate = getSeparationCandidate(objectBox, otherBox);
          if (!candidate) {
            continue;
          }

          if (candidate.axis === "x") {
            this.instance.x += candidate.direction * candidate.amount;
          } else {
            this.instance.y += candidate.direction * candidate.amount;
          }

          shifted = true;
          break;
        }

        if (!shifted) {
          break;
        }
      }
    }

    _recordVelocity(velocityX, velocityY) {
      const samples = this._history.length;
      this._history[this._historyCursor] = { velocityX, velocityY };
      this._historyCursor = (this._historyCursor + 1) % MAX_HISTORY;
      if (samples < MAX_HISTORY) {
        this._history.length = Math.min(samples + 1, MAX_HISTORY);
      }
    }

    _computeThrowVelocity() {
      const history = this._history.length > 0 ? this._history : [{ velocityX: 0, velocityY: 0 }];
      const totalX = history.reduce((sum, item) => sum + (item.velocityX ?? 0), 0);
      const totalY = history.reduce((sum, item) => sum + (item.velocityY ?? 0), 0);
      const count = history.length || 1;
      return {
        x: totalX / count,
        y: totalY / count,
      };
    }

    _finalizeRelease(computeThrow = true) {
      // Release ends the drag and converts the recent anchor samples into throw data.
      if (!this._held) {
        return false;
      }

      const throwVelocity = this._computeThrowVelocity();
      const overrideX = this._hasThrowOverride ? this._overrideThrowVelX : null;
      const overrideY = this._hasThrowOverride ? this._overrideThrowVelY : null;
      this._throwVelX = computeThrow
        ? (this._hasThrowOverride ? overrideX : throwVelocity.x)
        : 0;
      this._throwVelY = computeThrow
        ? (this._hasThrowOverride ? overrideY : throwVelocity.y)
        : 0;
      this._throwSpeed = Math.hypot(this._throwVelX, this._throwVelY);
      this._wasThrown = this._throwSpeed > 0.001;
      this._held = false;
      this._distanceLimitReached = false;
      this._history = [];
      this._historyCursor = 0;
      this._overrideThrowVelX = 0;
      this._overrideThrowVelY = 0;
      this._hasThrowOverride = false;
      return true;
    }

    _cancelCurrentGrab() {
      if (!this._held) {
        return;
      }

      this._held = false;
      this._distanceLimitReached = false;
      this._history = [];
      this._historyCursor = 0;
      this._trigger("OnGrabCancelled");
    }

    _beginGrab(anchorX, anchorY, grabMode) {
      // Start a drag by recording the current object position, anchor, and offset.
      if (this._held) {
        return;
      }

      const currentPosition = this.instance
        ? { x: safeNumber(this.instance.x, 0), y: safeNumber(this.instance.y, 0) }
        : { x: 0, y: 0 };
      const nextAnchorX = safeNumber(anchorX, currentPosition.x);
      const nextAnchorY = safeNumber(anchorY, currentPosition.y);
      const mode = normalizeGrabMode(grabMode);

      this._grabOriginX = currentPosition.x;
      this._grabOriginY = currentPosition.y;
      this._anchorX = nextAnchorX;
      this._anchorY = nextAnchorY;
      this._prevAnchorX = nextAnchorX;
      this._prevAnchorY = nextAnchorY;
      this._grabOffsetX = mode === "keep_offset" ? currentPosition.x - nextAnchorX : 0;
      this._grabOffsetY = mode === "keep_offset" ? currentPosition.y - nextAnchorY : 0;
      this._held = true;
      this._wasThrown = false;
      this._distanceLimitReached = false;
      this._history = [];
      this._historyCursor = 0;
      this._hasThrowOverride = false;
      this._trigger("OnGrabbed");
    }

    _grab(anchorX, anchorY, grabMode) {
      if (this._held) {
        return;
      }
      this._beginGrab(anchorX, anchorY, grabMode);
    }

    _forceGrab(anchorX, anchorY, grabMode) {
      if (this._held) {
        const released = this._finalizeRelease(true);
        if (released) {
          this._trigger("OnReleased");
        }
      }
      this._beginGrab(anchorX, anchorY, grabMode);
    }

    _releaseGrab() {
      if (!this._held) {
        return;
      }
      const released = this._finalizeRelease(true);
      if (released) {
        this._trigger("OnReleased");
      }
    }

    _cancelGrab() {
      this._cancelCurrentGrab();
    }

    _setAnchor(x, y) {
      this._anchorX = safeNumber(x, this._anchorX);
      this._anchorY = safeNumber(y, this._anchorY);
    }

    _setAnchorToObject(object) {
      const center = getObjectCenter(object);
      this._anchorX = center.x;
      this._anchorY = center.y;
    }

    _setGrabOffset(offsetX, offsetY) {
      this._grabOffsetX = safeNumber(offsetX, this._grabOffsetX);
      this._grabOffsetY = safeNumber(offsetY, this._grabOffsetY);
    }

    _setAxisLock(axis) {
      this._axisLock = normalizeAxisLock(axis);
    }

    _setDistanceClamp(radius) {
      this._distanceClamp = Math.max(0, safeNumber(radius, 0));
    }

    _setFollowSpeed(speed) {
      this._followSpeed = Math.max(0, safeNumber(speed, 0));
    }

    _setThrowVelocity(velX, velY) {
      this._overrideThrowVelX = safeNumber(velX, 0);
      this._overrideThrowVelY = safeNumber(velY, 0);
      this._hasThrowOverride = true;
    }

    _clearThrowVelocity() {
      this._overrideThrowVelX = 0;
      this._overrideThrowVelY = 0;
      this._hasThrowOverride = false;
    }

    _setEnabled(enabled) {
      const nextEnabled = !!enabled;
      if (!nextEnabled && this._held) {
        this._cancelCurrentGrab();
      }
      this._enabled = nextEnabled;
    }

    _getDebuggerProperties() {
      return [
        {
          title: "$" + this.behaviorType.name,
          properties: [
            { name: "$held", value: this._held, onedit: (value) => { this._held = !!value; } },
            { name: "$enabled", value: this._enabled, onedit: (value) => { this._enabled = !!value; } },
            { name: "$anchorX", value: this._anchorX, onedit: (value) => { this._anchorX = safeNumber(value, this._anchorX); } },
            { name: "$anchorY", value: this._anchorY, onedit: (value) => { this._anchorY = safeNumber(value, this._anchorY); } },
            { name: "$grabOriginX", value: this._grabOriginX, onedit: (value) => { this._grabOriginX = safeNumber(value, this._grabOriginX); } },
            { name: "$grabOriginY", value: this._grabOriginY, onedit: (value) => { this._grabOriginY = safeNumber(value, this._grabOriginY); } },
            { name: "$throwVelX", value: this._throwVelX, onedit: (value) => { this._throwVelX = safeNumber(value, this._throwVelX); } },
            { name: "$throwVelY", value: this._throwVelY, onedit: (value) => { this._throwVelY = safeNumber(value, this._throwVelY); } },
            { name: "$throwSpeed", value: this._throwSpeed, onedit: (value) => { this._throwSpeed = Math.max(0, safeNumber(value, this._throwSpeed)); } },
            { name: "$distanceFromOrigin", value: this._distanceFromOrigin, onedit: (value) => { this._distanceFromOrigin = Math.max(0, safeNumber(value, this._distanceFromOrigin)); } },
            { name: "$axisLock", value: this._axisLock },
            { name: "$distanceClamp", value: this._distanceClamp, onedit: (value) => { this._distanceClamp = Math.max(0, safeNumber(value, this._distanceClamp)); } },
            { name: "$followSpeed", value: this._followSpeed, onedit: (value) => { this._followSpeed = Math.max(0, safeNumber(value, this._followSpeed)); } },
          ],
        },
      ];
    }

    _release() {
      if (this._held) {
        this._cancelCurrentGrab();
      }
      super._release();
    }

    _saveToJson() {
      return {
        held: this._held,
        enabled: this._enabled,
        anchorX: this._anchorX,
        anchorY: this._anchorY,
        grabOriginX: this._grabOriginX,
        grabOriginY: this._grabOriginY,
        axisLock: this._axisLock,
        distanceClamp: this._distanceClamp,
        followSpeed: this._followSpeed,
        throwVelX: this._throwVelX,
        throwVelY: this._throwVelY,
        throwSpeed: this._throwSpeed,
      };
    }

    _loadFromJson(o) {
      this._enabled = o?.enabled !== false;
      this._held = false;
      this._anchorX = safeNumber(o?.anchorX, this._anchorX);
      this._anchorY = safeNumber(o?.anchorY, this._anchorY);
      this._grabOriginX = safeNumber(o?.grabOriginX, this._grabOriginX);
      this._grabOriginY = safeNumber(o?.grabOriginY, this._grabOriginY);
      this._axisLock = normalizeAxisLock(o?.axisLock);
      this._distanceClamp = Math.max(0, safeNumber(o?.distanceClamp, this._distanceClamp));
      this._followSpeed = Math.max(0, safeNumber(o?.followSpeed, this._followSpeed));
      this._throwVelX = safeNumber(o?.throwVelX, 0);
      this._throwVelY = safeNumber(o?.throwVelY, 0);
      this._throwSpeed = safeNumber(o?.throwSpeed, 0);
      this._wasThrown = this._throwSpeed > 0.001;
    }
  };
}
