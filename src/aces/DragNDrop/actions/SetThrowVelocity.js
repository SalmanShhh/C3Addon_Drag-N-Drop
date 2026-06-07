export const config = {
  listName: "Set throw velocity",
  displayText: "Set throw velocity to ({0}, {1})",
  description:
    "Overrides the measured throw before a release. Pass 0, 0 to suppress the throw entirely.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "velX",
      name: "Velocity X",
      desc: "X component of the throw velocity to report on the next release.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "velY",
      name: "Velocity Y",
      desc: "Y component of the throw velocity to report on the next release.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (velX, velY) {
  this._setThrowVelocity(velX, velY);
}
