export const config = {
  listName: "Set throw velocity",
  displayText: "Set throw velocity to {0}, {1}",
  description: "Overrides the velocity that is reported on release.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "velX",
      name: "Velocity X",
      desc: "X component of the throw velocity.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "velY",
      name: "Velocity Y",
      desc: "Y component of the throw velocity.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (velX, velY) {
  this._setThrowVelocity(velX, velY);
}
