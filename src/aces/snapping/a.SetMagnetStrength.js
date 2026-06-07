export const config = {
  listName: "Set magnet strength",
  displayText: "Set magnet strength to {0}",
  description:
    "How strongly the object is pulled toward an in-range snap target while dragging, from 0 (snap only on drop) to 1 (strong homing).",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "strength",
      name: "Strength",
      desc: "0 = no live pull (snap on drop only); 1 = strong magnetism.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (strength) {
  this._setMagnetStrength(strength);
}
