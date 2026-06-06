export const config = {
  listName: "Set follow speed",
  displayText: "Set follow speed to {0}",
  description: "Sets the lerp speed for following the anchor.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "speed",
      name: "Speed",
      desc: "Pixels per second. 0 means instant snap.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (speed) {
  this._setFollowSpeed(speed);
}
