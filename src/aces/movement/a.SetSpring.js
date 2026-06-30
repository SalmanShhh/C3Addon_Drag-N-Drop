export const config = {
  listName: "Set spring",
  displayText: "{my}: Set spring stiffness {0} damping {1}",
  description:
    "Sets the spring-physics parameters. Stiffness controls pull strength (pixels/s^2 per pixel of displacement); damping controls oscillation bleed-off (1/s). Does not switch the follow mode — use Set follow mode to Spring Physics first.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "stiffness",
      name: "Stiffness",
      desc: "Spring acceleration in pixels/s^2 per pixel of displacement. 300 is responsive and lively; raise for a snappier feel.",
      type: "number",
      initialValue: "300",
    },
    {
      id: "damping",
      name: "Damping",
      desc: "Velocity bleed-off in 1/s. 20 gives a gentle overshoot; ~2*sqrt(stiffness) = critically damped; higher = overdamped.",
      type: "number",
      initialValue: "20",
    },
  ],
};

export const expose = true;

export default function (stiffness, damping) {
  this._setSpring(stiffness, damping);
}
