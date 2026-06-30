export const config = {
  listName: "Set follow mode",
  displayText: "{my}: Set follow mode to {0}",
  description:
    "Switches how the object moves toward the drag point: Instant (snap each tick), Constant Speed (uses Follow Speed), Spring Physics (uses Spring Stiffness and Damping), or Grid (snaps to a tile grid set by the Set grid action).",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "Instant = snap each tick, Constant Speed = fixed pixels/second, Spring Physics = spring-damper acceleration, Grid = snap to a tile grid.",
      type: "combo",
      initialValue: "instant",
      items: [
        { instant: "Instant" },
        { speed: "Constant Speed" },
        { spring: "Spring Physics" },
        { grid: "Grid" },
      ],
    },
  ],
};

export const expose = true;

export default function (mode) {
  this._setFollowMode(mode);
}
