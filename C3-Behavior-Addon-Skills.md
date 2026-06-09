# Construct 3 Addon Development - Behavior Interfaces Skills

Standalone reference for behavior-side scripting interfaces.

## Why This Skill Is Useful

- Gives one behavior-focused reference for runtime scripting work.
- Reduces implementation errors by listing valid strings and control methods together.
- Makes behavior API comparison fast when choosing movement/physics/input logic.

## Table Of Contents

- Scope
- Quick Index
- Core Behavior Interfaces
- Behavior Instance Event Properties
- Tween Behavior
- Tile Movement Behavior
- Solid Behavior
- Sine Behavior
- Platform Behavior
- Physics Behavior
- Pathfinding Behavior
- Orbit Behavior
- Move To Behavior
- Line Of Sight Behavior
- Jump-thru Behavior
- Follow Behavior
- Drag And Drop Behavior
- Bullet Behavior
- Anchor Behavior
- 8 Direction Behavior
- Car Behavior

## Scope

Includes the behavior interfaces needed for scripting:

- ITweenBehaviorInstance
- ITileMovementBehaviorInstance
- ISolidBehaviorInstance
- ISineBehaviorInstance
- IPlatformBehaviorInstance
- IPhysicsBehavior
- IPhysicsBehaviorInstance
- IPathfindingBehaviorInstance
- IPathfindingMap
- IOrbitBehaviorInstance
- IMoveToBehaviorInstance
- ILOSBehaviorInstance
- ILOSBehaviorRay
- IJumpthruBehaviorInstance
- IFollowBehaviorInstance
- IDragDropBehaviorInstance
- IBulletBehaviorInstance
- IAnchorBehaviorInstance
- I8DirectionBehaviorInstance
- ICarBehaviorInstance

## Quick Index

### Core

- IBehavior
- IBehaviorType
- IBehaviorInstance
- Behavior instance event properties

### Gameplay Behaviors

- Tween
- Tile Movement
- Solid
- Sine
- Platform
- Physics
- Pathfinding
- Orbit
- Move To
- Line Of Sight
- Jump-thru
- Follow
- Drag And Drop
- Bullet
- Anchor
- 8 Direction
- Car

## Core Behavior Interfaces

### IBehavior

```js
behavior.runtime
behavior.id
behavior.getAllInstances()
IBehavior.getByConstructor(ctor)
```

### IBehaviorType

```js
behaviorType.runtime
behaviorType.behavior
behaviorType.name
```

### IBehaviorInstance

```js
behaviorInst.addEventListener(type, func, capture?)
behaviorInst.removeEventListener(type, func, capture?)
behaviorInst.dispatchEvent(e)

behaviorInst.instance
behaviorInst.behavior
behaviorInst.behaviorType
behaviorInst.runtime
```

## Behavior Instance Event Properties

Standard event object properties for behavior events:

- instance: IInstance associated with the behavior instance.
- behaviorInstance: IBehaviorInstance that fired the event.

## Tween Behavior

### ITweenBehaviorInstance APIs

```js
tween.startTween(prop, endValue, time, ease, opts?)
tween.allTweens()
tween.tweensByTags(tags)
tween.isEnabled
```

Valid prop values:

- x, y, position
- z
- width, height, size
- x-scale, y-scale, scale
- angle
- opacity
- color
- value

Built-in ease names:

- linear
- in-sine, out-sine, in-out-sine
- in-elastic, out-elastic, in-out-elastic
- in-back, out-back, in-out-back
- in-bounce, out-bounce, in-out-bounce
- in-cubic, out-cubic, in-out-cubic
- in-quadratic, out-quadratic, in-out-quadratic
- in-quartic, out-quartic, in-out-quartic
- in-quintic, out-quintic, in-out-quintic
- in-circular, out-circular, in-out-circular
- in-exponential, out-exponential, in-out-exponential

Options in opts:

- tags
- destroyOnComplete
- loop
- repeatCount
- pingPong
- startValue (value tweens)

## Tile Movement Behavior

### ITileMovementBehaviorInstance APIs

```js
tileMove.isIgnoringInput
tileMove.isDefaultControls
tileMove.simulateControl(control)
tileMove.isEnabled

tileMove.setSpeed(x, y)
tileMove.getSpeed()

tileMove.setGridPosition(x, y, immediate)
tileMove.getGridPosition()
tileMove.modifyGridDimensions(width, height, xOffset, yOffset)

tileMove.isMoving()
tileMove.isMovingDirection(direction)
tileMove.canMoveto(x, y)
tileMove.canMoveDirection(direction, distance)

tileMove.getTargetPosition()
tileMove.getGridTargetPosition()
tileMove.toGridSpace(x, y)
tileMove.fromGridSpace(x, y)
```

Valid control/direction strings:

- left, right, up, down

## Solid Behavior

### ISolidBehaviorInstance APIs

