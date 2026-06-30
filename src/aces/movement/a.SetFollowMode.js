export const config = {
  listName: "Set follow mode",
  displayText: "{my}: Set follow mode to {0}",
  description:
    "Switches how the object moves toward the drag point: Instant (snap each tick), Constant Speed (uses Follow Speed), or Spring Physics (uses Spring Stiffness and Damping).",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "Instant = snap each tick, Constant Speed = fixed pixels/second, Spring Physics = spring-damper acceleration.",
      type: "combo",
      initialValue: "instant",
      items: [
        { instant: "Instant" },
        { speed: "Constant Speed" },
        { spring: "Spring Physics" },
      ],
    },
  ],
};

export const expose = true;

export default function (mode) {
  this._setFollowMode(mode);
}
