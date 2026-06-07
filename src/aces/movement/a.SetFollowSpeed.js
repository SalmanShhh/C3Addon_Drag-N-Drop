export const config = {
  listName: "Set follow speed",
  displayText: "Set follow speed to {0}",
  description:
    "How fast the object catches up to the drag point, in pixels per second. 0 = instant snap.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "speed",
      name: "Speed",
      desc: "Pixels per second. 0 means the object snaps to the drag point each tick.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (speed) {
  this._setFollowSpeed(speed);
}