```js
solid.isEnabled
solid.usesInstanceTags

// Deprecated:
solid.tags
solid.setAllTags(iterable)
solid.getAllTags()
```

## Sine Behavior

### ISineBehaviorInstance APIs

```js
sine.movement
sine.wave
sine.period
sine.magnitude
sine.phase
sine.value
sine.updateInitialState()
sine.isEnabled
```

Movement strings:

- horizontal, vertical, forwards-backwards
- size, width, height
- angle, opacity, z-elevation, value-only

Wave strings:

- sine, triangle, sawtooth, reverse-sawtooth, square

## Platform Behavior

### IPlatformBehaviorInstance APIs

```js
platform.fallThrough()
platform.resetDoubleJump(allow)
platform.simulateControl(control)

platform.speed
platform.maxSpeed
platform.acceleration
platform.deceleration

platform.vectorX
platform.vectorY
platform.setVector(x, y)
platform.getVector()

platform.jumpStrength
platform.maxFallSpeed
platform.gravity
platform.gravityAngle
platform.isDoubleJumpEnabled
platform.jumpSustain

platform.isMoving
platform.isOnFloor
platform.isByWall(side)
platform.isJumping
platform.isFalling

platform.ceilingCollisionMode
platform.isDefaultControls
platform.isIgnoringInput
platform.isEnabled
```

Valid control strings:

- left, right, jump

Valid side strings:

- left, right

Valid ceilingCollisionMode strings:

- stop, preserve-momentum

## Physics Behavior

### IPhysicsBehavior (world-level) APIs

```js
physicsBehavior.worldGravity
physicsBehavior.steppingMode
physicsBehavior.velocityIterations
physicsBehavior.positionIterations
physicsBehavior.setCollisionsEnabled(iObjectClassA, iObjectClassB, state)
```

Valid steppingMode:

- fixed, variable

### IPhysicsBehaviorInstance APIs

```js
phys.isEnabled

phys.applyForce(fx, fy, imgPt?)
phys.applyForceTowardPosition(f, px, py, imgPt?)
phys.applyForceAtAngle(f, a, imgPt?)

phys.applyImpulse(ix, iy, imgPt?)
phys.applyImpulseTowardPosition(i, px, py, imgPt?)
phys.applyImpulseAtAngle(i, a, imgPt?)

phys.applyTorque(m)
phys.applyTorqueToAngle(m, a)
phys.applyTorqueToPosition(m, px, py)

phys.setVelocity(vx, vy)
phys.getVelocityX()
phys.getVelocityY()
phys.getVelocity()
phys.teleport(x, y)

phys.angularVelocity
phys.isImmovable
phys.isPreventRotation
phys.density
phys.friction
phys.elasticity
phys.linearDamping
phys.angularDamping
phys.isBullet

phys.mass
phys.getCenterOfMassX()
phys.getCenterOfMassY()
phys.getCenterOfMass()

phys.isAwake
phys.isSleeping // deprecated

phys.createDistanceJoint(imgPt, iOtherInst, otherImgPt, damping, freq)
phys.createRevoluteJoint(imgPt, iOtherInst)
phys.createLimitedRevoluteJoint(imgPt, iOtherInst, lower, upper)
phys.createPrismaticJoint(imgPt, iOtherInst, axisAngle, enableLimit, lowerTranslation, upperTranslation, enableMotor, motorSpeed, maxMotorForce)
phys.removeAllJoints()

phys.getContactCount()
phys.getContactX(index)
phys.getContactY(index)
phys.getContact(index)

phys.setCollisionFilter(isInclusive, tags)
```

## Pathfinding Behavior

### IPathfindingBehaviorInstance Events

- arrived

### IPathfindingBehaviorInstance APIs

```js
path.map
await path.findPath(x, y)
await path.calculatePath(fromX, fromY, toX, toY)
path.startMoving()
path.stop()

path.maxSpeed
path.speed
path.acceleration
path.deceleration
path.rotateSpeed

path.isCalculatingPath
path.isMoving
path.currentNode

path.getNodeCount()
path.getNodeXAt(i)
path.getNodeYAt(i)
path.getNodeAt(i)
path.nodes()

path.directMovementMode
path.isEnabled
```

Valid directMovementMode strings:

- none, to-destination, anywhere-along-path

### IPathfindingMap APIs

```js
map.cellSize
map.cellBorder
map.widthInCells
map.heightInCells
map.isCellObstacle(x, y)
map.isDiagonalsEnabled
map.moveCost

await map.regenerateMap()
await map.regenerateRegion(startX, startY, endX, endY)
await map.regenerateObjectRegion(objectClass)

map.startPathGroup(baseCost = 1, cellSpread = 1, maxWorkers = 1)
map.endPathGroup()
```

## Orbit Behavior

### IOrbitBehaviorInstance APIs

```js
orbit.setTargetPosition(x, y)
orbit.getTargetPosition()
orbit.pin(iWorldInst)

orbit.speed
orbit.acceleration
orbit.rotation
orbit.offsetAngle
orbit.primaryRadius
orbit.secondaryRadius
orbit.isMatchRotation
orbit.totalRotation
orbit.totalAbsoluteRotation
orbit.getDistanceToTarget()
orbit.isEnabled
```

## Move To Behavior

### IMoveToBehaviorInstance Events

- arrived
- hitsolid

### IMoveToBehaviorInstance APIs

```js
moveTo.moveToPosition(x, y, isDirect = true)

moveTo.getTargetX()
moveTo.getTargetY()
moveTo.getTargetPosition()

moveTo.getWaypointCount()
moveTo.getWaypointX(index)
moveTo.getWaypointY(index)
moveTo.getWaypoint(index)

moveTo.stop()
moveTo.isMoving
moveTo.speed
moveTo.maxSpeed
moveTo.acceleration
moveTo.deceleration
moveTo.angleOfMotion
moveTo.rotateSpeed
moveTo.isStopOnSolids
moveTo.isEnabled
```

## Line Of Sight Behavior

### ILOSBehaviorInstance APIs

```js
los.range
los.coneOfView
los.addObstacle(iObjectClass)
los.clearObstacles()
los.hasLOStoPosition(x, y)
los.hasLOSBetweenPositions(fromX, fromY, fromAngle, toX, toY)
los.castRay(fromX, fromY, toX, toY, useCollisionCells = true)
los.ray
```

### ILOSBehaviorRay APIs

```js
ray.didCollide
ray.hitX
ray.hitY
ray.getHitPosition()
ray.hitDistance
ray.hitUid

ray.getNormalX(length)
ray.getNormalY(length)
ray.getNormal(length)
ray.normalAngle

ray.getReflectionX(length)
ray.getReflectionY(length)
ray.getReflection(length)
ray.reflectionAngle
```

## Jump-thru Behavior

### IJumpthruBehaviorInstance APIs

```js
jumpthru.isEnabled
```

## Follow Behavior

### IFollowBehaviorInstance APIs

```js
follow.startFollowing(inst, fromCurrentPosition = false)
follow.stopFollowing()

follow.followInstance
follow.mode
follow.delay
follow.maxDelay
follow.historyRate

follow.clearHistory()
follow.rewindHistory(time)
follow.hasFollowData

follow.setFollowingProperty(prop, isEnabled)
follow.isFollowingProperty(prop)

follow.setPropertyInterpolation(prop, interpolation)
follow.getPropertyInterpolation(prop)

follow.startFollowingCustomProperty(customProperty, interpolation)
follow.stopFollowingCustomProperty(customProperty)
follow.isFollowingCustomProperty(customProperty)

follow.setCustomPropertyValue(customProperty, value)
follow.getDelayedCustomPropertyValue(customProperty)

follow.isPaused
follow.saveHistoryToJSON(maxDelay = 0)
follow.loadHistoryFromJSON(json)
follow.isEnabled
```

Built-in property strings:

- x, y, z-elevation, width, height, angle, opacity, visibility, destroyed

Interpolation strings:

- step, linear, angular

## Drag And Drop Behavior

### IDragDropBehaviorInstance Events

- dragstart
- drop

### IDragDropBehaviorInstance APIs

```js
dragDrop.axes
dragDrop.drop()
dragDrop.isDragging
dragDrop.isEnabled
```

Valid axes strings:

- horizontal, vertical, both

## Bullet Behavior

### IBulletBehaviorInstance APIs

```js
bullet.speed
bullet.acceleration
bullet.gravity
bullet.angleOfMotion
bullet.bounceOffSolids
bullet.distanceTravelled
bullet.isEnabled
```

## Anchor Behavior

### IAnchorBehaviorInstance APIs

```js
anchor.isEnabled
```

## 8 Direction Behavior

### I8DirectionBehaviorInstance APIs

```js
dir8.stop()
dir8.reverse()
dir8.simulateControl(control)

dir8.speed
dir8.maxSpeed
dir8.acceleration
dir8.deceleration

dir8.vectorX
dir8.vectorY
dir8.setVector(x, y)
dir8.getVector()

dir8.isAllowSliding
dir8.isDefaultControls
dir8.isIgnoringInput
dir8.isEnabled
```

Valid control strings:

- left, right, up, down

## Car Behavior

### ICarBehaviorInstance APIs

```js
car.stop()
car.simulateControl(control)

car.speed
car.maxSpeed
car.acceleration
car.deceleration

car.vectorX
car.vectorY
car.getVector()
car.angleOfMotion

car.steerSpeed
car.driftRecover
car.friction
car.turnWhileStopped

car.isDefaultControls
car.isIgnoringInput
car.isEnabled
```

Valid control strings:

- left, right, up, down
